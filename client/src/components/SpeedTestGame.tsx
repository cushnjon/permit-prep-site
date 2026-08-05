import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw } from 'lucide-react';

// Generate random distractors for each question
const generateOptions = (correctAnswer: string, questionId: number): string[] => {
  const distractors = [
    // Generic wrong answers
    "No specific requirement",
    "At the driver's discretion",
    "Not applicable",
    "Varies by location",
    "Depends on weather",
    "Only on weekends",
    "Never allowed",
    "Always required",
    "15 minutes",
    "30 minutes",
    "1 hour",
    "2 hours",
    "Immediately",
    "Within 24 hours",
    "Within 7 days",
    "Within 30 days",
    "50 mph",
    "55 mph",
    "65 mph",
    "75 mph",
    "$100",
    "$500",
    "$1,000",
    "$5,000",
    "Yes, always",
    "No, never",
    "Only in emergencies",
    "Only with permission",
    "Left side",
    "Right side",
    "Center",
    "Either side",
    "2 seconds",
    "3 seconds",
    "4 seconds",
    "5 seconds",
    "10 feet",
    "20 feet",
    "50 feet",
    "100 feet",
  ];

  // Use questionId as seed for consistent randomization
  const shuffled = distractors.sort(() => {
    const seed = (questionId * 7 + 13) % 100;
    return seed - 50;
  });

  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  
  // Shuffle options
  return options.sort(() => {
    const seed = (questionId * 11 + 17) % 100;
    return seed - 50;
  });
};

const QUESTIONS = [
  { id: 1, question: "Urban residential speed limit?", answer: "25 mph" },
  { id: 2, question: "Express Consent Law means you agree to what?", answer: "Blood/breath test if suspected of DUI" },
  { id: 3, question: "DWAI alcohol threshold for adults (21+)?", answer: "0.05% BAC" },
  { id: 4, question: "Turn signal distance in urban areas?", answer: "At least 100 feet" },
  { id: 5, question: "Right-of-way at uncontrolled 4-way stops?", answer: "Vehicle on the right" },
  { id: 6, question: "Action for stopped emergency vehicles?", answer: "Move over a lane or slow down" },
  { id: 7, question: "Minimum safe following distance?", answer: "3 seconds" },
  { id: 8, question: "Uphill parking with a curb wheel direction?", answer: "Away from the curb (Left)" },
  { id: 9, question: "Solid yellow light means?", answer: "Stop if safe, red is coming" },
  { id: 10, question: "Yield to pedestrians in unmarked crosswalks?", answer: "Yes, always" },
  { id: 11, question: "Flashing red traffic light means?", answer: "Treat like a stop sign" },
  { id: 12, question: "Diamond-shaped sign means?", answer: "Warning or hazard ahead" },
  { id: 13, question: "What are truck 'No-Zones'?", answer: "Large blind spots" },
  { id: 14, question: "What to do if hydroplaning?", answer: "Ease off gas, steer straight" },
  { id: 15, question: "Under-21 zero-tolerance BAC limit?", answer: "0.02%" },
  { id: 16, question: "Best headlights for heavy fog?", answer: "Low beams" },
  { id: 17, question: "Can you cross double yellow lines?", answer: "Only to turn left into a driveway" },
  { id: 18, question: "School bus flashing red lights rule?", answer: "Stop from both directions" },
  { id: 19, question: "When must headlights be on?", answer: "Sunset to sunrise or low visibility (<1,000 ft)" },
  { id: 20, question: "First offense penalty for texting and driving?", answer: "$300 fine and 4 points" },
  { id: 21, question: "Narrow mountain road right-of-way?", answer: "Downhill car yields to uphill car" },
  { id: 22, question: "Seat belts increase crash survival by?", answer: "3 to 4 times" },
  { id: 23, question: "Safest hand position on steering wheel?", answer: "9 and 3 o'clock" },
  { id: 24, question: "Flashing yellow arrow means?", answer: "Yield, then turn left when safe" },
  { id: 25, question: "Which way to look when backing up?", answer: "Over your right shoulder" },
  { id: 26, question: "Bicycles' legal status on roads?", answer: "Same rights and rules as cars" },
  { id: 27, question: "Stopping distance for truck at 55 mph?", answer: "About 290 feet" },
  { id: 28, question: "Driving high on cannabis in Colorado?", answer: "Illegal, same as alcohol DUI" },
  { id: 29, question: "Purpose of highway left lane?", answer: "Actively passing other cars" },
  { id: 30, question: "Green road signs indicate?", answer: "Direction and guidance" },
  { id: 31, question: "Right-of-way entering a roundabout?", answer: "Yield to traffic already inside" },
  { id: 32, question: "Can you use self-parking on tests?", answer: "No" },
  { id: 33, question: "Downhill parking with a curb wheel direction?", answer: "Toward the curb (Right)" },
  { id: 34, question: "Action for blind pedestrians with white canes?", answer: "Always stop and yield" },
  { id: 35, question: "Safe lane change steps?", answer: "Mirrors, signal, blind spot, move" },
  { id: 36, question: "Minimum passing space for bicyclists?", answer: "3 feet" },
  { id: 37, question: "Distance to dim high beams for oncoming cars?", answer: "500 feet" },
  { id: 38, question: "Closest distance to stop from a train track?", answer: "15 feet" },
  { id: 39, question: "Speeding fine in a construction zone?", answer: "Fines are doubled" },
  { id: 40, question: "Road surfaces that freeze first?", answer: "Bridges and overpasses" },
  { id: 41, question: "Age kids need a car seat or booster?", answer: "Until 8th birthday" },
  { id: 42, question: "First action during a tire blowout?", answer: "Grip wheel, stay in lane, ease off gas" },
  { id: 43, question: "How to enter a freeway safely?", answer: "Match traffic speed and merge when safe" },
  { id: 44, question: "Flashing yellow traffic signal means?", answer: "Slow down and proceed with caution" },
  { id: 45, question: "Stopping quickly without ABS on ice?", answer: "Pump brakes smoothly" },
  { id: 46, question: "U-turns are illegal if you cannot see:", answer: "500 feet in both directions" },
  { id: 47, question: "Solid white line between traffic lanes?", answer: "Lane changes are discouraged" },
  { id: 48, question: "Yellow diagonal road lines mean?", answer: "Buffer zone, no driving or passing" },
  { id: 49, question: "No passing distance near intersections/bridges?", answer: "Within 100 feet" },
  { id: 50, question: "Under-18 curfew during first license year?", answer: "Midnight to 5:00 a.m." },
  { id: 51, question: "Max standard fine for first DUI?", answer: "$1,000" },
  { id: 52, question: "License points for a first DWAI?", answer: "8 points" },
  { id: 53, question: "Shape of a school zone sign?", answer: "Pentagon (5 sides)" },
  { id: 54, question: "Pennant-shaped sign means?", answer: "No passing zone" },
  { id: 55, question: "Green light responsibility?", answer: "Yield to traffic already in intersection" },
  { id: 56, question: "Weight requiring a Commercial Driver License?", answer: "26,001 pounds or more" },
  { id: 57, question: "Passenger count requiring a CDL?", answer: "16 or more passengers" },
  { id: 58, question: "Can foreign tourists drive in Colorado?", answer: "Yes, with a valid home license" },
  { id: 59, question: "Minor permit extra requirement?", answer: "Parent-signed liability affidavit" },
  { id: 60, question: "DMV written test cutoff time before closing?", answer: "30 minutes before close" },
  { id: 61, question: "Solid yellow line on your side means?", answer: "No passing allowed" },
  { id: 62, question: "Thick white stop lines mean?", answer: "Exact spot to stop your car" },
  { id: 63, question: "Retake wait time if you fail written test?", answer: "Next business day (24 hours)" },
  { id: 64, question: "Mandatory jail for 3rd DUI/DWAI?", answer: "60 days to 1 year" },
  { id: 65, question: "Steady red arrow signal means?", answer: "Stop, do not turn that way" },
  { id: 66, question: "Time limit to get license after moving to CO?", answer: "30 days" },
  { id: 67, question: "How to treat a broken dead traffic light?", answer: "As a four-way stop" },
  { id: 68, question: "Is it legal to wear headphones in both ears?", answer: "No" },
  { id: 69, question: "What to do if gas pedal sticks?", answer: "Shift to neutral, brake, pull over" },
  { id: 70, question: "Standard passenger car license class?", answer: "Class R" },
  { id: 71, question: "Points causing adult license suspension?", answer: "12 points in 12 months (or 18 in 24)" },
  { id: 72, question: "Main cause of rear-end crashes?", answer: "Following too closely (tailgating)" },
  { id: 73, question: "Safest way down steep mountains?", answer: "Shift into a lower gear" },
  { id: 74, question: "Red circle with a slash through it means?", answer: "The action is prohibited" },
  { id: 75, question: "Hitting an empty parked car?", answer: "Find owner or leave a note and call police" },
  { id: 76, question: "Can you park on a bridge or tunnel?", answer: "Never, unless police say so" },
  { id: 77, question: "Funeral procession rule?", answer: "Yield right-of-way to the whole group" },
  { id: 78, question: "Solid and broken yellow line combo means?", answer: "Pass only on the broken-line side" },
  { id: 79, question: "What to do if you see a drunk driver?", answer: "Keep distance and call 911" },
  { id: 80, question: "When can you cross lowered train gates?", answer: "Only when fully raised and lights stop" },
  { id: 81, question: "Roundabout traffic flow direction?", answer: "Counter-clockwise" },
  { id: 82, question: "Common rural road hazards?", answer: "Farm equipment, animals, unmarked turns" },
  { id: 83, question: "Flashing yellow beacon at a warning sign?", answer: "Proceed with caution" },
  { id: 84, question: "Penalty for running from the police?", answer: "12 points and license revocation" },
  { id: 85, question: "Parking distance from a fire hydrant?", answer: "15 feet" },
  { id: 86, question: "Speed limit on winding mountain curves?", answer: "20 mph" },
  { id: 87, question: "Under-18 cell phone rule?", answer: "Totally banned except for emergencies" },
  { id: 88, question: "Penalty for refusing a breath/blood test?", answer: "Automatic 1-year license revocation" },
  { id: 89, question: "Divided highway school bus rule?", answer: "Cars on opposite side of physical median don't stop" },
  { id: 90, question: "Shared center lane purpose?", answer: "Making left turns only" },
  { id: 91, question: "Time limit to update address with DMV?", answer: "30 days" },
  { id: 92, question: "When can you pass on the right?", answer: "Car ahead is turning left and paved space exists" },
  { id: 93, question: "First step if brakes completely fail?", answer: "Pump brakes rapidly and shift to lower gear" },
  { id: 94, question: "Steady red 'X' over a lane means?", answer: "Do not drive in this lane" },
  { id: 95, question: "Crash with no injuries on a busy road?", answer: "Move cars out of traffic if drivable" },
  { id: 96, question: "Open mountain highway speed limit?", answer: "40 mph" },
  { id: 97, question: "Parking distance from an intersection crosswalk?", answer: "At least 20 feet" },
  { id: 98, question: "Flashing red arrow signal means?", answer: "Stop completely, yield, then turn" },
  { id: 99, question: "What to do if you miss your highway exit?", answer: "Go to the next exit" },
  { id: 100, question: "Under-18 passenger restriction (first 6 months)?", answer: "No passengers under 21 unless family" },
];

interface Score {
  questionId: number;
  points: number;
  correct: boolean;
}

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];

export const SpeedTestGame: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const options = useMemo(() => generateOptions(currentQuestion.answer, currentQuestion.id), [currentQuestion]);

  // Timer effect
  useEffect(() => {
    if (!isStarted || isAnswering || testComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isAnswering, testComplete]);

  const calculatePoints = (timeRemaining: number, correct: boolean): number => {
    if (!correct) return 0;
    return Math.max(1, Math.round((timeRemaining / 3) * 200));
  };

  const handleTimeout = () => {
    const points = calculatePoints(0, false);
    setScores([...scores, { questionId: currentQuestion.id, points, correct: false }]);
    moveToNextQuestion();
  };

  const handleAnswer = (answer: string) => {
    if (isAnswering) return;
    
    setIsAnswering(true);
    setSelectedAnswer(answer);
    
    const isCorrect = answer === currentQuestion.answer;
    setFeedbackType(isCorrect ? 'correct' : 'incorrect');
    
    const points = calculatePoints(timeLeft, isCorrect);
    setScore(score + points);
    setScores([...scores, { questionId: currentQuestion.id, points, correct: isCorrect }]);

    setTimeout(() => {
      moveToNextQuestion();
      setIsAnswering(false);
      setSelectedAnswer(null);
      setFeedbackType(null);
    }, 500);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(3);
    } else {
      setTestComplete(true);
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setTimeLeft(3);
    setScore(0);
    setScores([]);
    setTestComplete(false);
  };

  const handleReset = () => {
    setIsStarted(false);
    setCurrentQuestionIndex(0);
    setTimeLeft(3);
    setScore(0);
    setScores([]);
    setTestComplete(false);
  };

  const handleDownloadStudyGuide = () => {
    const link = document.createElement('a');
    link.href = '/manus-storage/newreference_d40e7794.pdf';
    link.download = 'DMV-License-Study-Guide.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DMV License Speed Test</h1>
          <h2 className="text-xl text-blue-600 font-semibold mb-6">Top Scores Guaranteed License Exam Pass</h2>

          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
            <p className="text-gray-700 mb-4">
              Test your DMV knowledge with 100 rapid-fire questions. You have 3 seconds per question. Score 1-200 points based on speed and accuracy.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">100</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">3s</div>
                <div className="text-sm text-gray-600">Per Question</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">200</div>
                <div className="text-sm text-gray-600">Max Points</div>
              </div>
            </div>

            <button
              onClick={handleDownloadStudyGuide}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-4 rounded-lg transition-colors border border-amber-200"
            >
              <Download size={18} />
              Download Study Guide
            </button>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              Start Speed Test
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (testComplete) {
    const correctAnswers = scores.filter((s) => s.correct).length;
    const percentage = Math.round((correctAnswers / QUESTIONS.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg border border-green-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Test Complete!</h2>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-6">
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-green-600 mb-2">{score.toLocaleString()}</div>
              <div className="text-lg text-gray-600">Total Points</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{QUESTIONS.length - correctAnswers}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-center mb-6">
              <div className="text-4xl font-bold text-blue-600">{percentage}%</div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
        {/* Timer and Progress */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-semibold text-gray-600">
            Question {currentQuestionIndex + 1} of {QUESTIONS.length}
          </div>
          <motion.div
            animate={{ scale: timeLeft <= 1 ? [1, 1.1, 1] : 1 }}
            className={`text-3xl font-bold ${
              timeLeft <= 1 ? 'text-red-600' : timeLeft <= 2 ? 'text-yellow-600' : 'text-green-600'
            }`}
          >
            {timeLeft}s
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 3) * 100}%` }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">{currentQuestion.question}</h3>

            {/* Options Grid - Full Width */}
            <div className="space-y-3">
              {options.map((option, index) => {
                const isCorrect = option === currentQuestion.answer;
                const isSelected = selectedAnswer === option;
                const bgColor = COLORS[index % COLORS.length];
                
                return (
                  <motion.button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswering}
                    initial={{ x: index % 2 === 0 ? -200 : 200, opacity: 0 }}
                    animate={{
                      x: isAnswering && isSelected && !isCorrect ? [0, -8, 8, -6, 6, -4, 4, 0] : 0,
                      y: isAnswering && isSelected && !isCorrect ? [0, 0, 0, 10, 20, 40, 80, 120] : (isAnswering && isSelected && isCorrect ? -10 : 0),
                      opacity: isAnswering && isSelected && !isCorrect ? [1, 1, 1, 0.8, 0.6, 0.4, 0.2, 0] : 1,
                      rotate: isAnswering && isSelected && !isCorrect ? [0, -8, 8, -12, 15, -20, 25, 30] : 0,
                      scale: isAnswering && isSelected && !isCorrect ? [1, 0.95, 0.9, 0.85, 0.75, 0.6, 0.4, 0.2] : (isAnswering && isSelected && isCorrect ? 1.1 : 1)
                    }}
                    transition={isAnswering && isSelected ? { duration: 0.4 } : { delay: index * 0.1, duration: 0.4 }}
                    whileHover={!isAnswering ? { scale: 1.02 } : {}}
                    whileTap={!isAnswering ? { scale: 0.98 } : {}}
                    className={`w-full p-4 rounded-lg font-semibold text-white transition-all ${bgColor} ${
                      isAnswering && !isSelected ? 'opacity-50' : ''
                    } ${isAnswering && isSelected && isCorrect ? 'ring-4 ring-green-300' : ''} ${
                      isAnswering && isSelected && !isCorrect ? 'ring-4 ring-red-300' : ''
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm opacity-75">{String.fromCharCode(65 + index)}.</div>
                      <div className="text-lg">{option}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Current Score */}
        <div className="text-center">
          <div className="text-sm text-gray-600">Current Score</div>
          <div className="text-3xl font-bold text-blue-600">{score.toLocaleString()}</div>
        </div>
      </div>
    </motion.div>
  );
};
