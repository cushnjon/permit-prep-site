import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Download, RotateCcw, Save, Send } from "lucide-react";
import { certificationQuestions } from "@/data/certificationQuestions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface TestState {
  mode: "start" | "testing" | "results" | "certificate" | "save-progress";
  questionCount: 50 | 100;
  currentQuestionIndex: number;
  score: number;
  selectedAnswers: Record<number, string>;
  userName: string;
  savePin: string;
}

export default function CertificationTest() {
  const [testState, setTestState] = useState<TestState>({
    mode: "start",
    questionCount: 50,
    currentQuestionIndex: 0,
    score: 0,
    selectedAnswers: {},
    userName: "",
    savePin: "",
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showOpenProgressDialog, setShowOpenProgressDialog] = useState(false);
  const [tempPin, setTempPin] = useState("");

  const generateCertMutation = trpc.certificate.generate.useMutation();

  // Randomize and select questions
  const selectedQuestions = useMemo(() => {
    const allQuestions = certificationQuestions.questions || [];
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, testState.questionCount);
  }, [testState.questionCount]);

  const currentQuestion = selectedQuestions[testState.currentQuestionIndex];

  const handleStartTest = (questionCount: 50 | 100) => {
    setTestState(prev => ({
      ...prev,
      mode: "testing",
      questionCount,
      currentQuestionIndex: 0,
      score: 0,
      selectedAnswers: {},
    }));
  };

  const handleSelectAnswer = (answer: string) => {
    const currentQ = selectedQuestions[testState.currentQuestionIndex];
    const isCorrect = answer === currentQ.correct_answer;

    setTestState(prev => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [prev.currentQuestionIndex]: answer,
      },
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const handleNextQuestion = () => {
    if (testState.currentQuestionIndex < selectedQuestions.length - 1) {
      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (testState.currentQuestionIndex > 0) {
      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleSaveProgress = () => {
    if (!tempPin || tempPin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    const progressData = {
      testState,
      selectedQuestions,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(`test_progress_${tempPin}`, JSON.stringify(progressData));
    toast.success(`Progress saved with PIN: ${tempPin}`);
    setShowSaveDialog(false);
    setTempPin("");
  };

  const handleFinishTest = () => {
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
    setShowFinishDialog(false);
  };

  const handleGenerateCertificate = async () => {
    if (!testState.userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      toast.loading("Generating certificate...");
      const result = await generateCertMutation.mutateAsync({
        questionCount: testState.questionCount,
        userName: testState.userName,
        score: testState.score,
      });

      // Convert base64 to blob and download
      const binaryString = atob(result.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded!");

      // Reset to start
      setTestState(prev => ({
        ...prev,
        mode: "start",
        userName: "",
      }));
    } catch (error) {
      toast.error("Failed to generate certificate");
      console.error(error);
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

  const handleOpenProgress = () => {
    if (!tempPin) {
      toast.error("Please enter a PIN");
      return;
    }

    const savedData = localStorage.getItem(`test_progress_${tempPin}`);
    if (!savedData) {
      toast.error("No saved progress found with this PIN");
      return;
    }

    try {
      const progressData = JSON.parse(savedData);
      setTestState(prev => ({
        ...prev,
        ...progressData.testState,
        mode: "testing",
      }));
      toast.success("Progress loaded!");
      setShowOpenProgressDialog(false);
      setTempPin("");
    } catch (error) {
      toast.error("Error loading progress");
    }
  };

  // Start Screen
  if (testState.mode === "start") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-6 space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-blue-600">Safety Certification Test</h1>
          <p className="text-xl text-gray-600">Choose your test length and begin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 50 Question Test */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 border-2 border-blue-400 rounded-lg bg-blue-50 cursor-pointer"
            onClick={() => handleStartTest(50)}
          >
            <h2 className="text-2xl font-bold text-blue-700 mb-2">50 Questions</h2>
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

        {/* Open Progress Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowOpenProgressDialog(true)}
            variant="outline"
            className="border-2 border-gray-400 hover:border-blue-500"
          >
            📂 Open Saved Progress
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Study Guide:</strong> Review the study materials before taking the test. You need a score of 70% or higher to pass and receive a certificate.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const link = document.createElement('a');
              link.href = '/manus-storage/certstudyguide_105a3a3c.pdf';
              link.download = 'E-100-Study-Guide.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-block text-sm text-blue-600 hover:underline font-medium"
            title="Download Study Guide"
          >
            📥 Download Study Guide
          </a>
        </div>

        {/* Open Progress Dialog */}
        <Dialog open={showOpenProgressDialog} onOpenChange={setShowOpenProgressDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resume Saved Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">Enter your PIN to resume your saved test:</p>
              <Input
                type="password"
                placeholder="Enter your PIN"
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value)}
                className="text-lg tracking-widest"
              />
              <Button
                onClick={handleOpenProgress}
                disabled={!tempPin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                📂 Load Progress
              </Button>
              <Button
                onClick={() => {
                  setShowOpenProgressDialog(false);
                  setTempPin("");
                }}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <Button onClick={handlePreviousQuestion} variant="ghost" disabled={testState.currentQuestionIndex === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-600">Question {testState.currentQuestionIndex + 1} of {selectedQuestions.length}</p>
            <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <Button onClick={handleNextQuestion} variant="ghost" disabled={testState.currentQuestionIndex === selectedQuestions.length - 1}>
            Next <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </div>

        {/* Question */}
        <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.prompt}</h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {["a", "b", "c", "d"].map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? "border-blue-600 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <span className="font-semibold text-blue-600 mr-3">{option.toUpperCase()}.</span>
                {currentQuestion[option as 'a' | 'b' | 'c' | 'd']}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" /> Save Progress
          </Button>
          <Button
            onClick={() => setShowFinishDialog(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center"
          >
            <Send className="mr-2 h-4 w-4" /> Finish Test
          </Button>
        </div>

        {/* Save Progress Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Save Your Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">Create a PIN to save your progress (4+ digits):</p>
              <Input
                type="password"
                placeholder="Enter PIN"
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value)}
                className="text-lg tracking-widest"
              />
              <Button
                onClick={handleSaveProgress}
                disabled={!tempPin || tempPin.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" /> Save with PIN
              </Button>
              <Button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTempPin("");
                }}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Finish Test Dialog */}
        <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                You have answered {Object.keys(testState.selectedAnswers).length} of {selectedQuestions.length} questions.
              </p>
              <p className="text-lg font-semibold">
                Current Score: {testState.score} / {selectedQuestions.length}
              </p>
              <Button
                onClick={handleFinishTest}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-4 w-4" /> Submit Test
              </Button>
              <Button
                onClick={() => setShowFinishDialog(false)}
                variant="outline"
                className="w-full"
              >
                Continue Testing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <p className="text-gray-700">Correct: {testState.score} / {selectedQuestions.length}</p>
        </div>

        <Button
          onClick={handleRetakeTest}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
        >
          <RotateCcw className="mr-2 h-5 w-5" /> Retake Test
        </Button>
      </motion.div>
    );
  }

  // Certificate Screen (Passed)
  if (testState.mode === "certificate") {
    const finalPercentage = Math.round((testState.score / selectedQuestions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-6 space-y-8 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-green-600">🎉 Congratulations!</h1>
          <p className="text-2xl font-semibold text-gray-700">You Passed!</p>
          <p className="text-gray-600">Score: {finalPercentage}%</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-lg font-semibold text-green-700 mb-4">Download Your Certificate</p>
          <p className="text-gray-600 mb-4">Enter your name to generate your certificate:</p>
          <Input
            type="text"
            placeholder="Your Full Name"
            value={testState.userName}
            onChange={(e) => setTestState(prev => ({ ...prev, userName: e.target.value }))}
            className="mb-4"
          />
          <Button
            onClick={handleGenerateCertificate}
            disabled={!testState.userName.trim() || generateCertMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
          >
            <Download className="mr-2 h-5 w-5" /> Download Certificate
          </Button>
        </div>

        <Button
          onClick={handleRetakeTest}
          variant="outline"
          className="w-full py-6 text-lg"
        >
          <RotateCcw className="mr-2 h-5 w-5" /> Retake Test
        </Button>
      </motion.div>
    );
  }

  return null;
}
