import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Download, RotateCcw } from "lucide-react";
import { certificationQuestions } from "@/data/certificationQuestions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface TestState {
  mode: "start" | "testing" | "results" | "certificate";
  questionCount: 50 | 100;
  currentQuestionIndex: number;
  score: number;
  selectedAnswers: Record<number, string>;
  userName: string;
}

export default function CertificationTest() {
  const [testState, setTestState] = useState<TestState>({
    mode: "start",
    questionCount: 50,
    currentQuestionIndex: 0,
    score: 0,
    selectedAnswers: {},
    userName: "",
  });

  // Randomize and select questions
  const selectedQuestions = useMemo(() => {
    const allQuestions = certificationQuestions.questions || [];
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, testState.questionCount);
  }, [testState.questionCount]);

  const currentQuestion = selectedQuestions[testState.currentQuestionIndex];
  const percentage = Math.round((testState.score / (testState.currentQuestionIndex * 100)) * 100) || 0;
  const passedTest = percentage >= 70;

  const handleStartTest = (count: 50 | 100) => {
    setTestState(prev => ({
      ...prev,
      mode: "testing",
      questionCount: count,
      currentQuestionIndex: 0,
      score: 0,
      selectedAnswers: {},
    }));
  };

  const handleAnswerClick = (answerIndex: number) => {
    const answerLetter = String.fromCharCode(97 + answerIndex); // a, b, c, d
    const isCorrect = answerLetter === currentQuestion.correct_answer;
    const points = isCorrect ? 100 : 0;

    setTestState(prev => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [prev.currentQuestionIndex]: answerLetter,
      },
      score: prev.score + points,
    }));
  };

  const handleNextQuestion = () => {
    if (testState.currentQuestionIndex < selectedQuestions.length - 1) {
      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    } else {
      // Test complete
      const finalPercentage = Math.round((testState.score / selectedQuestions.length) * 100);
      if (finalPercentage >= 70) {
        setTestState(prev => ({
          ...prev,
          mode: "certificate",
        }));
      } else {
        setTestState(prev => ({
          ...prev,
          mode: "results",
        }));
      }
    }
  };

  const handleGenerateCertificate = () => {
    if (testState.userName.trim()) {
      // Generate PDF certificate (placeholder for now)
      const certificateText = `
SAFETY CERTIFICATION

This certifies that ${testState.userName}
has successfully completed the Safety Certification Test
with a score of ${Math.round((testState.score / selectedQuestions.length) * 100)}%

Date: ${new Date().toLocaleDateString()}
      `;
      
      // Download as text for now (can be enhanced with PDF generation)
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(certificateText));
      element.setAttribute("download", `${testState.userName}_certificate.txt`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Reset to start
      setTestState(prev => ({
        ...prev,
        mode: "start",
        userName: "",
      }));
    }
  };

  const handleRetakeTest = () => {
    setTestState(prev => ({
      ...prev,
      mode: "start",
      currentQuestionIndex: 0,
      score: 0,
      selectedAnswers: {},
      userName: "",
    }));
  };

  // Start Screen
  if (testState.mode === "start") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6 space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-blue-600">Safety Certification Test</h1>
          <p className="text-lg text-gray-600">Choose your test length and begin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 50 Question Test */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 border-2 border-blue-300 rounded-lg bg-blue-50 cursor-pointer"
            onClick={() => handleStartTest(50)}
          >
            <h2 className="text-2xl font-bold text-blue-600 mb-2">50 Questions</h2>
            <p className="text-gray-600 mb-4">~30 minutes</p>
            <p className="text-sm text-gray-500 mb-6">Pass with 70% or higher (35/50 correct)</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Test</Button>
          </motion.div>

          {/* 100 Question Test */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 border-2 border-blue-500 rounded-lg bg-blue-100 cursor-pointer"
            onClick={() => handleStartTest(100)}
          >
            <h2 className="text-2xl font-bold text-blue-700 mb-2">100 Questions</h2>
            <p className="text-gray-600 mb-4">~60 minutes</p>
            <p className="text-sm text-gray-500 mb-6">Pass with 70% or higher (70/100 correct)</p>
            <Button className="w-full bg-blue-700 hover:bg-blue-800">Start Test</Button>
          </motion.div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Study Guide:</strong> Review the study materials before taking the test. You need a score of 70% or higher to pass and receive a certificate.
          </p>
        </div>
      </motion.div>
    );
  }

  // Testing Screen
  if (testState.mode === "testing" && currentQuestion) {
    const progress = ((testState.currentQuestionIndex + 1) / selectedQuestions.length) * 100;
    const selectedAnswer = testState.selectedAnswers[testState.currentQuestionIndex];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Question {testState.currentQuestionIndex + 1} of {selectedQuestions.length}</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.prompt}</h2>

          {/* Answer Options */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleAnswerClick(0)}
              disabled={selectedAnswer !== undefined}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === "a"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              } ${selectedAnswer !== undefined ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="font-bold text-blue-600 mr-3">A.</span>
              {currentQuestion.a}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleAnswerClick(1)}
              disabled={selectedAnswer !== undefined}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === "b"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              } ${selectedAnswer !== undefined ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="font-bold text-blue-500 mr-3">B.</span>
              {currentQuestion.b}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleAnswerClick(2)}
              disabled={selectedAnswer !== undefined}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === "c"
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              } ${selectedAnswer !== undefined ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="font-bold text-blue-400 mr-3">C.</span>
              {currentQuestion.c}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleAnswerClick(3)}
              disabled={selectedAnswer !== undefined}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === "d"
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              } ${selectedAnswer !== undefined ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="font-bold text-blue-300 mr-3">D.</span>
              {currentQuestion.d}
            </motion.button>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === undefined}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {testState.currentQuestionIndex === selectedQuestions.length - 1 ? "Finish Test" : "Next Question"}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Results Screen (Failed)
  if (testState.mode === "results") {
    const finalPercentage = Math.round((testState.score / selectedQuestions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-6 space-y-8 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-red-600">Test Not Passed</h1>
          <p className="text-2xl font-semibold text-gray-700">Score: {finalPercentage}%</p>
          <p className="text-gray-600">You need 70% to pass. Keep studying and try again!</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <p className="text-lg font-semibold text-red-700 mb-2">Score Breakdown</p>
          <p className="text-gray-700">Correct: {testState.score} / {selectedQuestions.length * 100}</p>
        </div>

        <Button
          onClick={handleRetakeTest}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
        >
          <RotateCcw className="mr-2" /> Retake Test
        </Button>
      </motion.div>
    );
  }

  // Certificate Screen
  if (testState.mode === "certificate") {
    const finalPercentage = Math.round((testState.score / selectedQuestions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-6 space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-600">Congratulations!</h1>
          <p className="text-xl text-gray-700">You passed with {finalPercentage}%</p>
        </div>

        <Dialog open={testState.mode === "certificate"}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Your Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">Enter your name to generate your certificate:</p>
              <Input
                placeholder="Your Full Name"
                value={testState.userName}
                onChange={(e) =>
                  setTestState(prev => ({
                    ...prev,
                    userName: e.target.value,
                  }))
                }
                className="text-lg"
              />
              <Button
                onClick={handleGenerateCertificate}
                disabled={!testState.userName.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="mr-2" /> Download Certificate
              </Button>
              <Button
                onClick={handleRetakeTest}
                variant="outline"
                className="w-full"
              >
                Retake Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return null;
}
