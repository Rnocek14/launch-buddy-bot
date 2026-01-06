-- =============================================
-- SCORE HISTORY TRACKING
-- =============================================

-- Create table to store risk score history for trend visualization
CREATE TABLE public.risk_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high', 'critical')),
    total_accounts INTEGER NOT NULL DEFAULT 0,
    old_accounts_count INTEGER NOT NULL DEFAULT 0,
    sensitive_accounts_count INTEGER NOT NULL DEFAULT 0,
    unmatched_domains_count INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient user lookups
CREATE INDEX idx_risk_score_history_user_id ON public.risk_score_history(user_id);
CREATE INDEX idx_risk_score_history_recorded_at ON public.risk_score_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.risk_score_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own score history
CREATE POLICY "Users can view their own score history"
ON public.risk_score_history FOR SELECT
USING (auth.uid() = user_id);

-- Only system can insert (via edge function)
CREATE POLICY "System can insert score history"
ON public.risk_score_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- REFERRAL CHALLENGE SYSTEM
-- =============================================

-- Create referral codes table
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL UNIQUE,
    uses_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for code lookups
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);

-- Create referral conversions table to track who used which code
CREATE TABLE public.referral_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
    referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reward_granted_at TIMESTAMPTZ DEFAULT NULL,
    reward_type TEXT DEFAULT NULL -- 'free_deletion', 'premium_week', etc.
);

-- Create challenges table for viral challenges
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('score_comparison', 'cleanup_race', 'share_challenge')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    prize_description TEXT DEFAULT NULL,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create challenge participants table
CREATE TABLE public.challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    starting_score INTEGER,
    current_score INTEGER,
    rank INTEGER DEFAULT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Referral codes policies
CREATE POLICY "Users can view their own referral codes"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can look up a referral code"
ON public.referral_codes FOR SELECT
USING (true);

-- Referral conversions policies
CREATE POLICY "Users can view conversions they made or received"
ON public.referral_conversions FOR SELECT
USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Authenticated users can insert conversions"
ON public.referral_conversions FOR INSERT
WITH CHECK (auth.uid() = referred_user_id);

-- Challenges policies (public read for active challenges)
CREATE POLICY "Anyone can view active challenges"
ON public.challenges FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
ON public.challenges FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants"
ON public.challenge_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
ON public.challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$;

-- Function to use a referral code
CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral_code RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Look up the referral code
    SELECT * INTO v_referral_code
    FROM referral_codes
    WHERE code = upper(p_code)
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses);
    
    IF v_referral_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired referral code');
    END IF;
    
    -- Check if user is trying to use their own code
    IF v_referral_code.user_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;
    
    -- Check if user already used a referral code
    IF EXISTS(SELECT 1 FROM referral_conversions WHERE referred_user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;
    
    -- Record the conversion
    INSERT INTO referral_conversions (referral_code_id, referrer_user_id, referred_user_id)
    VALUES (v_referral_code.id, v_referral_code.user_id, v_user_id);
    
    -- Increment uses count
    UPDATE referral_codes SET uses_count = uses_count + 1, updated_at = now()
    WHERE id = v_referral_code.id;
    
    RETURN jsonb_build_object('success', true, 'referrer_id', v_referral_code.user_id);
END;
$$;