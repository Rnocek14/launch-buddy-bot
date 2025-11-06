import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  type: z.enum(["email", "phone", "username", "other"]),
  value: z.string().min(1, "Value is required").max(255, "Value is too long"),
  is_primary: z.boolean().default(false),
});

interface UsernameSuggestion {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface AddIdentifierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddIdentifierDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AddIdentifierDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UsernameSuggestion[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "email",
      value: "",
      is_primary: false,
    },
  });

  // Fetch user's primary email for AI suggestions
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: identifiers } = await supabase
        .from("user_identifiers")
        .select("value")
        .eq("type", "email")
        .eq("is_primary", true)
        .maybeSingle();
      
      if (identifiers?.value) {
        setUserEmail(identifiers.value);
      }
    };
    
    if (open) {
      fetchUserEmail();
      setSuggestions([]);
    }
  }, [open]);

  const fetchAISuggestions = async () => {
    if (!userEmail) {
      toast({
        title: "No Email Found",
        description: "Add an email identifier first to get username suggestions",
        variant: "destructive",
      });
      return;
    }

    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-usernames', {
        body: { email: userEmail }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast({
          title: "Suggestions Generated",
          description: `Got ${data.suggestions.length} username suggestions`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Failed to Generate Suggestions",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: UsernameSuggestion) => {
    form.setValue("value", suggestion.value);
    toast({
      title: "Suggestion Applied",
      description: `Selected: ${suggestion.value}`,
    });
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const validateValue = (type: string, value: string): string | null => {
    switch (type) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Invalid email format";
        }
        break;
      case "phone":
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.replace(/\D/g, "").length < 10) {
          return "Invalid phone number format";
        }
        break;
      case "username":
        if (value.length < 3) {
          return "Username must be at least 3 characters";
        }
        break;
    }
    return null;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const validationError = validateValue(values.type, values.value);
    if (validationError) {
      form.setError("value", { message: validationError });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      // If setting as primary, unset any existing primary of this type
      if (values.is_primary) {
        await supabase
          .from("user_identifiers")
          .update({ is_primary: false })
          .eq("user_id", session.user.id)
          .eq("type", values.type);
      }

      // Check if this value was from AI suggestions
      const isAISuggested = suggestions.some(s => s.value === values.value);
      
      const { error } = await supabase.from("user_identifiers").insert({
        user_id: session.user.id,
        type: values.type,
        value: values.value,
        is_primary: values.is_primary,
        source: isAISuggested ? "ai_suggested" : "manual",
        verified: false,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("This identifier already exists");
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Identifier added successfully",
      });

      form.reset();
      setSuggestions([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error adding identifier:", error);
      toast({
        title: "Failed to Add Identifier",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Identifier</DialogTitle>
          <DialogDescription>
            Add an email, phone number, username, or other identifier for deletion requests
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Input
                        placeholder={
                          form.watch("type") === "email"
                            ? "your@email.com"
                            : form.watch("type") === "phone"
                            ? "+1 (555) 123-4567"
                            : form.watch("type") === "username"
                            ? "username123"
                            : "Your identifier"
                        }
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    
                    {form.watch("type") === "username" && !suggestions.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchAISuggestions}
                        disabled={loadingSuggestions || !userEmail}
                        className="w-full"
                      >
                        {loadingSuggestions ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get AI Suggestions
                          </>
                        )}
                      </Button>
                    )}
                    
                    {suggestions.length > 0 && form.watch("type") === "username" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">AI Suggestions:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSuggestions([])}
                            className="h-auto p-0 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          {suggestions.map((suggestion, index) => (
                            <Card
                              key={index}
                              className="p-3 cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => selectSuggestion(suggestion)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium truncate">{suggestion.value}</span>
                                    <Badge
                                      variant={getConfidenceBadgeVariant(suggestion.confidence)}
                                      className="text-xs"
                                    >
                                      {suggestion.confidence}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {suggestion.reasoning}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as primary identifier</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      This will be used by default for deletion requests
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Identifier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
