import { useState, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Zap, Play, ChevronUp, Dices, BookOpen, Zap as TrafficIcon } from "lucide-react";
import { gameData, Question, Zone } from "@/data/gameData";
import { useLocation } from "wouter";
import { CinematicSignImage } from "./TrafficSnap";



interface GameState {
  currentZoneIndex: number;
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  selectedAnswer: string | null;
  showArticle: boolean;
  expandedSection: number | null;
  answersCollapsed: boolean;
  showGlossary: boolean;
  answeredQuestions: Record<string, boolean>;
  showSpanish?: boolean;
}

const GAME_LOGOS = {
  textDrive: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/text-drive-logo-mDpj2YC2UyZJS7qt2cXdzB.webp",
  colorClash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/color-clash-logo-beDiurXgdr5mkHHHnZfk5j.webp",
  rightOfWay: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/right-of-way-logo-54nHdo2xbsfvenwHcw9zrj.webp",
  permitPrepLogo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/permit-prep-logo-XMhL8jQs23DFMwyCQ3gV8G.webp"
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [gameState, setGameState] = useState<GameState>({
    currentZoneIndex: 0,
    currentQuestionIndex: 0,
    score: 0,
    timeLeft: 300, // 5 minutes
    selectedAnswer: null,
    showArticle: false,
    expandedSection: Math.random() < 0.5 ? 0 : 1, // 50% chance to open Text Drive or Traffic Snap
    answersCollapsed: false,
    showGlossary: false,
    answeredQuestions: {},
  });
  const [showSpanish, setShowSpanish] = useState(false);

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
    if (gameState.selectedAnswer) return;

    const isCorrect = answer === currentQuestion.correct_answer;
    const points = isCorrect ? 10 : 5;
    const questionId = currentQuestion.id;

    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      score: prev.score + points,
      showArticle: true,
      answersCollapsed: isCorrect,
      answeredQuestions: {
        ...prev.answeredQuestions,
        [questionId]: true,
      },
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

  const handleRandomQuestion = () => {
    const randomZoneIndex = Math.floor(Math.random() * gameData.length);
    const randomZone = gameData[randomZoneIndex];
    const randomQuestionIndex = Math.floor(Math.random() * randomZone.questions.length);
    setGameState(prev => ({
      ...prev,
      currentZoneIndex: randomZoneIndex,
      currentQuestionIndex: randomQuestionIndex,
      selectedAnswer: null,
      showArticle: false,
      answersCollapsed: false,
      showGlossary: false,
    }));
  };

  const handleToggleGlossary = () => {
    setGameState(prev => ({
      ...prev,
      showGlossary: !prev.showGlossary,
    }));
  };

  const handleNavigateToQuestion = (zoneIndex: number, questionIndex: number) => {
    setGameState(prev => ({
      ...prev,
      currentZoneIndex: zoneIndex,
      currentQuestionIndex: questionIndex,
      selectedAnswer: null,
      showArticle: false,
      answersCollapsed: false,
      showGlossary: false,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getZoneProgress = (zoneIndex: number) => {
    const zone = gameData[zoneIndex];
    const totalQuestions = zone.questions.length;
    const answeredCount = zone.questions.filter(q => gameState.answeredQuestions[q.id]).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  const getTotalProgress = () => {
    const totalQuestions = gameData.reduce((sum, zone) => sum + zone.questions.length, 0);
    const answeredCount = Object.keys(gameState.answeredQuestions).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  const getSideNote = () => {
    if (!gameState.selectedAnswer) return null;
    const isCorrect = gameState.selectedAnswer === currentQuestion.correct_answer;
    if (showSpanish) {
      return isCorrect 
        ? (currentQuestion.correct_side_note_es || currentQuestion.correct_side_note)
        : (currentQuestion.semi_correct_side_note_es || currentQuestion.semi_correct_side_note);
    }
    return isCorrect ? currentQuestion.correct_side_note : currentQuestion.semi_correct_side_note;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white backdrop-blur-sm drop-shadow-soft">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={GAME_LOGOS.permitPrepLogo} alt="Permit Prep" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-primary">Permit Prep</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">

            <motion.a
              href="/traffic-snap"
              className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Traffic Snap / Tráfico Snap"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <TrafficIcon className="h-6 w-6 relative z-10" />
            </motion.a>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              <span className="font-mono text-xs sm:text-lg">{formatTime(gameState.timeLeft)}</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              <span className="font-bold text-xs sm:text-lg text-primary">{gameState.score}</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="hidden sm:inline">Progress <span className="italic text-yellow-500">/ Progreso</span>: {getTotalProgress()}%</span>
              <span className="sm:hidden">Progress: {getTotalProgress()}%</span>
            </div>

          </div>
        </div>
        <div className="container px-0 pb-2">
          <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-primary"
              initial={{ width: 0 }}
              animate={{ width: getTotalProgress() + "%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-4">
          {/* Text Drive Section */}
          <GameSection
            title="Text Drive: Read & Answer / Lectura de Texto: Lee y Responde"
            logo={GAME_LOGOS.permitPrepLogo}
            speedTier="15 MPH"
            isExpanded={gameState.expandedSection === 0}
            onToggle={() => toggleSection(0)}
            onRandomQuestion={handleRandomQuestion}
            progress={getZoneProgress(0)}
          >
            {gameState.expandedSection === 0 && (
              <TextDriveGame
                zone={currentZone}
                question={currentQuestion}
                selectedAnswer={gameState.selectedAnswer}
                showArticle={gameState.showArticle}
                sideNote={getSideNote()}
                answersCollapsed={gameState.answersCollapsed}
                showGlossary={gameState.showGlossary}
                onAnswerClick={handleAnswerClick}
                onNextQuestion={handleNextQuestion}
                onToggleAnswers={toggleAnswersExpanded}
                onRandomQuestion={handleRandomQuestion}
                onToggleGlossary={handleToggleGlossary}
                onNavigateToQuestion={handleNavigateToQuestion}
              />
            )}
          </GameSection>

          {/* Traffic Snap Section */}
          <GameSection
            title="Traffic Snap: Sign & Shape / Tráfico Snap: Signo y Forma"
            logo={GAME_LOGOS.permitPrepLogo}
            speedTier="25 MPH"
            isExpanded={gameState.expandedSection === 1}
            onToggle={() => toggleSection(1)}
            progress={0}
          >
            {gameState.expandedSection === 1 && (
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/all-traffic-signs-collection-ABfZqE94PcY8kqcmLCdrLc.webp"
                    alt="All Traffic Signs"
                    className="w-full h-auto"
                  />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-gray-600">Learn all traffic signs with interactive flip cards <span className="italic text-yellow-500">/ Aprende todas las señales de tráfico con tarjetas interactivas</span></p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setLocation("/traffic-snap")}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-button"
                    >
                      Play Traffic Snap <span className="italic text-yellow-500">/ Jugar Tráfico Snap</span>
                    </button>
                    <button
                      onClick={() => setLocation("/sign-reference")}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-button"
                    >
                      View All Signs <span className="italic text-yellow-500">/ Ver Todas las Señales</span>
                    </button>
                  </div>
                </div>
              </div>
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
  onRandomQuestion?: () => void;
  progress?: number;
  children: React.ReactNode;
}

function GameSection({ title, logo, speedTier, isExpanded, onToggle, onRandomQuestion, progress = 0, children }: GameSectionProps) {
  return (
    <motion.div
      className="glow-border rounded-lg overflow-hidden drop-shadow-medium shadow-container"
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full bg-white hover:bg-white transition-colors p-3 flex items-center justify-between shadow-button"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img src={logo} alt={title} className="h-10 w-10 flex-shrink-0" />
          <div className="text-left flex items-center gap-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-primary truncate">
              {(() => {
                const parts = title.split(' / ');
                if (parts.length === 2) {
                  return (
                    <>
                      {parts[0]} <span className="italic text-yellow-500">/ {parts[1]}</span>
                    </>
                  );
                }
                return title;
              })()}
            </h2>
            <p className="text-xs text-muted-foreground font-medium flex-shrink-0">{speedTier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRandomQuestion && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onRandomQuestion?.();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="pl-1 pr-2 py-2 rounded-lg hover:bg-accent/10 transition-colors"
              title="Random Question"
            >
              <motion.div
                className="pulse-bounce"
              >
                <Dices size={18} className="text-accent" />
              </motion.div>
            </motion.button>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-5 w-5 text-accent" />
          </motion.div>
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-3 py-2 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Zone Progress</span>
          <span className="text-xs font-bold text-accent">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-primary"
            initial={{ width: 0 }}
            animate={{ width: progress + "%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

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
            <div className="p-6 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface TextDriveGameProps {
  zone: Zone;
  question: Question;
  selectedAnswer: string | null;
  showArticle: boolean;
  sideNote: string | null;
  answersCollapsed: boolean;
  showGlossary: boolean;
  onAnswerClick: (answer: "a" | "b" | "c" | "d") => void;
  onNextQuestion: () => void;
  onToggleAnswers: () => void;
  onRandomQuestion: () => void;
  onToggleGlossary: () => void;
  onNavigateToQuestion?: (zoneIndex: number, questionIndex: number) => void;
}

function TextDriveGame({
  zone,
  question,
  selectedAnswer,
  showArticle,
  sideNote,
  answersCollapsed,
  showGlossary,
  onAnswerClick,
  onNextQuestion,
  onToggleAnswers,
  onRandomQuestion,
  onToggleGlossary,
  onNavigateToQuestion,
}: TextDriveGameProps) {
  const [showSpanish, setShowSpanish] = React.useState(false);

  const answers = [
    { key: "a" as const, text: showSpanish && question.a_es ? question.a_es : question.a },
    { key: "b" as const, text: showSpanish && question.b_es ? question.b_es : question.b },
    { key: "c" as const, text: showSpanish && question.c_es ? question.c_es : question.c },
    { key: "d" as const, text: showSpanish && question.d_es ? question.d_es : question.d },
  ];

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="space-y-6">
      {/* Zone Header + Ticker Container */}
      <div className="w-full rounded-lg overflow-hidden drop-shadow-medium shadow-container">
        {/* Zone Strip Header with Controls */}
        <div className="w-full bg-gradient-to-r from-primary to-accent/80 text-primary-foreground p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide">
              {(() => {
                const parts = zone.zone.split(' / ');
                if (parts.length === 2) {
                  return (
                    <>
                      {parts[0]} <span className="italic text-yellow-300">/ {parts[1]}</span>
                    </>
                  );
                }
                return zone.zone;
              })()}
            </h3>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onRandomQuestion}
                disabled={!!selectedAnswer}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Random Question"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Dices size={18} />
                </motion.div>
              </motion.button>
              <button
                onClick={onToggleGlossary}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                title="Glossary"
              >
                <BookOpen size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrolling Ticker */}
        <div className="w-full relative overflow-hidden bg-accent/5 border-t border-accent/20">
          <div className="h-12 flex items-center px-4">
            <div className="scroll-ticker whitespace-nowrap text-sm text-blue-600 font-medium">
              <span className="inline-block mr-12">{zone.background_tip}</span>
              <span className="inline-block mr-12">{zone.background_tip}</span>
              <span className="inline-block mr-12">{zone.background_tip}</span>
              <span className="inline-block mr-12">{zone.background_tip}</span>
              <span className="inline-block mr-12">{zone.background_tip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Glossary Dropdown - All Zones and Questions */}
      <AnimatePresence>
        {showGlossary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-accent/30 rounded-lg p-4 drop-shadow-soft shadow-container"
          >
            <h3 className="text-lg font-bold text-primary mb-4">All Questions by Zone</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {gameData.map((z, zoneIdx) => (
                <div key={z.zone} className="border-b border-accent/20 pb-3 last:border-b-0">
                  <h4 className="text-sm font-bold text-accent mb-2">{z.zone}</h4>
                  <div className="space-y-2 pl-2">
                    {z.questions.map((q, qIdx) => (
                      <motion.button
                        key={q.id}
                        onClick={() => {
                          // Navigate to this zone and question
                          onNavigateToQuestion?.(zoneIdx, qIdx);
                          onToggleGlossary();
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (zoneIdx * 5 + qIdx) * 0.02 }}
                        className="w-full text-left p-2 rounded-lg border border-accent/20 hover:bg-accent/10 hover:border-accent/50 transition-all"
                      >
                        <p className="text-xs font-semibold text-accent mb-1">Q{qIdx + 1}</p>
                        <p className="text-xs text-foreground line-clamp-2">{q.prompt}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question or Glossary */}
      <AnimatePresence mode="wait">
        {!showGlossary ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: Reading Text */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-4 sticky top-24 drop-shadow-soft shadow-container">
                {question.images && question.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <CinematicSignImage
                      src={question.images[0]}
                      alt="Question illustration"
                      isAnswered={!!selectedAnswer}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-primary">Question</h4>
                    {question.prompt_es && (
                      <motion.button
                        onClick={() => setShowSpanish(!showSpanish)}
                        className="px-2 py-1 rounded text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showSpanish ? "English" : "Español"}
                      </motion.button>
                    )}
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{showSpanish && question.prompt_es ? question.prompt_es : question.prompt}</p>
                </div>
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
                {answers.map((answer, idx) => {
                  const isThisAnswerCorrect = answer.key === question.correct_answer;
                  const isThisAnswerSelected = selectedAnswer === answer.key;
                  
                  const answerColors = [
                    { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
                    { bg: "bg-green-500", border: "border-green-600", text: "text-white" },
                    { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
                    { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
                  ];
                  const answerColor = answerColors[idx];

                  return (
                    <motion.button
                      key={answer.key}
                      onClick={() => onAnswerClick(answer.key)}
                      disabled={!!selectedAnswer}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 drop-shadow-soft shadow-button ${
                        selectedAnswer
                          ? isThisAnswerCorrect
                            ? "border-accent bg-accent/10 shadow-md shadow-accent/20 text-accent"
                            : isThisAnswerSelected
                            ? "border-destructive bg-destructive/10 shadow-md shadow-destructive/20 text-destructive"
                            : "border-border bg-card/50 opacity-50"
                          : "border-border bg-card hover:border-primary/50 hover:bg-card/80 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${answerColor.bg} ${answerColor.border} ${answerColor.text} flex items-center justify-center font-semibold text-sm`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-grow">
                          <p className="text-base font-medium">{answer.text}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
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
                  <div className={`p-4 rounded-lg border-2 drop-shadow-medium shadow-container ${
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
                  <span className="text-xs font-semibold uppercase tracking-wide">Pull to expand / Tirar para expandir</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="glossary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-primary mb-4">Question Glossary / Glosario de Preguntas</h3>
              {question.glossary && question.glossary.length > 0 ? (
                question.glossary.slice(0, 1).map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card border border-accent/30 rounded-lg p-4 drop-shadow-soft shadow-container"
                  >
                    <h4 className="font-bold text-accent mb-2">{item.term}</h4>
                    <p className="text-sm text-muted-foreground mb-3"><span className="font-semibold">Quick Tip / Consejo Rápido:</span> {item.quick_tip}</p>
                    <p className="text-sm text-foreground border-l-2 border-accent pl-3"><span className="font-semibold text-accent">Correct Answer / Respuesta Correcta:</span> {item.correct_answer}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-muted-foreground">No glossary items available for this question.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Note */}
      <AnimatePresence>
        {selectedAnswer && sideNote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border-2 drop-shadow-soft shadow-container ${
              isCorrect
                ? "border-accent/50 bg-accent/5 text-foreground"
                : "border-destructive/50 bg-destructive/5 text-foreground"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed flex-1">{sideNote}</p>
            </div>
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
            className="bg-card border border-primary/20 rounded-lg p-6 space-y-3 drop-shadow-medium shadow-container"
          >
            <div>
              <h4 className="text-lg font-bold text-primary mb-1">{showSpanish && question.extended_reading.title_es ? question.extended_reading.title_es : question.extended_reading.title}</h4>
              <p className="text-xs text-muted-foreground font-semibold">{showSpanish && question.extended_reading.context_type_es ? question.extended_reading.context_type_es : question.extended_reading.context_type}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {(showSpanish && question.extended_reading.summary_es ? question.extended_reading.summary_es : question.extended_reading.summary).split(/\[(.*?)\]\((.*?)\)/).map((part, idx) => {
                if (idx % 3 === 0) return part;
                if (idx % 3 === 1) return (
                  <a
                    key={idx}
                    href={question.extended_reading.summary.split(/\[(.*?)\]\((.*?)\)/)[idx + 1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent font-semibold hover:underline transition-all"
                  >
                    {part}
                  </a>
                );
                return null;
              })}
            </p>
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
            className="w-full pulse-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all drop-shadow-medium shadow-button wiggle"
          >
            <Play className="h-5 w-5" />
            Next Reading <span className="italic text-yellow-300">/ Siguiente Lectura</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlaceholderGame({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-block bg-card border border-border rounded-lg p-8 max-w-md drop-shadow-soft shadow-container">
        <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">Coming soon! This game is under development.</p>
        <div className="text-4xl mb-4">🚧</div>
      </div>
    </div>
  );
}
