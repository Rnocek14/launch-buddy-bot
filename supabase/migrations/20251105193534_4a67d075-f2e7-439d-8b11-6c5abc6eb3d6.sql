-- Create service catalog table (reference data for known services)
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  homepage_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user services table (discovered accounts per user)
CREATE TABLE public.user_services (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.service_catalog(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, service_id)
);

-- Create indexes for performance
CREATE INDEX idx_service_catalog_domain ON public.service_catalog(domain);
CREATE INDEX idx_user_services_user ON public.user_services(user_id);
CREATE INDEX idx_user_services_service ON public.user_services(service_id);

-- Enable Row Level Security
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service catalog is publicly readable (non-sensitive reference data)
CREATE POLICY "Service catalog is publicly readable" 
  ON public.service_catalog 
  FOR SELECT 
  USING (true);

-- RLS Policies: Users can only view their own discovered services
CREATE POLICY "Users can view own services" 
  ON public.user_services 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies: Users can update their own service records (for rescans)
CREATE POLICY "Users can update own services" 
  ON public.user_services 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Seed service catalog with initial popular services
INSERT INTO public.service_catalog (name, domain, logo_url, homepage_url, category) VALUES
  -- Social Media
  ('Facebook', 'facebook.com', 'https://logo.clearbit.com/facebook.com', 'https://facebook.com', 'social'),
  ('Instagram', 'instagram.com', 'https://logo.clearbit.com/instagram.com', 'https://instagram.com', 'social'),
  ('Twitter', 'twitter.com', 'https://logo.clearbit.com/twitter.com', 'https://twitter.com', 'social'),
  ('X (Twitter)', 'x.com', 'https://logo.clearbit.com/x.com', 'https://x.com', 'social'),
  ('LinkedIn', 'linkedin.com', 'https://logo.clearbit.com/linkedin.com', 'https://linkedin.com', 'social'),
  ('TikTok', 'tiktok.com', 'https://logo.clearbit.com/tiktok.com', 'https://tiktok.com', 'social'),
  ('Snapchat', 'snapchat.com', 'https://logo.clearbit.com/snapchat.com', 'https://snapchat.com', 'social'),
  ('Reddit', 'reddit.com', 'https://logo.clearbit.com/reddit.com', 'https://reddit.com', 'social'),
  ('Discord', 'discord.com', 'https://logo.clearbit.com/discord.com', 'https://discord.com', 'social'),
  ('Pinterest', 'pinterest.com', 'https://logo.clearbit.com/pinterest.com', 'https://pinterest.com', 'social'),
  
  -- Shopping & Commerce
  ('Amazon', 'amazon.com', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', 'shopping'),
  ('eBay', 'ebay.com', 'https://logo.clearbit.com/ebay.com', 'https://ebay.com', 'shopping'),
  ('Etsy', 'etsy.com', 'https://logo.clearbit.com/etsy.com', 'https://etsy.com', 'shopping'),
  ('Shopify', 'shopify.com', 'https://logo.clearbit.com/shopify.com', 'https://shopify.com', 'shopping'),
  ('PayPal', 'paypal.com', 'https://logo.clearbit.com/paypal.com', 'https://paypal.com', 'finance'),
  ('Stripe', 'stripe.com', 'https://logo.clearbit.com/stripe.com', 'https://stripe.com', 'finance'),
  
  -- Tech & Productivity
  ('Google', 'google.com', 'https://logo.clearbit.com/google.com', 'https://google.com', 'tech'),
  ('GitHub', 'github.com', 'https://logo.clearbit.com/github.com', 'https://github.com', 'tech'),
  ('GitLab', 'gitlab.com', 'https://logo.clearbit.com/gitlab.com', 'https://gitlab.com', 'tech'),
  ('Dropbox', 'dropbox.com', 'https://logo.clearbit.com/dropbox.com', 'https://dropbox.com', 'tech'),
  ('Microsoft', 'microsoft.com', 'https://logo.clearbit.com/microsoft.com', 'https://microsoft.com', 'tech'),
  ('Slack', 'slack.com', 'https://logo.clearbit.com/slack.com', 'https://slack.com', 'tech'),
  ('Notion', 'notion.so', 'https://logo.clearbit.com/notion.so', 'https://notion.so', 'tech'),
  ('Trello', 'trello.com', 'https://logo.clearbit.com/trello.com', 'https://trello.com', 'tech'),
  ('Zoom', 'zoom.us', 'https://logo.clearbit.com/zoom.us', 'https://zoom.us', 'tech'),
  
  -- Streaming & Entertainment
  ('Netflix', 'netflix.com', 'https://logo.clearbit.com/netflix.com', 'https://netflix.com', 'streaming'),
  ('Spotify', 'spotify.com', 'https://logo.clearbit.com/spotify.com', 'https://spotify.com', 'streaming'),
  ('YouTube', 'youtube.com', 'https://logo.clearbit.com/youtube.com', 'https://youtube.com', 'streaming'),
  ('Hulu', 'hulu.com', 'https://logo.clearbit.com/hulu.com', 'https://hulu.com', 'streaming'),
  ('Disney+', 'disneyplus.com', 'https://logo.clearbit.com/disneyplus.com', 'https://disneyplus.com', 'streaming'),
  ('HBO Max', 'hbomax.com', 'https://logo.clearbit.com/hbomax.com', 'https://hbomax.com', 'streaming'),
  ('Twitch', 'twitch.tv', 'https://logo.clearbit.com/twitch.tv', 'https://twitch.tv', 'streaming'),
  
  -- Finance & Crypto
  ('Coinbase', 'coinbase.com', 'https://logo.clearbit.com/coinbase.com', 'https://coinbase.com', 'finance'),
  ('Robinhood', 'robinhood.com', 'https://logo.clearbit.com/robinhood.com', 'https://robinhood.com', 'finance'),
  ('Venmo', 'venmo.com', 'https://logo.clearbit.com/venmo.com', 'https://venmo.com', 'finance'),
  ('Cash App', 'cash.app', 'https://logo.clearbit.com/cash.app', 'https://cash.app', 'finance'),
  
  -- Travel & Delivery
  ('Uber', 'uber.com', 'https://logo.clearbit.com/uber.com', 'https://uber.com', 'travel'),
  ('Lyft', 'lyft.com', 'https://logo.clearbit.com/lyft.com', 'https://lyft.com', 'travel'),
  ('Airbnb', 'airbnb.com', 'https://logo.clearbit.com/airbnb.com', 'https://airbnb.com', 'travel'),
  ('DoorDash', 'doordash.com', 'https://logo.clearbit.com/doordash.com', 'https://doordash.com', 'delivery'),
  ('Uber Eats', 'ubereats.com', 'https://logo.clearbit.com/ubereats.com', 'https://ubereats.com', 'delivery'),
  ('Grubhub', 'grubhub.com', 'https://logo.clearbit.com/grubhub.com', 'https://grubhub.com', 'delivery'),
  
  -- Email & Communication
  ('Gmail', 'gmail.com', 'https://logo.clearbit.com/gmail.com', 'https://mail.google.com', 'tech'),
  ('Outlook', 'outlook.com', 'https://logo.clearbit.com/outlook.com', 'https://outlook.com', 'tech'),
  ('Yahoo', 'yahoo.com', 'https://logo.clearbit.com/yahoo.com', 'https://yahoo.com', 'tech'),
  
  -- Gaming
  ('Steam', 'steampowered.com', 'https://logo.clearbit.com/steampowered.com', 'https://store.steampowered.com', 'gaming'),
  ('Epic Games', 'epicgames.com', 'https://logo.clearbit.com/epicgames.com', 'https://epicgames.com', 'gaming'),
  ('PlayStation', 'playstation.com', 'https://logo.clearbit.com/playstation.com', 'https://playstation.com', 'gaming'),
  ('Xbox', 'xbox.com', 'https://logo.clearbit.com/xbox.com', 'https://xbox.com', 'gaming');
