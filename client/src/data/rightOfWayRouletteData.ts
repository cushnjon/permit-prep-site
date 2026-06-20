export interface Vehicle {
  id: string;
  type: "car" | "pedestrian" | "emergency";
  position: "North" | "South" | "East" | "West" | "Northeast" | "Northwest" | "Southeast" | "Southwest" | "Crosswalk";
  action: string;
  arrival_time: string;
  signal?: string;
}

export interface IntersectionScenario {
  scenario_id: string;
  title: string;
  intersection_type: string;
  setup: Record<string, Vehicle>;
  correct_sequence: string[];
  rule_explanation: string;
  crash_fail_text: string;
  points: number;
}

export const rightOfWayRouletteScenarios: IntersectionScenario[] = [
  {
    scenario_id: "ROW_01",
    title: "The All-Way Stop Duel",
    intersection_type: "4-Way Stop (Sign-Controlled)",
    setup: {
      car_A: {
        id: "car_A",
        type: "car",
        position: "North",
        action: "Going Straight",
        arrival_time: "12:00:01"
      },
      car_B: {
        id: "car_B",
        type: "car",
        position: "East",
        action: "Turning Left",
        arrival_time: "12:00:03"
      },
      car_C: {
        id: "car_C",
        type: "car",
        position: "South",
        action: "Going Straight",
        arrival_time: "12:00:01"
      }
    },
    correct_sequence: ["car_A", "car_C", "car_B"],
    rule_explanation:
      "Car A and Car C arrived at the exact same millisecond, but both are traveling straight, meaning their paths do not cross—they can clear safely at the same time. Car B arrived last, so it must wait for the entire intersection to clear.",
    crash_fail_text:
      "CRASH! Car B cut off the straight lanes. The handbook states that at a multi-way stop, vehicles proceed in the absolute order of arrival, and turning vehicles must yield to oncoming straight traffic if arriving simultaneously.",
    points: 15
  },
  {
    scenario_id: "ROW_02",
    title: "The Blind Right Hand",
    intersection_type: "Uncontrolled Grid (No Signs)",
    setup: {
      car_A: {
        id: "car_A",
        type: "car",
        position: "West",
        action: "Going Straight",
        arrival_time: "Simultaneous"
      },
      car_B: {
        id: "car_B",
        type: "car",
        position: "South",
        action: "Going Straight",
        arrival_time: "Simultaneous"
      }
    },
    correct_sequence: ["car_A", "car_B"],
    rule_explanation:
      "When two vehicles arrive at an uncontrolled intersection simultaneously, the driver on the left must yield to the driver on the right. Car A is to the right of Car B.",
    crash_fail_text:
      "FENDER BENDER! Car B failed to use the 'Rule of the Right.' Since Car A was positioned on Car B's right side, Car A possessed absolute priority at an unmarked junction.",
    points: 15
  },
  {
    scenario_id: "ROW_03",
    title: "The Pedestrian Premium",
    intersection_type: "T-Junction Green Light",
    setup: {
      car_A: {
        id: "car_A",
        type: "car",
        position: "South",
        action: "Turning Right",
        signal: "Green Light",
        arrival_time: "Simultaneous"
      },
      pedestrian: {
        id: "pedestrian",
        type: "pedestrian",
        position: "Crosswalk",
        action: "Walking across North-South path",
        arrival_time: "Simultaneous"
      }
    },
    correct_sequence: ["pedestrian", "car_A"],
    rule_explanation:
      "Pedestrians legally walking in marked or unmarked crosswalks always maintain absolute statutory priority over turning motorized vehicles, regardless of green signal conditions.",
    crash_fail_text:
      "GAME OVER! Pedestrians always have the right-of-way in crosswalks. Turning vehicles must wait for the walking corridor to be fully cleared of foot traffic before crossing the white line.",
    points: 20
  },
  {
    scenario_id: "ROW_04",
    title: "The Flashing Siren Shield",
    intersection_type: "Standard 4-Way (Green Signal)",
    setup: {
      car_A: {
        id: "car_A",
        type: "car",
        position: "West",
        action: "Going Straight",
        signal: "Green Light",
        arrival_time: "Immediate"
      },
      car_B: {
        id: "car_B",
        type: "car",
        position: "South",
        action: "Going Straight",
        signal: "Green Light",
        arrival_time: "Immediate"
      },
      emergency_vehicle: {
        id: "emergency_vehicle",
        type: "emergency",
        position: "East",
        action: "Responding with active lights/sirens",
        arrival_time: "Immediate"
      }
    },
    correct_sequence: ["emergency_vehicle", "car_A", "car_B"],
    rule_explanation:
      "Emergency vehicles running red lights with active audio sirens and flashing strobe lights override every single standard traffic control device and signal grid in the state handbook.",
    crash_fail_text:
      "CITATION ISSUED! Failure to yield to an active emergency responder. You must immediately pull over to the right curb line and halt until all emergency vehicles pass completely.",
    points: 20
  }
];
