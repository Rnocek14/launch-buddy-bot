import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingDown, TrendingUp, Minus, Calendar, RefreshCw, Loader2 } from "lucide-react";

interface ScoreHistoryEntry {
  id: string;
  score: number;
  level: string;
  total_accounts: number;
  recorded_at: string;
}

interface ScoreHistoryChartProps {
  currentScore?: number;
  currentLevel?: string;
}

export function ScoreHistoryChart({ currentScore, currentLevel }: ScoreHistoryChartProps) {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("risk_score_history")
        .select("*")
        .order("recorded_at", { ascending: true })
        .limit(30);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading score history:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordCurrentScore = async () => {
    if (currentScore === undefined || !currentLevel) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("risk_score_history")
        .insert({
          score: currentScore,
          level: currentLevel,
          total_accounts: 0, // Will be updated by edge function
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
        });

      if (error) throw error;
      await loadHistory();
    } catch (error) {
      console.error("Error recording score:", error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate trend
  const getTrend = () => {
    if (history.length < 2) return { direction: "neutral", change: 0 };
    
    const recent = history.slice(-5);
    const avgRecent = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const older = history.slice(0, Math.max(1, history.length - 5));
    const avgOlder = older.reduce((sum, h) => sum + h.score, 0) / older.length;
    
    const change = Math.round(avgRecent - avgOlder);
    
    if (change > 5) return { direction: "up" as const, change };
    if (change < -5) return { direction: "down" as const, change };
    return { direction: "neutral" as const, change };
  };

  const trend = getTrend();

  // Format data for chart
  const chartData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: h.score,
    level: h.level,
  }));

  // Add current score if available and different from last recorded
  if (currentScore !== undefined && (history.length === 0 || history[history.length - 1]?.score !== currentScore)) {
    chartData.push({
      date: "Now",
      score: currentScore,
      level: currentLevel || "medium",
    });
  }

  const getScoreColor = (score: number) => {
    if (score < 25) return "hsl(var(--chart-2))";
    if (score < 50) return "hsl(var(--chart-4))";
    if (score < 75) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-1))";
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Score History
            </CardTitle>
            <CardDescription>Track your risk score over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend.direction === "up" && (
              <Badge variant="destructive" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                +{trend.change} pts
              </Badge>
            )}
            {trend.direction === "down" && (
              <Badge className="bg-green-500 gap-1">
                <TrendingDown className="h-3 w-3" />
                {trend.change} pts
              </Badge>
            )}
            {trend.direction === "neutral" && history.length >= 2 && (
              <Badge variant="secondary" className="gap-1">
                <Minus className="h-3 w-3" />
                Stable
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-semibold mb-2">Not Enough Data</h4>
            <p className="text-muted-foreground text-sm mb-4">
              {chartData.length === 0 
                ? "Your score history will appear here after your first scan"
                : "Keep scanning to track your progress over time"
              }
            </p>
            {currentScore !== undefined && (
              <Button size="sm" onClick={recordCurrentScore} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Save Current Score
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [value, "Risk Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.min(...chartData.map(d => d.score))}
                </div>
                <div className="text-xs text-muted-foreground">Lowest Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)}
                </div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.max(...chartData.map(d => d.score))}
                </div>
                <div className="text-xs text-muted-foreground">Highest Score</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
