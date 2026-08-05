import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw } from 'lucide-react';

const pulseNeonGreen = `
  @keyframes pulseNeonGreen {
    0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.2); }
    50% { box-shadow: 0 0 30px rgba(34, 197, 94, 1), inset 0 0 20px rgba(34, 197, 94, 0.5); }
  }
  .pulse-neon-green {
    animation: pulseNeonGreen 0.6s ease-in-out;
  }
`;

// Add neon pulse animation to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseNeonGreen;
  document.head.appendChild(style);
}

// Fisher-Yates shuffle — returns a NEW array, does not mutate
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  id: number;
  question: string;
  options: string[];   // all 4 choices in their canonical order
  answer: string;      // exact string of the correct option
}

const QUESTIONS: Question[] = [
  { id: 1, question: "Urban residential speed limit?", options: ["20 mph", "25 mph", "30 mph", "35 mph"], answer: "25 mph" },
  { id: 2, question: "Express Consent Law means you agree to what?", options: ["Keep insurance in your vehicle at all times", "Blood/breath test if suspected of DUI", "Vehicle searches by law enforcement", "Pay all traffic fines within 30 days"], answer: "Blood/breath test if suspected of DUI" },
  { id: 3, question: "DWAI alcohol threshold for adults (21+)?", options: ["0.02%", "0.05%", "0.08%", "0.10%"], answer: "0.05%" },
  { id: 4, question: "Turn signal distance in urban areas?", options: ["At least 50 feet", "At least 100 feet", "At least 200 feet", "At least 500 feet"], answer: "At least 100 feet" },
  { id: 5, question: "Right-of-way at uncontrolled 4-way stops?", options: ["The vehicle on the left", "The vehicle on the right", "The larger vehicle", "Whichever vehicle accelerates first"], answer: "The vehicle on the right" },
  { id: 6, question: "Action for stopped emergency vehicles?", options: ["Maintain speed and honk your horn", "Move over a lane or slow down significantly", "Stop completely in your lane", "Flash your high beams to acknowledge them"], answer: "Move over a lane or slow down significantly" },
  { id: 7, question: "Minimum safe following distance?", options: ["1 second", "3 seconds", "5 seconds", "10 seconds"], answer: "3 seconds" },
  { id: 8, question: "Uphill parking with a curb — wheel direction?", options: ["Straight ahead", "Towards the curb (Right)", "Away from the curb (Left)", "It does not matter as long as the brake is set"], answer: "Away from the curb (Left)" },
  { id: 9, question: "Solid yellow light means?", options: ["Accelerate to beat the red light", "Stop immediately regardless of position", "Stop if safe, signal is changing to red", "Yield to pedestrians only"], answer: "Stop if safe, signal is changing to red" },
  { id: 10, question: "Yield to pedestrians in unmarked crosswalks?", options: ["No, only in marked crosswalks", "Yes, drivers must yield at all intersections", "Only if a police officer is present", "Pedestrians never have the right-of-way"], answer: "Yes, drivers must yield at all intersections" },
  { id: 11, question: "Flashing red traffic light means?", options: ["Slow down and proceed with caution", "Treat like a solid stop sign; stop completely", "Yield right-of-way without stopping", "Traffic light is broken; ignore it"], answer: "Treat like a solid stop sign; stop completely" },
  { id: 12, question: "Diamond-shaped sign means?", options: ["Regulatory instruction", "Warning or hazard ahead", "School zone corridor", "Interstate route marker"], answer: "Warning or hazard ahead" },
  { id: 13, question: "What are truck \"No-Zones\"?", options: ["Speed trap areas", "Blind spots where the truck cannot see you", "Bus-only transit lanes", "High-collision intersection points"], answer: "Blind spots where the truck cannot see you" },
  { id: 14, question: "What to do if hydroplaning?", options: ["Slam on the brakes firmly", "Ease off gas and steer straight until traction returns", "Turn hard toward the shoulder", "Shift into neutral and pull emergency brake"], answer: "Ease off gas and steer straight until traction returns" },
  { id: 15, question: "Under-21 zero-tolerance BAC limit?", options: ["0.00%", "0.02%", "0.05%", "0.08%"], answer: "0.02%" },
  { id: 16, question: "Best headlights for heavy fog?", options: ["High beams for maximum light distance", "Low beam headlights", "Parking lights only", "Emergency hazard lights only"], answer: "Low beam headlights" },
  { id: 17, question: "Can you cross double yellow lines?", options: ["To pass a slow-moving vehicle", "When turning left into a driveway or private road", "During daytime hours only", "Double yellow lines can never be crossed"], answer: "When turning left into a driveway or private road" },
  { id: 18, question: "School bus flashing red lights rule?", options: ["Stop from either direction until lights stop", "Slow down to 15 mph and proceed carefully", "Stop only if traveling behind the bus", "Honk your horn to warn children"], answer: "Stop from either direction until lights stop" },
  { id: 19, question: "When must headlights be on?", options: ["Sunset to sunrise, and visibility under 1,000 ft", "Only between midnight and 6 AM", "1 hour after sunset to 1 hour before sunrise", "Only during rainstorms"], answer: "Sunset to sunrise, and visibility under 1,000 ft" },
  { id: 20, question: "First offense penalty for texting and driving?", options: ["Verbal warning only", "$300 fine and 4 points on record", "$1,000 fine and automatic license suspension", "Mandatory 5 days in jail"], answer: "$300 fine and 4 points on record" },
  { id: 21, question: "Narrow mountain road right-of-way?", options: ["The vehicle traveling uphill", "The vehicle traveling downhill yields", "The heavier vehicle", "The vehicle traveling faster"], answer: "The vehicle traveling downhill yields" },
  { id: 22, question: "Seat belts increase crash survival by?", options: ["1.5 times", "2 times", "3 to 4 times", "10 times"], answer: "3 to 4 times" },
  { id: 23, question: "Safest hand position on steering wheel?", options: ["10 o'clock and 2 o'clock", "9 o'clock and 3 o'clock", "12 o'clock (one hand)", "8 o'clock and 4 o'clock"], answer: "9 o'clock and 3 o'clock" },
  { id: 24, question: "Flashing yellow arrow means?", options: ["The light is about to turn red", "Stop completely before turning", "Yield to traffic/pedestrians, turn when safe", "You have the absolute right-of-way"], answer: "Yield to traffic/pedestrians, turn when safe" },
  { id: 25, question: "Which way to look when backing up?", options: ["Over your left shoulder", "Over your right shoulder", "Solely at the backup camera display", "Exclusively in the rearview mirror"], answer: "Over your right shoulder" },
  { id: 26, question: "Bicycles' legal status on roads?", options: ["They must always ride on the sidewalk", "Same rights and responsibilities as cars", "They must yield to all traffic at all times", "They are not allowed on public roads"], answer: "Same rights and responsibilities as cars" },
  { id: 27, question: "Stopping distance for truck at 55 mph?", options: ["50 feet", "100 feet", "About 290 feet", "500 feet"], answer: "About 290 feet" },
  { id: 28, question: "Driving high on cannabis in Colorado?", options: ["Legal as long as you are 21 or older", "Only punished by a verbal warning", "Illegal, subject to same penalties as alcohol", "Permitted if you hold a medical card"], answer: "Illegal, subject to same penalties as alcohol" },
  { id: 29, question: "Purpose of highway left lane?", options: ["Slower traffic", "Cruising without speed limits", "Actively passing other vehicles", "Exiting the highway"], answer: "Actively passing other vehicles" },
  { id: 30, question: "Green road signs indicate?", options: ["Regulatory information (like speed limits)", "Warning of upcoming hazards", "Directional guidance and permitted movements", "Scenic and public recreation guidance"], answer: "Directional guidance and permitted movements" },
  { id: 31, question: "Right-of-way entering a roundabout?", options: ["Vehicles entering have the right-of-way", "Yield to traffic already circulating inside", "Always stop completely before entering", "Use your left turn signal when entering"], answer: "Yield to traffic already circulating inside" },
  { id: 32, question: "Can you use self-parking on tests?", options: ["Yes, if your car is equipped with them", "Yes, but only for parallel parking", "No, drivers must maneuver independently", "No, unless instructed by the examiner"], answer: "No, drivers must maneuver independently" },
  { id: 33, question: "Downhill parking with a curb — wheel direction?", options: ["Straight ahead", "Towards the curb (Right)", "Away from the curb (Left)", "It does not matter"], answer: "Towards the curb (Right)" },
  { id: 34, question: "Action for blind pedestrians with white canes?", options: ["Honk your horn to alert them", "Stop and always yield the right-of-way", "Proceed carefully at 10 mph", "Direct them to use a marked crosswalk"], answer: "Stop and always yield the right-of-way" },
  { id: 35, question: "Safe lane change steps?", options: ["Signal, steer, check mirrors", "Check mirrors, signal, blind spot, then move", "Check blind spot, move, then signal", "Accelerate, check mirrors, move"], answer: "Check mirrors, signal, blind spot, then move" },
  { id: 36, question: "Minimum passing space for bicyclists?", options: ["1 foot", "2 feet", "3 feet", "5 feet"], answer: "3 feet" },
  { id: 37, question: "Distance to dim high beams for oncoming cars?", options: ["100 feet", "200 feet", "500 feet", "1,000 feet"], answer: "500 feet" },
  { id: 38, question: "Closest distance to stop from a train track?", options: ["5 feet", "10 feet", "15 feet", "30 feet"], answer: "15 feet" },
  { id: 39, question: "Speeding fine in a construction zone?", options: ["Standard speeding fine applies", "Mandatory license suspension", "Traffic fines are doubled", "Automatic impoundment of the vehicle"], answer: "Traffic fines are doubled" },
  { id: 40, question: "Road surfaces that freeze first?", options: ["Dirt roads", "Asphalt highways in direct sunlight", "Bridges and overpasses", "Intersections with heavy traffic"], answer: "Bridges and overpasses" },
  { id: 41, question: "Age kids need a car seat or booster?", options: ["4th birthday", "6th birthday", "8th birthday", "12th birthday"], answer: "8th birthday" },
  { id: 42, question: "First action during a tire blowout?", options: ["Slam on the brakes immediately", "Grip wheel firmly, stay in lane, ease off gas", "Swerve sharply onto the shoulder", "Downshift into the lowest gear"], answer: "Grip wheel firmly, stay in lane, ease off gas" },
  { id: 43, question: "How to enter a freeway safely?", options: ["Stop completely at the end of the ramp", "Match traffic flow speed and merge when safe", "Accelerate past speed limit to get ahead", "Merge immediately; traffic must yield to you"], answer: "Match traffic flow speed and merge when safe" },
  { id: 44, question: "Flashing yellow traffic signal means?", options: ["Stop and wait for a green light", "Treat it as a four-way stop", "Slow down and proceed with caution", "Pedestrians are crossing"], answer: "Slow down and proceed with caution" },
  { id: 45, question: "Stopping quickly without ABS on ice?", options: ["Stomp on the brake pedal and hold it down", "Pump the brakes smoothly to prevent locking", "Shift into neutral and coast to a stop", "Use emergency parking brake only"], answer: "Pump the brakes smoothly to prevent locking" },
  { id: 46, question: "U-turns are illegal if you cannot see:", options: ["On any multi-lane highway", "500 feet in both directions", "In any residential district", "During daylight hours"], answer: "500 feet in both directions" },
  { id: 47, question: "Solid white line between traffic lanes?", options: ["Passing is strictly prohibited", "Lane changes are discouraged but not illegal", "High-occupancy vehicles only", "You are entering a construction zone"], answer: "Lane changes are discouraged but not illegal" },
  { id: 48, question: "Yellow diagonal road lines mean?", options: ["A pedestrian crosswalk", "A buffer zone that cannot be used for travel", "A designated turning lane", "An upcoming toll booth"], answer: "A buffer zone that cannot be used for travel" },
  { id: 49, question: "No passing distance near intersections/bridges?", options: ["50 feet", "100 feet", "200 feet", "500 feet"], answer: "100 feet" },
  { id: 50, question: "Under-18 curfew during first license year?", options: ["10:00 p.m. and 5:00 a.m.", "11:00 p.m. and 6:00 a.m.", "Midnight and 5:00 a.m.", "9:00 p.m. and 6:00 a.m."], answer: "Midnight and 5:00 a.m." },
  { id: 51, question: "Max standard fine for first DUI?", options: ["$500", "$1,000", "$2,000", "$5,000"], answer: "$1,000" },
  { id: 52, question: "License points for a first DWAI?", options: ["2 points", "4 points", "6 points", "8 points"], answer: "8 points" },
  { id: 53, question: "Shape of a school zone sign?", options: ["Diamond", "Pentagon", "Circle", "Octagon"], answer: "Pentagon" },
  { id: 54, question: "Pennant-shaped sign means?", options: ["School crossing ahead", "Railroad crossing", "No passing zone", "Yield right-of-way"], answer: "No passing zone" },
  { id: 55, question: "Green light responsibility?", options: ["Accelerate to clear intersection quickly", "Proceed immediately, unconditional right-of-way", "Yield to traffic/pedestrians already in it", "Stop, check traffic, then proceed"], answer: "Yield to traffic/pedestrians already in it" },
  { id: 56, question: "Weight requiring a Commercial Driver License?", options: ["10,001 pounds or more", "16,001 pounds or more", "26,001 pounds or more", "32,001 pounds or more"], answer: "26,001 pounds or more" },
  { id: 57, question: "Passenger count requiring a CDL?", options: ["8 or more", "12 or more", "16 or more", "20 or more"], answer: "16 or more" },
  { id: 58, question: "Can foreign tourists drive in Colorado?", options: ["No, they must get a CO license immediately", "Yes, but only with an International Permit", "Yes, with their valid personal license", "Yes, but only if accompanied by a US citizen"], answer: "Yes, with their valid personal license" },
  { id: 59, question: "Minor permit extra requirement?", options: ["School principal recommendation letter", "Parent-signed Affidavit of Liability", "Proof of minimum 3.0 GPA", "A monetary deposit"], answer: "Parent-signed Affidavit of Liability" },
  { id: 60, question: "DMV written test cutoff time before closing?", options: ["Up to the exact closing time", "No tests started within 30 minutes of close", "No tests started within 1 hour of close", "Tests must be completed by 3:00 p.m."], answer: "No tests started within 30 minutes of close" },
  { id: 61, question: "Solid yellow line on your side means?", options: ["You are on a one-way street", "You may pass if clear", "No passing allowed from your side", "The lane is ending"], answer: "No passing allowed from your side" },
  { id: 62, question: "Thick white stop lines mean?", options: ["Pedestrian walking path", "Exact spot to stop before intersection/crosswalk", "Warning of a speed bump", "Separate turning lanes"], answer: "Exact spot to stop before intersection/crosswalk" },
  { id: 63, question: "Retake wait time if you fail written test?", options: ["Immediately on the same day", "After a 7-day waiting period", "Next business day (after 24 hours)", "After a driver's ed course"], answer: "Next business day (after 24 hours)" },
  { id: 64, question: "Mandatory jail for 3rd DUI/DWAI?", options: ["2 to 10 days", "10 to 30 days", "At least 60 days up to 1 year", "Minimum of 5 years"], answer: "At least 60 days up to 1 year" },
  { id: 65, question: "Steady red arrow signal means?", options: ["Yield and turn when safe", "Stop completely, then turn cautiously", "Cannot turn in the direction of the arrow", "Signal is about to turn green"], answer: "Cannot turn in the direction of the arrow" },
  { id: 66, question: "Time limit to get license after moving to CO?", options: ["10 days", "30 days", "60 days", "90 days"], answer: "30 days" },
  { id: 67, question: "How to treat a broken dead traffic light?", options: ["Yield to the right and proceed slowly", "Treat as a four-way stop", "Keep moving if on main road", "Pull over and wait for police"], answer: "Treat as a four-way stop" },
  { id: 68, question: "Is it legal to wear headphones in both ears?", options: ["Yes, if listening to navigation", "Yes, on interstate highways only", "No, wearing earphones in both ears is illegal", "Only if you are over 21"], answer: "No, wearing earphones in both ears is illegal" },
  { id: 69, question: "What to do if gas pedal sticks?", options: ["Turn off ignition immediately", "Shift to neutral, brake, and steer to shoulder", "Pump gas pedal rapidly", "Pull emergency brake hard"], answer: "Shift to neutral, brake, and steer to shoulder" },
  { id: 70, question: "Standard passenger car license class?", options: ["Class A", "Class B", "Class M", "Class R"], answer: "Class R" },
  { id: 71, question: "Points causing adult license suspension?", options: ["6 points in 12 months", "12 points in 12 months, or 18 in 24 months", "15 points in 12 months", "20 points in 24 months"], answer: "12 points in 12 months, or 18 in 24 months" },
  { id: 72, question: "Main cause of rear-end crashes?", options: ["Speeding", "Following too closely (tailgating)", "Poor visibility", "Brake failure"], answer: "Following too closely (tailgating)" },
  { id: 73, question: "Safest way down steep mountains?", options: ["Ride your brakes the entire way", "Shift into neutral and coast", "Shift into a lower gear", "Turn the engine off"], answer: "Shift into a lower gear" },
  { id: 74, question: "Red circle with a slash through it means?", options: ["Stop ahead", "The action depicted is prohibited", "Yield to traffic", "Construction zone begins"], answer: "The action depicted is prohibited" },
  { id: 75, question: "Hitting an empty parked car?", options: ["Leave scene immediately if no damage", "Call insurance and drive away", "Find owner or leave note and report to police", "Wait 15 minutes before leaving"], answer: "Find owner or leave note and report to police" },
  { id: 76, question: "Can you park on a bridge or tunnel?", options: ["During daylight hours only", "If you have a flat tire", "Never, unless directed by police", "If the shoulder is wide enough"], answer: "Never, unless directed by police" },
  { id: 77, question: "Funeral procession rule?", options: ["Pass them as quickly as possible", "Yield the right-of-way to the whole procession", "Honk respectfully", "Merge into the middle of them"], answer: "Yield the right-of-way to the whole procession" },
  { id: 78, question: "Solid and broken yellow line combo means?", options: ["A shared turn lane", "Pass only on the side with the broken line", "No passing for either direction", "Road is merging into one lane"], answer: "Pass only on the side with the broken line" },
  { id: 79, question: "What to do if you see a drunk driver?", options: ["Try to pass them quickly", "Keep distance and call 911 or *CSP", "Flash high beams repeatedly to warn them", "Follow closely to record license plate"], answer: "Keep distance and call 911 or *CSP" },
  { id: 80, question: "When can you cross lowered train gates?", options: ["As soon as the train passes", "If you can maneuver around them", "Only after gates are fully raised and lights stop", "If the train is moving slowly"], answer: "Only after gates are fully raised and lights stop" },
  { id: 81, question: "Roundabout traffic flow direction?", options: ["Clockwise", "Counter-clockwise", "Alternating based on time of day", "Straight through the center"], answer: "Counter-clockwise" },
  { id: 82, question: "Common rural road hazards?", options: ["Heavy pedestrian traffic", "Unmarked intersections, farm equipment, livestock", "Excessive traffic signals", "Multi-lane merging grids"], answer: "Unmarked intersections, farm equipment, livestock" },
  { id: 83, question: "Flashing yellow beacon at a warning sign?", options: ["Stop immediately", "Proceed with caution", "Intersection is closed", "Speed limit drops to 15 mph"], answer: "Proceed with caution" },
  { id: 84, question: "Penalty for running from the police?", options: ["4 points on your license", "Mandatory defensive driving course", "12 points and mandatory license revocation", "A verbal warning"], answer: "12 points and mandatory license revocation" },
  { id: 85, question: "Parking distance from a fire hydrant?", options: ["10 feet", "15 feet", "20 feet", "30 feet"], answer: "15 feet" },
  { id: 86, question: "Speed limit on winding mountain curves?", options: ["15 mph", "20 mph", "25 mph", "30 mph"], answer: "20 mph" },
  { id: 87, question: "Under-18 cell phone rule?", options: ["Hands-free use is allowed", "Texting is allowed at red lights", "Banned entirely except for emergencies", "Allowed if a parent is in the car"], answer: "Banned entirely except for emergencies" },
  { id: 88, question: "Penalty for refusing a breath/blood test?", options: ["You will receive a warning", "You will be fined $500", "Automatic 1-year license revocation", "You will receive 6 points"], answer: "Automatic 1-year license revocation" },
  { id: 89, question: "Divided highway school bus rule?", options: ["Yes, all traffic must stop", "No, vehicles across physical median don't stop", "Only if children are crossing", "Only if speed limit is under 40 mph"], answer: "No, vehicles across physical median don't stop" },
  { id: 90, question: "Shared center lane purpose?", options: ["Passing slow vehicles", "Making left turns only", "Driving straight in heavy traffic", "Parking temporarily"], answer: "Making left turns only" },
  { id: 91, question: "Time limit to update address with DMV?", options: ["10 days", "15 days", "30 days", "60 days"], answer: "30 days" },
  { id: 92, question: "When can you pass on the right?", options: ["Car ahead is turning left and paved space exists", "By driving onto unpaved shoulder", "In a construction zone", "When you are in a single-lane road"], answer: "Car ahead is turning left and paved space exists" },
  { id: 93, question: "First step if brakes completely fail?", options: ["Pull emergency brake hard", "Shift into reverse", "Pump brake pedal rapidly and shift to lower gear", "Turn off the engine"], answer: "Pump brake pedal rapidly and shift to lower gear" },
  { id: 94, question: "Steady red \"X\" over a lane means?", options: ["Proceed with caution", "Lane is for carpools only", "Do not drive in this lane", "Lane is ending ahead"], answer: "Do not drive in this lane" },
  { id: 95, question: "Crash with no injuries on a busy road?", options: ["Leave it exactly where it is", "Move it off road to avoid blocking traffic", "Wait for a tow truck before moving", "Drive home and report next day"], answer: "Move it off road to avoid blocking traffic" },
  { id: 96, question: "Open mountain highway speed limit?", options: ["30 mph", "40 mph", "55 mph", "65 mph"], answer: "40 mph" },
  { id: 97, question: "Parking distance from an intersection crosswalk?", options: ["At least 5 feet", "At least 10 feet", "At least 20 feet", "At least 30 feet"], answer: "At least 20 feet" },
  { id: 98, question: "Flashing red arrow signal means?", options: ["Turn immediately without stopping", "Stop completely, yield, then proceed when safe", "Traffic signal is out of order", "You cannot turn in that direction"], answer: "Stop completely, yield, then proceed when safe" },
  { id: 99, question: "What to do if you miss your highway exit?", options: ["Stop and back up on the shoulder", "Make a U-turn through the median crossover", "Proceed to the next exit", "Stop in right lane and wait for gap"], answer: "Proceed to the next exit" },
  { id: 100, question: "Under-18 passenger restriction (first 6 months)?", options: ["No passengers allowed at all", "Only one passenger under 21 allowed", "No passengers under 21 unless family", "No passengers over 21 allowed"], answer: "No passengers under 21 unless family" },
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
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  // Shuffled question order for the whole session — created once on start
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);

  const currentQuestion = sessionQuestions[currentQuestionIndex];

  // Per-question shuffled options — re-shuffle each time the question changes
  const shuffledOptions = useMemo(
    () => (currentQuestion ? shuffle(currentQuestion.options) : []),
    [currentQuestion]
  );

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
  }, [isStarted, isAnswering, testComplete, currentQuestionIndex]);

  const calculatePoints = (timeRemaining: number, correct: boolean): number => {
    if (!correct) return 0;
    return Math.max(1, Math.round((timeRemaining / 3) * 200));
  };

  const handleTimeout = () => {
    if (!currentQuestion) return;
    setScores(prev => [...prev, { questionId: currentQuestion.id, points: 0, correct: false }]);
    moveToNextQuestion();
  };

  const handleAnswer = (answer: string) => {
    if (isAnswering || !currentQuestion) return;

    setIsAnswering(true);
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.answer;
    const points = calculatePoints(timeLeft, isCorrect);
    setScore(prev => prev + points);
    setScores(prev => [...prev, { questionId: currentQuestion.id, points, correct: isCorrect }]);
    if (isCorrect && points > 0) setEarnedPoints(points);

    setTimeout(() => {
      moveToNextQuestion();
      setIsAnswering(false);
      setSelectedAnswer(null);
      setEarnedPoints(null);
    }, 500);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(3);
    } else {
      setTestComplete(true);
    }
  };

  const handleStart = () => {
    setSessionQuestions(shuffle(QUESTIONS));
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setTimeLeft(3);
    setScore(0);
    setScores([]);
    setTestComplete(false);
    setSelectedAnswer(null);
    setIsAnswering(false);
  };

  const handleReset = () => {
    setIsStarted(false);
    setCurrentQuestionIndex(0);
    setTimeLeft(3);
    setScore(0);
    setScores([]);
    setTestComplete(false);
    setSelectedAnswer(null);
    setIsAnswering(false);
    setSessionQuestions([]);
    setEarnedPoints(null);
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
          <img src="/manus-storage/header_b6795826.png" alt="DMV License Speed Test" className="w-full max-w-xl mx-auto mb-2 rounded-xl" />
          <h2 className="text-xl text-blue-600 font-semibold mb-6">Top Scores Guaranteed License Exam Pass</h2>

          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
            <p className="text-gray-700 mb-4">
              Test your DMV knowledge with 100 rapid-fire questions. You have 3 seconds per question. Score 1–200 points based on speed and accuracy. Questions and answer order are randomized every session.
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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
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

  if (!currentQuestion) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
        {/* Timer and Progress */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-semibold text-gray-600">
            Question {currentQuestionIndex + 1} of {sessionQuestions.length}
          </div>
          <motion.div
            animate={{ scale: timeLeft <= 1 ? [1, 1.1, 1] : 1 }}
            className={`text-3xl font-bold ${timeLeft <= 1 ? 'text-red-600' : timeLeft <= 2 ? 'text-yellow-600' : 'text-green-600'}`}
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

            {/* Options — shuffled per question, different color per slot */}
            <div className="space-y-3">
              {shuffledOptions.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.answer;
                const bgColor = COLORS[index % COLORS.length];

                return (
                  <motion.button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswering}
                    initial={{ x: index % 2 === 0 ? -200 : 200, opacity: 0 }}
                    animate={{
                      x: isAnswering && isSelected && !isCorrect ? [0, -8, 8, -6, 6, -4, 4, 0] : 0,
                      y: isAnswering && isSelected && !isCorrect
                        ? [0, 0, 0, 10, 20, 40, 80, 120]
                        : isAnswering && isSelected && isCorrect ? -10 : 0,
                      opacity: isAnswering && isSelected && !isCorrect ? [1, 1, 1, 0.8, 0.6, 0.4, 0.2, 0] : 1,
                      rotate: isAnswering && isSelected && !isCorrect ? [0, -8, 8, -12, 15, -20, 25, 30] : 0,
                      scale: isAnswering && isSelected && !isCorrect
                        ? [1, 0.95, 0.9, 0.85, 0.75, 0.6, 0.4, 0.2]
                        : isAnswering && isSelected && isCorrect ? 3 : 1,
                    }}
                    transition={
                      isAnswering && isSelected
                        ? { duration: 0.4 }
                        : { delay: index * 0.1, duration: 0.4 }
                    }
                    whileHover={!isAnswering ? { scale: 1.02 } : {}}
                    whileTap={!isAnswering ? { scale: 0.98 } : {}}
                    className={`w-full p-4 rounded-lg font-semibold text-white transition-all ${bgColor} ${
                      isAnswering && !isSelected ? 'opacity-50' : ''
                    } ${isAnswering && isSelected && isCorrect ? 'bg-green-500 pulse-neon-green ring-4 ring-green-300' : ''} ${
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

        {/* Floating points burst */}
        <AnimatePresence>
          {earnedPoints !== null && (
            <motion.div
              key={`points-${currentQuestionIndex}`}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -120, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 text-6xl font-black text-blue-500 drop-shadow-[0_0_18px_rgba(59,130,246,0.9)]"
              style={{ top: '50%' }}
            >
              +{earnedPoints}
            </motion.div>
          )}
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
