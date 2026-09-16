import { useState, useEffect } from "react";
import { getPersistedScanIdentity } from "@/lib/checkout";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

interface BrokerScanProfileFormProps {
  onProfileReady: (profile: { firstName: string; lastName: string; city: string; state: string }) => void;
  disabled?: boolean;
}

export function BrokerScanProfileForm({ onProfileReady, disabled }: BrokerScanProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, city, state')
      .eq('id', session.user.id)
      .single();

    // Prefer the saved profile. Fall back to whatever the visitor typed into the
    // free broker check before paying — otherwise a customer who just watched us
    // find them on four sites is asked to retype the identical three fields, and
    // scan-brokers runs against their email local-part if they skip it.
    const carried = getPersistedScanIdentity();
    const carriedNames = (carried?.fullName ?? '').trim().split(/\s+/).filter(Boolean);

    const names = (profile?.full_name || '').trim().split(/\s+/).filter(Boolean);
    const resolvedNames = names.length >= 2 ? names : carriedNames;
    const resolvedCity = profile?.city || carried?.city || '';
    const resolvedState = profile?.state || carried?.state || '';

    if (resolvedNames.length >= 1) setFirstName(resolvedNames[0]);
    if (resolvedNames.length >= 2) setLastName(resolvedNames.slice(1).join(' '));
    if (resolvedCity) setCity(resolvedCity);
    if (resolvedState) setState(resolvedState);

    if (resolvedNames.length >= 2 && resolvedCity && resolvedState) {
      const resolved = {
        firstName: resolvedNames[0],
        lastName: resolvedNames.slice(1).join(' '),
        city: resolvedCity,
        state: resolvedState,
      };

      // Persist the carried values so the next scan, and the server-side identity
      // scan-brokers reads, no longer depend on this browser's localStorage.
      const profileIncomplete = names.length < 2 || !profile?.city || !profile?.state;
      if (profileIncomplete) {
        await supabase
          .from('profiles')
          .update({
            full_name: `${resolved.firstName} ${resolved.lastName}`.trim(),
            city: resolved.city,
            state: resolved.state,
          })
          .eq('id', session.user.id);
      }

      setProfileComplete(true);
      onProfileReady(resolved);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your first and last name.",
      });
      return;
    }

    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        city: city.trim() || null,
        state: state || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Profile saved",
      description: "Your information has been updated.",
    });

    setProfileComplete(true);
    onProfileReady({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city: city.trim(),
      state,
    });

    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 ${profileComplete ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Information
        </CardTitle>
        <CardDescription>
          {profileComplete 
            ? "Your profile is ready for scanning. Update it if needed."
            : "Enter your details for accurate broker detection."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={state} onValueChange={setState} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            * Required. City & state improve accuracy.
          </p>
          <Button 
            onClick={handleSave} 
            disabled={saving || disabled || !firstName.trim() || !lastName.trim()}
            size="sm"
          >
            {saving ? "Saving..." : profileComplete ? "Update" : "Save Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
