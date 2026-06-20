import { useEffect, useState } from "react";

export interface GameSession {
  totalScore: number;
  timeSpent: number;
  zoneStats: {
    zoneName: string;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    zoneScore: number;
  }[];
  colorClashScore: number;
  rightOfWayScore: number;
  startTime: number;
  lastUpdated: number;
}

const STORAGE_KEY = "permit-prep-session";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function useGamePersistence() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const now = Date.now();
        
        // Check if session has expired
        if (now - parsed.lastUpdated > SESSION_EXPIRY) {
          localStorage.removeItem(STORAGE_KEY);
          setSession(null);
        } else {
          setSession(parsed);
        }
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...session,
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    }
  }, [session]);

  const createNewSession = (): GameSession => {
    const newSession: GameSession = {
      totalScore: 0,
      timeSpent: 0,
      zoneStats: [],
      colorClashScore: 0,
      rightOfWayScore: 0,
      startTime: Date.now(),
      lastUpdated: Date.now()
    };
    setSession(newSession);
    return newSession;
  };

  const updateScore = (points: number, gameType: "textDrive" | "colorClash" | "rightOfWay") => {
    setSession(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      updated.totalScore += points;
      
      if (gameType === "colorClash") {
        updated.colorClashScore += points;
      } else if (gameType === "rightOfWay") {
        updated.rightOfWayScore += points;
      }
      
      return updated;
    });
  };

  const updateZoneStats = (
    zoneName: string,
    questionsAnswered: number,
    correctAnswers: number,
    zoneScore: number
  ) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      const existingZone = updated.zoneStats.find(z => z.zoneName === zoneName);
      
      if (existingZone) {
        existingZone.questionsAnswered += questionsAnswered;
        existingZone.correctAnswers += correctAnswers;
        existingZone.zoneScore += zoneScore;
        existingZone.accuracy = (existingZone.correctAnswers / existingZone.questionsAnswered) * 100;
      } else {
        updated.zoneStats.push({
          zoneName,
          questionsAnswered,
          correctAnswers,
          accuracy: (correctAnswers / questionsAnswered) * 100,
          zoneScore
        });
      }
      
      return updated;
    });
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return {
    session,
    isLoading,
    createNewSession,
    updateScore,
    updateZoneStats,
    clearSession
  };
}
