import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Shield, 
  TrendingUp, 
  Award, 
  Target,
  Sparkles,
  Crown,
  Zap,
  Star
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface ImpactVisualizationProps {
  totalDeletions: number;
  servicesRemaining: number;
  oldAccountsDeleted: number;
  sensitiveAccountsDeleted: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  threshold: number;
  icon: any;
  color: string;
  achieved: boolean;
}

export const ImpactVisualization = ({
  totalDeletions,
  servicesRemaining,
  oldAccountsDeleted,
  sensitiveAccountsDeleted,
}: ImpactVisualizationProps) => {
  // Calculate impact metrics
  const timeSavedMinutes = totalDeletions * 5; // 5 minutes per deletion
  const timeSavedHours = Math.floor(timeSavedMinutes / 60);
  const remainingMinutes = timeSavedMinutes % 60;
  
  // Privacy score calculation (0-100)
  const totalServices = totalDeletions + servicesRemaining;
  const deletionRate = totalServices > 0 ? (totalDeletions / totalServices) * 100 : 0;
  const privacyScore = Math.min(
    Math.round(
      (deletionRate * 0.5) + // 50% weight on deletion rate
      (oldAccountsDeleted * 2) + // Bonus for old accounts
      (sensitiveAccountsDeleted * 3) // Higher bonus for sensitive accounts
    ),
    100
  );

  // Privacy improvement over time (mock data for visualization)
  const privacyTrendData = [
    { month: 'Start', score: 35 },
    { month: 'Week 1', score: Math.max(35, privacyScore * 0.4) },
    { month: 'Week 2', score: Math.max(45, privacyScore * 0.6) },
    { month: 'Week 3', score: Math.max(55, privacyScore * 0.8) },
    { month: 'Now', score: privacyScore },
  ];

  // Category breakdown for pie chart
  const categoryData = [
    { name: 'Deleted', value: totalDeletions, color: 'hsl(var(--primary))' },
    { name: 'Remaining', value: servicesRemaining, color: 'hsl(var(--muted))' },
  ];

  // Milestones
  const milestones: Milestone[] = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Deleted your first account',
      threshold: 1,
      icon: Star,
      color: 'text-yellow-500',
      achieved: totalDeletions >= 1
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Deleted 5 accounts',
      threshold: 5,
      icon: Zap,
      color: 'text-blue-500',
      achieved: totalDeletions >= 5
    },
    {
      id: 'privacy-champion',
      title: 'Privacy Champion',
      description: 'Deleted 10 accounts',
      threshold: 10,
      icon: Award,
      color: 'text-purple-500',
      achieved: totalDeletions >= 10
    },
    {
      id: 'digital-minimalist',
      title: 'Digital Minimalist',
      description: 'Deleted 25 accounts',
      threshold: 25,
      icon: Target,
      color: 'text-green-500',
      achieved: totalDeletions >= 25
    },
    {
      id: 'privacy-master',
      title: 'Privacy Master',
      description: 'Deleted 50 accounts',
      threshold: 50,
      icon: Crown,
      color: 'text-orange-500',
      achieved: totalDeletions >= 50
    },
  ];

  const achievedMilestones = milestones.filter(m => m.achieved);
  const nextMilestone = milestones.find(m => !m.achieved);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Saved */}
        <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {timeSavedHours > 0 ? timeSavedHours : timeSavedMinutes}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {timeSavedHours > 0 ? 'hours' : 'min'}
                  </span>
                  {timeSavedHours > 0 && remainingMinutes > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      {remainingMinutes}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on 5 minutes per deletion request
            </p>
          </CardContent>
        </Card>

        {/* Privacy Score */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Privacy Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {privacyScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
            <Progress value={privacyScore} className="h-2" />
          </CardContent>
        </Card>

        {/* Accounts Cleaned */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accounts Cleaned</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {totalDeletions}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {totalServices}
                  </span>
                </div>
              </div>
            </div>
            <Progress 
              value={deletionRate} 
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy Score Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={privacyTrendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deletion Progress Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Cleanup Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {achievedMilestones.length} of {milestones.length} milestones unlocked
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Achievement Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {Math.round((achievedMilestones.length / milestones.length) * 100)}%
                </span>
              </div>
              <Progress 
                value={(achievedMilestones.length / milestones.length) * 100} 
                className="h-2"
              />
            </div>

            {/* Next Milestone */}
            {nextMilestone && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Next Milestone</span>
                      <Badge variant="outline" className="text-xs">
                        {totalDeletions}/{nextMilestone.threshold}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {nextMilestone.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nextMilestone.description}
                    </p>
                    <Progress 
                      value={(totalDeletions / nextMilestone.threshold) * 100} 
                      className="h-1.5 mt-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Milestone Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {milestones.map((milestone) => {
                const Icon = milestone.icon;
                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      milestone.achieved
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/20 border-border opacity-50'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <div className={`p-2 rounded-lg ${
                        milestone.achieved 
                          ? 'bg-primary/10' 
                          : 'bg-muted'
                      }`}>
                        <Icon 
                          className={`w-5 h-5 ${
                            milestone.achieved 
                              ? milestone.color 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </div>
                    </div>
                    <p className="text-xs font-medium mb-1 line-clamp-1">
                      {milestone.title}
                    </p>
                    {milestone.achieved ? (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {milestone.threshold} deletions
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Your Privacy Impact</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  ✓ Reduced your digital footprint by <span className="font-semibold text-foreground">{totalDeletions} accounts</span>
                </p>
                <p>
                  ✓ Saved approximately <span className="font-semibold text-foreground">{timeSavedHours > 0 ? `${timeSavedHours} hours` : `${timeSavedMinutes} minutes`}</span> of manual work
                </p>
                {oldAccountsDeleted > 0 && (
                  <p>
                    ✓ Deleted <span className="font-semibold text-foreground">{oldAccountsDeleted} old accounts</span> (3+ years)
                  </p>
                )}
                {sensitiveAccountsDeleted > 0 && (
                  <p>
                    ✓ Removed <span className="font-semibold text-foreground">{sensitiveAccountsDeleted} sensitive accounts</span> reducing data exposure
                  </p>
                )}
                <p>
                  ✓ Privacy score improved to <span className="font-semibold text-foreground">{privacyScore}/100</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
