import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Calendar, Activity, ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { DeletionProgressTracker } from "@/components/DeletionProgressTracker";
import { Navbar } from "@/components/Navbar";
import { DemoBanner } from "@/components/DemoBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { demoServices, demoRiskData, demoMonthlyStats, demoUser, DemoService } from "@/data/demoData";

export default function Demo() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Calculate categories from demo services
  const categories = useMemo(() => {
    const cats = [...new Set(demoServices.map(s => s.category))].sort();
    return cats;
  }, []);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return demoServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getContactStatusBadge = (status: DemoService['contact_status']) => {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'ai_discovered':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30"><Activity className="w-3 h-3 mr-1" /> AI Found</Badge>;
      case 'needs_discovery':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"><AlertCircle className="w-3 h-3 mr-1" /> Needs Review</Badge>;
    }
  };

  const getDeletionBadge = (service: DemoService) => {
    if (service.deletion_status === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Deleted</Badge>;
    }
    if (service.deletion_status === 'pending') {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pending</Badge>;
    }
    return null;
  };

  const getServiceInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DemoBanner />
      
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Demo Dashboard
            </h1>
            <p className="text-muted-foreground">
              Explore what your dashboard looks like with {demoServices.length} discovered accounts
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            className="gap-2"
          >
            <BrandMark className="w-4 h-4" />
            Scan Your Own Inbox
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoServices.length}</p>
                  <p className="text-xs text-muted-foreground">Total Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoMonthlyStats.totalDeletions}</p>
                  <p className="text-xs text-muted-foreground">Deleted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoServices.filter(s => s.deletion_status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoMonthlyStats.newServicesCount}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Risk Score & Progress */}
          <div className="space-y-6">
            <RiskScoreCard 
              score={demoRiskData.riskScore}
              level={demoRiskData.riskLevel}
              factors={demoRiskData.factors}
              insights={demoRiskData.insights}
              percentile={demoRiskData.percentile}
              exposureFactors={demoRiskData.exposureFactors}
              topCategories={demoRiskData.topCategories}
            />
            
            <DeletionProgressTracker 
              services={demoServices.map(s => ({
                id: s.id,
                deletion_requested_at: s.deletion_requested_at,
                deletion_status: s.deletion_status,
              }))}
            />
          </div>

          {/* Right Column - Services List */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Discovered Services
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full sm:w-48"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={service.logo_url} alt={service.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getServiceInitials(service.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground truncate">
                            {service.name}
                          </h3>
                          {getDeletionBadge(service)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {service.category}
                          </Badge>
                          <span className="text-xs">
                            Found {new Date(service.discovered_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-2">
                        {getContactStatusBadge(service.contact_status)}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(service.homepage_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {filteredServices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No services match your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* CTA Card */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <BrandMark className="w-12 h-12 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Ready to discover your real footprint?</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Connect your Gmail to find all the accounts linked to your email address
                    </p>
                  </div>
                  <Button onClick={() => navigate('/auth')} className="gap-2">
                    <BrandMark className="w-4 h-4" />
                    Get Started Free
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Free tier: 3 deletions/month • No credit card required
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
