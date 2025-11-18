import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DiscoveryDebug() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiscovery = async () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('discover-privacy-contacts', {
        body: { 
          serviceName: domain.trim(),
          domain: domain.trim(),
          debug: true
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Discovery Complete",
        description: `Found ${data?.contacts?.length || 0} contacts`,
      });
    } catch (error: any) {
      console.error('Discovery error:', error);
      toast({
        title: "Discovery Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discovery Debug Panel</h1>
          <p className="text-muted-foreground">
            Test privacy contact discovery for any domain and see detailed scoring information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Domain</CardTitle>
            <CardDescription>
              Enter a domain to run privacy contact discovery and view detailed results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runDiscovery()}
              />
              <Button onClick={runDiscovery} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Discovery
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Discovery Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Domain</div>
                    <div className="font-semibold">{result.domain || domain}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Method Used</div>
                    <Badge variant={result.methodUsed === 'browserless' ? 'default' : 'secondary'}>
                      {result.methodUsed || 'simple'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contacts Found</div>
                    <div className="font-semibold">{result.contacts?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Best Score</div>
                    <div className="font-semibold">{result.bestScore || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.contacts && result.contacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Discovered Contacts</CardTitle>
                  <CardDescription>
                    Privacy contact methods found for this domain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Source URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.contacts.map((contact: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{contact.contact_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {contact.contact_type === 'form' ? (
                              <a 
                                href={contact.value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {contact.value}
                              </a>
                            ) : (
                              contact.value
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              contact.confidence === 'high' ? 'default' : 
                              contact.confidence === 'medium' ? 'secondary' : 
                              'outline'
                            }>
                              {contact.confidence}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                            {contact.source_url || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {result.debugInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>
                    Detailed scoring and decision information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(result.debugInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
