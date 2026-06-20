import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Zap, Play, ChevronUp } from "lucide-react";
import { gameData, Question } from "@/data/gameData";

interface GameState {
  currentZoneIndex: number;
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  selectedAnswer: string | null;
  showArticle: boolean;
  expandedSection: number | null;
  answersCollapsed: boolean;
}

const GAME_LOGOS = {
  textDrive: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/text-drive-logo-mDpj2YC2UyZJS7qt2cXdzB.webp",
  colorClash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/color-clash-logo-beDiurXgdr5mkHHHnZfk5j.webp",
  rightOfWay: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/right-of-way-logo-54nHdo2xbsfvenwHcw9zrj.webp",
  permitPrepLogo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/permit-prep-logo-mDpj2YC2UyZJS7qt2cXdzB.webp"
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    currentZoneIndex: 0,
    currentQuestionIndex: 0,
    score: 0,
    timeLeft: 300, // 5 minutes
    selectedAnswer: null,
    showArticle: false,
    expandedSection: 0, // Start with Text Drive expanded
    answersCollapsed: false,
  });

  // Timer effect
  useEffect(() => {
    if (gameState.timeLeft <= 0) return;
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.timeLeft]);

  const currentZone = gameData[gameState.currentZoneIndex];
  const currentQuestion = currentZone.questions[gameState.currentQuestionIndex];

  const handleAnswerClick = (answer: "a" | "b" | "c" | "d") => {
    if (gameState.selectedAnswer) return; // Prevent changing answer

    const isCorrect = answer === currentQuestion.correct_answer;
    const points = isCorrect ? 10 : 5;

    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      score: prev.score + points,
      showArticle: true,
      answersCollapsed: true,
    }));
  };

  const handleNextQuestion = () => {
    const nextQuestionIndex = gameState.currentQuestionIndex + 1;
    
    if (nextQuestionIndex < currentZone.questions.length) {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex,
        selectedAnswer: null,
        showArticle: false,
        answersCollapsed: false,
      }));
    } else {
      // Move to next zone
      const nextZoneIndex = gameState.currentZoneIndex + 1;
      if (nextZoneIndex < gameData.length) {
        setGameState(prev => ({
          ...prev,
          currentZoneIndex: nextZoneIndex,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showArticle: false,
          answersCollapsed: false,
        }));
      }
    }
  };

  const toggleSection = (index: number) => {
    setGameState(prev => ({
      ...prev,
      expandedSection: prev.expandedSection === index ? null : index,
    }));
  };

  const toggleAnswersExpanded = () => {
    setGameState(prev => ({
      ...prev,
      answersCollapsed: !prev.answersCollapsed,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSideNote = () => {
    if (!gameState.selectedAnswer) return null;
    const isCorrect = gameState.selectedAnswer === currentQuestion.correct_answer;
    return isCorrect ? currentQuestion.correct_side_note : currentQuestion.semi_correct_side_note;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm drop-shadow-soft">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={GAME_LOGOS.permitPrepLogo} alt="Permit Prep" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-primary">Permit Prep</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5 text-accent" />
              <span className="font-mono text-lg">{formatTime(gameState.timeLeft)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="font-bold text-lg text-primary">{gameState.score}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-4">
          {/* Text Drive Section */}
          <GameSection
            title="Text Drive: Read & Answer"
            logo={GAME_LOGOS.textDrive}
            speedTier="15 MPH"
            isExpanded={gameState.expandedSection === 0}
            onToggle={() => toggleSection(0)}
          >
            {gameState.expandedSection === 0 && (
              <TextDriveGame
                zone={currentZone}
                question={currentQuestion}
                selectedAnswer={gameState.selectedAnswer}
                showArticle={gameState.showArticle}
                sideNote={getSideNote()}
                answersCollapsed={gameState.answersCollapsed}
                onAnswerClick={handleAnswerClick}
                onNextQuestion={handleNextQuestion}
                onToggleAnswers={toggleAnswersExpanded}
              />
            )}
          </GameSection>

          {/* Color Clash Section */}
          <GameSection
            title="Color Clash: Signage Matching"
            logo={GAME_LOGOS.colorClash}
            speedTier="25 MPH"
            isExpanded={gameState.expandedSection === 1}
            onToggle={() => toggleSection(1)}
          >
            {gameState.expandedSection === 1 && (
              <PlaceholderGame title="Color Clash: Signage Matching" />
            )}
          </GameSection>

          {/* Right-of-Way Roulette Section */}
          <GameSection
            title="Right-of-Way Roulette"
            logo={GAME_LOGOS.rightOfWay}
            speedTier="45 MPH"
            isExpanded={gameState.expandedSection === 2}
            onToggle={() => toggleSection(2)}
          >
            {gameState.expandedSection === 2 && (
              <PlaceholderGame title="Right-of-Way Roulette" />
            )}
          </GameSection>
        </div>
      </main>
    </div>
  );
}

interface GameSectionProps {
  title: string;
  logo: string;
  speedTier: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function GameSection({ title, logo, speedTier, isExpanded, onToggle, children }: GameSectionProps) {
  return (
    <motion.div
      className="glow-border rounded-lg overflow-hidden drop-shadow-medium"
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full bg-card/70 hover:bg-card transition-colors p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <img src={logo} alt={title} className="h-12 w-12" />
          <div className="text-left">
            <h2 className="text-lg font-bold text-primary">{title}</h2>
            <p className="text-sm text-muted-foreground">{speedTier}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-6 w-6 text-accent" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-border"
          >
            <div className="p-6 bg-background/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface TextDriveGameProps {
  zone: typeof gameData[0];
  question: Question;
  selectedAnswer: string | null;
  showArticle: boolean;
  sideNote: string | null;
  answersCollapsed: boolean;
  onAnswerClick: (answer: "a" | "b" | "c" | "d") => void;
  onNextQuestion: () => void;
  onToggleAnswers: () => void;
}

function TextDriveGame({
  zone,
  question,
  selectedAnswer,
  showArticle,
  sideNote,
  answersCollapsed,
  onAnswerClick,
  onNextQuestion,
  onToggleAnswers,
}: TextDriveGameProps) {
  const answers = [
    { key: "a" as const, text: question.a },
    { key: "b" as const, text: question.b },
    { key: "c" as const, text: question.c },
    { key: "d" as const, text: question.d },
  ];

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="space-y-6">
      {/* Zone Strip Header */}
      <div className="bg-gradient-to-r from-primary to-accent/80 text-primary-foreground rounded-lg p-3 drop-shadow-medium">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide">{zone.zone}</h3>
          <div className="text-xs font-semibold opacity-90">Zone Info Below</div>
        </div>
      </div>

      {/* Scrolling Ticker */}
      <div className="relative overflow-hidden bg-accent/5 border border-accent/20 rounded-lg drop-shadow-soft">
        <div className="h-12 flex items-center px-4">
          <div className="scroll-ticker whitespace-nowrap text-sm text-muted-foreground font-medium">
            <span className="inline-block mr-12">{zone.background_tip}</span>
            <span className="inline-block mr-12">{zone.background_tip}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Reading Text */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-24 drop-shadow-soft">
            <h4 className="text-sm font-semibold text-primary mb-3">Question</h4>
            <p className="text-base leading-relaxed text-foreground">{question.prompt}</p>
          </div>
        </div>

        {/* Right: Multiple Choice */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!answersCollapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {answers.map((answer, idx) => (
                  <motion.button
                    key={answer.key}
                    onClick={() => onAnswerClick(answer.key)}
                    disabled={!!selectedAnswer}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 drop-shadow-soft ${
                      selectedAnswer === answer.key
                        ? isCorrect
                          ? "border-accent bg-accent/10 shadow-md shadow-accent/20"
                          : "border-destructive bg-destructive/10 shadow-md shadow-destructive/20"
                        : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                    } ${!selectedAnswer ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold text-sm">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-grow">
                        <p className="text-base font-medium">{answer.text}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                {/* Selected Answer Card */}
                {selectedAnswer && (
                  <div className={`p-4 rounded-lg border-2 drop-shadow-medium ${
                    isCorrect
                      ? "border-accent bg-accent/10"
                      : "border-destructive bg-destructive/10"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold text-sm">
                        {selectedAnswer.toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <p className="text-base font-medium">
                          {answers.find(a => a.key === selectedAnswer)?.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pull Tab to Expand */}
                <motion.button
                  onClick={onToggleAnswers}
                  className="w-full flex flex-col items-center gap-2 py-3 text-primary hover:text-primary/80 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="pull-tab-bounce"
                  >
                    <ChevronUp className="h-6 w-6" />
                  </motion.div>
                  <span className="text-xs font-semibold uppercase tracking-wide">Pull to expand</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Side Note */}
      <AnimatePresence>
        {selectedAnswer && sideNote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border-2 drop-shadow-soft ${
              isCorrect
                ? "border-accent/50 bg-accent/5 text-foreground"
                : "border-destructive/50 bg-destructive/5 text-foreground"
            }`}
          >
            <p className="text-sm leading-relaxed">{sideNote}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Card */}
      <AnimatePresence>
        {showArticle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card border border-primary/20 rounded-lg p-6 space-y-3 drop-shadow-medium"
          >
            <div>
              <h4 className="text-lg font-bold text-primary mb-1">{question.extended_reading.title}</h4>
              <p className="text-xs text-muted-foreground font-semibold">{question.extended_reading.context_type}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{question.extended_reading.summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Button */}
      <AnimatePresence>
        {showArticle && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onNextQuestion}
            className="w-full pulse-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all drop-shadow-medium"
          >
            <Play className="h-5 w-5" />
            Next Reading
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlaceholderGame({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-block bg-card border border-border rounded-lg p-8 max-w-md drop-shadow-soft">
        <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">Coming soon! This game is under development.</p>
        <div className="text-4xl mb-4">🚧</div>
      </div>
    </div>
  );
}
