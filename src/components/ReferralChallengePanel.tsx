import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Share2, 
  Users, 
  Trophy, 
  Copy, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Zap
} from "lucide-react";

interface ReferralCode {
  id: string;
  code: string;
  uses_count: number;
  created_at: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  is_active: boolean;
  prize_description: string | null;
  end_date: string | null;
}

export function ReferralChallengePanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user's referral code
      const { data: codes } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (codes && codes.length > 0) {
        setReferralCode(codes[0]);
      }

      // Load referral count
      const { count } = await supabase
        .from("referral_conversions")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", session.user.id);

      setReferralCount(count || 0);

      // Load active challenges
      const { data: activeChallenges } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true);

      setChallenges(activeChallenges || []);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Generate a unique code
      const { data: newCode, error: codeError } = await supabase
        .rpc("generate_referral_code");

      if (codeError) throw codeError;

      // Insert the referral code
      const { data, error } = await supabase
        .from("referral_codes")
        .insert({
          user_id: session.user.id,
          code: newCode,
        })
        .select()
        .single();

      if (error) throw error;

      setReferralCode(data);
      toast({
        title: "Referral Code Created!",
        description: "Share your code with friends to earn rewards",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const shareCode = () => {
    if (!referralCode) return;
    const shareUrl = `${window.location.origin}/auth?ref=${referralCode.code}`;
    const text = `Check out Footprint Finder! Use my referral code ${referralCode.code} to get started. ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: "Join Footprint Finder",
        text,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Share Link Copied!",
        description: "Share it with your friends",
      });
    }
  };

  const redeemReferralCode = async () => {
    if (!redeemCode.trim()) return;

    setRedeeming(true);
    try {
      const { data, error } = await supabase
        .rpc("use_referral_code", { p_code: redeemCode.toUpperCase() });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;

      if (result?.success) {
        toast({
          title: "Code Redeemed!",
          description: "You've successfully used this referral code",
        });
        setShowRedeemDialog(false);
        setRedeemCode("");
      } else {
        toast({
          title: "Invalid Code",
          description: result?.error || "This code could not be redeemed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem code",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Invite Friends & Earn Rewards
          </CardTitle>
          <CardDescription>
            Share your referral code and earn free deletion credits for every friend who joins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-background border-2 border-dashed border-primary/40 rounded-lg p-4 text-center">
                  <div className="text-2xl font-mono font-bold tracking-wider text-primary">
                    {referralCode.code}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="icon" onClick={shareCode}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{referralCount} friends joined</div>
                    <div className="text-sm text-muted-foreground">
                      {referralCount > 0 
                        ? `You've earned ${referralCount} bonus deletion${referralCount > 1 ? 's' : ''}!`
                        : "Share your code to start earning"
                      }
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">{referralCode.uses_count} uses</Badge>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">Get Your Referral Code</h4>
              <p className="text-muted-foreground text-sm mb-4">
                Generate a unique code to share with friends
              </p>
              <Button onClick={generateReferralCode} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Have a Referral Code?</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Redeem a Referral Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redeem Referral Code</DialogTitle>
                <DialogDescription>
                  Enter the referral code you received from a friend
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Referral Code</Label>
                  <Input
                    placeholder="Enter code (e.g., ABC12345)"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="font-mono text-center text-lg tracking-wider"
                    maxLength={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={redeemReferralCode} disabled={redeeming || redeemCode.length < 6}>
                  {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Redeem
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Active Challenges
            </CardTitle>
            <CardDescription>
              Compete with others and win prizes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{challenge.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {challenge.description}
                    </p>
                    {challenge.prize_description && (
                      <div className="flex items-center gap-2 mt-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {challenge.prize_description}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {challenge.challenge_type.replace("_", " ")}
                  </Badge>
                </div>
                {challenge.end_date && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Ends: {new Date(challenge.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <div className="font-medium">Share Your Code</div>
                <div className="text-sm text-muted-foreground">
                  Give your unique referral code to friends
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <div className="font-medium">They Sign Up</div>
                <div className="text-sm text-muted-foreground">
                  Your friend creates an account using your code
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <div className="font-medium">Both Get Rewarded</div>
                <div className="text-sm text-muted-foreground">
                  You both receive a bonus deletion credit!
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
