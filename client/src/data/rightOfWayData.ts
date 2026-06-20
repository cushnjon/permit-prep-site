// Right-of-Way Roulette: Scenario-Based Decision Game
export interface ScenarioChoice {
  id: string;
  text: string;
  is_correct: boolean;
  feedback: string;
  points: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  image_description: string;
  choices: ScenarioChoice[];
  learning_tip: string;
}

export const rightOfWayScenarios: Scenario[] = [
  {
    id: "scenario_1",
    title: "Intersection Standoff",
    description: "You and another car arrive at an uncontrolled intersection at the same time",
    situation: "You're driving straight through an intersection with no traffic lights. Another car is coming from your left, also driving straight. You both arrive at the intersection simultaneously.",
    image_description: "Two cars approaching an intersection from perpendicular directions",
    choices: [
      {
        id: "choice_1a",
        text: "Speed up and go through first",
        is_correct: false,
        feedback: "Wrong! Speeding up creates danger. Use the Rule of the Right instead.",
        points: 0
      },
      {
        id: "choice_1b",
        text: "Yield to the car on your right",
        is_correct: true,
        feedback: "Correct! The Rule of the Right says the vehicle on your right has priority. Yield and let them pass safely.",
        points: 10
      },
      {
        id: "choice_1c",
        text: "Flash your headlights to signal your intent",
        is_correct: false,
        feedback: "Incorrect. Headlight signals aren't reliable. Follow the Rule of the Right instead.",
        points: 0
      },
      {
        id: "choice_1d",
        text: "Honk your horn to warn them",
        is_correct: false,
        feedback: "Not the right answer. Honking doesn't establish right-of-way. Use the Rule of the Right.",
        points: 0
      }
    ],
    learning_tip: "At uncontrolled intersections, always remember: the vehicle on your RIGHT has the right-of-way when arriving simultaneously."
  },
  {
    id: "scenario_2",
    title: "Yield Sign Approach",
    description: "You're approaching a yield sign with cross traffic nearby",
    situation: "You're driving on a side road approaching a yield sign. The main road ahead has a car approaching from your left about 100 feet away, traveling at normal speed.",
    image_description: "A car at a yield sign with another vehicle on the main road approaching",
    choices: [
      {
        id: "choice_2a",
        text: "Slow down and merge into traffic if there's a gap",
        is_correct: false,
        feedback: "Too risky! You must come to a complete stop if traffic is present.",
        points: 0
      },
      {
        id: "choice_2b",
        text: "Come to a complete stop and wait for the car to pass",
        is_correct: true,
        feedback: "Perfect! A yield sign requires you to stop if traffic is present. Safety first!",
        points: 10
      },
      {
        id: "choice_2c",
        text: "Maintain your current speed and merge smoothly",
        is_correct: false,
        feedback: "Dangerous! You must yield to cross traffic. Stop first.",
        points: 0
      },
      {
        id: "choice_2d",
        text: "Accelerate to get ahead of the oncoming car",
        is_correct: false,
        feedback: "Never! This creates a collision hazard. Always yield at yield signs.",
        points: 0
      }
    ],
    learning_tip: "Yield signs mean: slow down, look, and stop if necessary. You must give the right-of-way to other traffic."
  },
  {
    id: "scenario_3",
    title: "Left Turn Dilemma",
    description: "You're turning left at a green light with oncoming traffic",
    situation: "You're at a green light preparing to turn left. There's oncoming traffic in the opposite lane also with a green light. A car is approaching in the opposite direction.",
    image_description: "A car at a green light turning left with oncoming traffic",
    choices: [
      {
        id: "choice_3a",
        text: "Turn left immediately since you have a green light",
        is_correct: false,
        feedback: "Wrong! Green lights don't override right-of-way. Oncoming traffic has priority.",
        points: 0
      },
      {
        id: "choice_3b",
        text: "Yield to oncoming traffic and wait for them to pass",
        is_correct: true,
        feedback: "Correct! When turning left, you must yield to oncoming traffic even at a green light.",
        points: 10
      },
      {
        id: "choice_3c",
        text: "Speed up to complete the turn before they reach you",
        is_correct: false,
        feedback: "Dangerous! Never rush a left turn. Yield to oncoming traffic.",
        points: 0
      },
      {
        id: "choice_3d",
        text: "Flash your lights to indicate your turn",
        is_correct: false,
        feedback: "Signals don't establish right-of-way. You must yield to oncoming traffic.",
        points: 0
      }
    ],
    learning_tip: "When turning left, you must yield to oncoming traffic. A green light doesn't override this rule."
  },
  {
    id: "scenario_4",
    title: "Pedestrian Priority",
    description: "A pedestrian is crossing at a marked crosswalk",
    situation: "You're approaching a marked crosswalk. A pedestrian is in the middle of the street crossing. You have a green light, but the pedestrian is still in your path.",
    image_description: "A pedestrian crossing in a marked crosswalk with a car approaching",
    choices: [
      {
        id: "choice_4a",
        text: "Proceed through since you have a green light",
        is_correct: false,
        feedback: "Wrong! Pedestrians always have priority. Stop and let them cross safely.",
        points: 0
      },
      {
        id: "choice_4b",
        text: "Slow down but continue moving through the crosswalk",
        is_correct: false,
        feedback: "Incorrect. You must come to a complete stop for pedestrians.",
        points: 0
      },
      {
        id: "choice_4c",
        text: "Stop completely and let the pedestrian finish crossing",
        is_correct: true,
        feedback: "Perfect! Pedestrians always have the right-of-way at crosswalks. Safety is paramount!",
        points: 10
      },
      {
        id: "choice_4d",
        text: "Honk to alert the pedestrian to hurry",
        is_correct: false,
        feedback: "Never! Honking is rude and doesn't establish your right-of-way. Stop and wait.",
        points: 0
      }
    ],
    learning_tip: "Pedestrians always have the right-of-way at marked crosswalks. Stop completely and wait for them to cross."
  },
  {
    id: "scenario_5",
    title: "Merging Highway Traffic",
    description: "You're merging onto a busy highway",
    situation: "You're on an acceleration lane merging onto a highway. Traffic is moving at 55 MPH. You need to merge into the right lane where a car is traveling at the same speed.",
    image_description: "A car merging onto a highway with existing traffic",
    choices: [
      {
        id: "choice_5a",
        text: "Merge immediately into the nearest gap",
        is_correct: false,
        feedback: "Too risky! Check your blind spot and match the traffic speed first.",
        points: 0
      },
      {
        id: "choice_5b",
        text: "Accelerate to match traffic speed, check blind spot, then merge smoothly",
        is_correct: true,
        feedback: "Excellent! This is the safe merging procedure. You have the right-of-way on the acceleration lane.",
        points: 10
      },
      {
        id: "choice_5c",
        text: "Slow down and wait for traffic to clear",
        is_correct: false,
        feedback: "Incorrect. You should accelerate to match traffic speed for safe merging.",
        points: 0
      },
      {
        id: "choice_5d",
        text: "Force your way into traffic with your turn signal on",
        is_correct: false,
        feedback: "Never force a merge! Accelerate to match speed and merge smoothly into a gap.",
        points: 0
      }
    ],
    learning_tip: "When merging, accelerate to match traffic speed, check your blind spot, and merge smoothly into a safe gap."
  }
];
