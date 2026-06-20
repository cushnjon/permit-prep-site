import { motion } from "framer-motion";
import { GameSession } from "@/hooks/useGamePersistence";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, TrendingUp, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsDashboardProps {
  session: GameSession;
  onNewSession: () => void;
}

export default function ResultsDashboard({ session, onNewSession }: ResultsDashboardProps) {
  const totalTimeMinutes = Math.floor((Date.now() - session.startTime) / 60000);
  const totalTimeSeconds = Math.floor(((Date.now() - session.startTime) % 60000) / 1000);

  const zoneAccuracyData = session.zoneStats.map(zone => ({
    name: zone.zoneName.split(":")[0],
    accuracy: Math.round(zone.accuracy),
    score: zone.zoneScore
  }));

  const gameBreakdown = [
    { name: "Text Drive", value: session.totalScore - session.colorClashScore - session.rightOfWayScore },
    { name: "Color Clash", value: session.colorClashScore },
    { name: "Right-of-Way", value: session.rightOfWayScore }
  ].filter(item => item.value > 0);

  const COLORS = ["#4ade80", "#60a5fa", "#fbbf24"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Trophy className="w-12 h-12 text-accent mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-primary mb-2">Session Complete!</h2>
        <p className="text-muted-foreground">Great job mastering the road rules</p>
      </motion.div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-accent/10 rounded-lg border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-accent" />
            <p className="text-xs font-semibold text-muted-foreground">Total Score</p>
          </div>
          <p className="text-2xl font-bold text-primary">{session.totalScore}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-accent/10 rounded-lg border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <p className="text-xs font-semibold text-muted-foreground">Time Spent</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {totalTimeMinutes}:{totalTimeSeconds.toString().padStart(2, "0")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-accent/10 rounded-lg border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" />
            <p className="text-xs font-semibold text-muted-foreground">Questions</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {session.zoneStats.reduce((sum, z) => sum + z.questionsAnswered, 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-accent/10 rounded-lg border border-accent/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-xs font-semibold text-muted-foreground">Avg Accuracy</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {session.zoneStats.length > 0
              ? Math.round(
                  session.zoneStats.reduce((sum, z) => sum + z.accuracy, 0) / session.zoneStats.length
                )
              : 0}
            %
          </p>
        </motion.div>
      </div>

      {/* Zone Performance */}
      {session.zoneStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-card border border-border rounded-lg drop-shadow-medium"
        >
          <h3 className="text-lg font-bold text-primary mb-4">Zone Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="accuracy" fill="var(--accent)" name="Accuracy %" />
              <Bar dataKey="score" fill="var(--primary)" name="Zone Score" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Game Breakdown */}
      {gameBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-card border border-border rounded-lg drop-shadow-medium"
        >
          <h3 className="text-lg font-bold text-primary mb-4">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gameBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {gameBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Zone Details */}
      {session.zoneStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-primary">Zone Details</h3>
          {session.zoneStats.map((zone, idx) => (
            <div key={idx} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-primary">{zone.zoneName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {zone.correctAnswers} of {zone.questionsAnswered} correct
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent">{Math.round(zone.accuracy)}%</p>
                  <p className="text-sm text-primary font-semibold">{zone.zoneScore} pts</p>
                </div>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${zone.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3"
      >
        <Button
          onClick={onNewSession}
          className="flex-1 bg-accent hover:bg-accent/90"
        >
          Start New Session
        </Button>
      </motion.div>
    </div>
  );
}
