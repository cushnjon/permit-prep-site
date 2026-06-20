export interface Vehicle {
  id: string;
  label: string;
  position: string;
  action: string;
  emoji: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Pedestrian {
  id: string;
  label: string;
  position: string;
  action: string;
  emoji: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface EmergencyVehicle {
  id: string;
  label: string;
  position: string;
  action: string;
  emoji: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Scenario {
  scenario_id: string;
  title: string;
  intersection_type: string;
  setup: {
    car_A?: Vehicle;
    car_B?: Vehicle;
    car_C?: Vehicle;
    pedestrian?: Pedestrian;
    emergency_vehicle?: EmergencyVehicle;
  };
  correct_sequence: string[];
  rule_explanation: string;
  crash_fail_text: string;
  background_type: "4way" | "tjunction" | "roundabout" | "highway";
}

const scenarios: Scenario[] = [
  {
    scenario_id: "ROW_01",
    title: "The All-Way Stop Duel",
    intersection_type: "4-Way Stop (Sign-Controlled)",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "North",
        action: "Going Straight",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 250,
        startY: 50,
        endX: 250,
        endY: 250,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "East",
        action: "Turning Left",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 450,
        startY: 200,
        endX: 250,
        endY: 200,
      },
      car_C: {
        id: "car_C",
        label: "CAR C",
        position: "South",
        action: "Going Straight",
        emoji: "🚗",
        color: "#FFE66D",
        startX: 250,
        startY: 350,
        endX: 250,
        endY: 150,
      },
    },
    correct_sequence: ["car_A", "car_C", "car_B"],
    rule_explanation:
      "Car A and Car C arrived at the exact same millisecond, but both are traveling straight, meaning their paths do not cross—they can clear safely at the same time. Car B arrived last, so it must wait for the entire intersection to clear.",
    crash_fail_text:
      "CRASH! Car B cut off the straight lanes. The handbook states that at a multi-way stop, vehicles proceed in the absolute order of arrival, and turning vehicles must yield to oncoming straight traffic if arriving simultaneously.",
    background_type: "4way",
  },
  {
    scenario_id: "ROW_02",
    title: "The Yield Sign Standard",
    intersection_type: "T-Junction with Yield Sign",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "West (Main Road)",
        action: "Going Straight",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 50,
        startY: 200,
        endX: 450,
        endY: 200,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "North (Side Road)",
        action: "Turning Right",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 250,
        startY: 50,
        endX: 450,
        endY: 200,
      },
    },
    correct_sequence: ["car_A", "car_B"],
    rule_explanation:
      "A yield sign means you must slow down and defer to all cross-traffic on the main road. Car B must wait until there is a safe gap in traffic before joining the flow.",
    crash_fail_text:
      "FENDER BENDER! Car B pulled out directly in front of oncoming traffic. A yield sign requires you to give the right-of-way to any vehicle already in or closely approaching the intersection.",
    background_type: "tjunction",
  },
  {
    scenario_id: "ROW_03",
    title: "The Modern Roundabout",
    intersection_type: "Circular Roundabout",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "Inside Circle",
        action: "Circulating past East exit",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 300,
        startY: 150,
        endX: 350,
        endY: 200,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "South Entrance",
        action: "Entering Roundabout",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 250,
        startY: 350,
        endX: 280,
        endY: 280,
      },
    },
    correct_sequence: ["car_A", "car_B"],
    rule_explanation:
      "Vehicles entering a roundabout must always yield the right-of-way to drivers who are already inside the circulating ring.",
    crash_fail_text:
      "CRASH IN THE CIRCLE! Car B failed to yield before entry. Drivers entering a roundabout must wait for a safe gap in the rotating traffic before merging.",
    background_type: "roundabout",
  },
  {
    scenario_id: "ROW_04",
    title: "The Pedestrian Premium",
    intersection_type: "T-Junction Green Light",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "South",
        action: "Turning Right",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 250,
        startY: 350,
        endX: 350,
        endY: 200,
      },
      pedestrian: {
        id: "pedestrian",
        label: "PEDESTRIAN",
        position: "East Crosswalk",
        action: "Walking across North-South path",
        emoji: "🚶",
        color: "#95E1D3",
        startX: 350,
        startY: 150,
        endX: 350,
        endY: 250,
      },
    },
    correct_sequence: ["pedestrian", "car_A"],
    rule_explanation:
      "Pedestrians legally walking in marked or unmarked crosswalks always maintain absolute statutory priority over turning motorized vehicles, regardless of green signal conditions.",
    crash_fail_text:
      "GAME OVER! Pedestrians always have the right-of-way in crosswalks. Turning vehicles must wait for the walking corridor to be fully cleared of foot traffic before crossing the white line.",
    background_type: "tjunction",
  },
  {
    scenario_id: "ROW_05",
    title: "The Flashing Siren Shield",
    intersection_type: "Standard 4-Way (Green Signal)",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "West",
        action: "Going Straight",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 50,
        startY: 200,
        endX: 450,
        endY: 200,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "South",
        action: "Going Straight",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 250,
        startY: 350,
        endX: 250,
        endY: 50,
      },
      emergency_vehicle: {
        id: "emergency_vehicle",
        label: "AMBULANCE",
        position: "East",
        action: "Responding with active lights/sirens",
        emoji: "🚑",
        color: "#FF1744",
        startX: 450,
        startY: 200,
        endX: 50,
        endY: 200,
      },
    },
    correct_sequence: ["emergency_vehicle", "car_A", "car_B"],
    rule_explanation:
      "Emergency vehicles running red lights with active audio sirens and flashing strobe lights override every single standard traffic control device and signal grid in the state handbook.",
    crash_fail_text:
      "CITATION ISSUED! Failure to yield to an active emergency responder. You must immediately pull over to the right curb line and halt until all emergency vehicles pass completely.",
    background_type: "4way",
  },
  {
    scenario_id: "ROW_06",
    title: "The Highway Merge Pinch",
    intersection_type: "Freeway On-Ramp Merge Lane",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "Right Lane of Freeway",
        action: "Maintaining highway speed",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 50,
        startY: 150,
        endX: 450,
        endY: 150,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "Acceleration Lane",
        action: "Merging onto Freeway",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 50,
        startY: 250,
        endX: 300,
        endY: 150,
      },
    },
    correct_sequence: ["car_A", "car_B"],
    rule_explanation:
      "Drivers on an acceleration ramp or entrance lane must yield to traffic already traveling on the main lanes of the highway. It is the merging vehicle's job to match speed and find a gap safely.",
    crash_fail_text:
      "SIDE-SWIPE! Car B forced its way into the lane. The handbook states that traffic already established on the highway has the right-of-way over vehicles entering from an on-ramp.",
    background_type: "highway",
  },
  {
    scenario_id: "ROW_07",
    title: "The Unpaved Transition",
    intersection_type: "Dirt Road meeting Paved Highway",
    setup: {
      car_A: {
        id: "car_A",
        label: "CAR A",
        position: "Unpaved/Dirt Side Road",
        action: "Turning Left",
        emoji: "🚗",
        color: "#4ECDC4",
        startX: 50,
        startY: 250,
        endX: 250,
        endY: 150,
      },
      car_B: {
        id: "car_B",
        label: "CAR B",
        position: "Paved Main Highway",
        action: "Going Straight",
        emoji: "🚗",
        color: "#FF6B6B",
        startX: 50,
        startY: 150,
        endX: 450,
        endY: 150,
      },
    },
    correct_sequence: ["car_B", "car_A"],
    rule_explanation:
      "When an unpaved or dirt road intersects with a paved road, the driver on the unpaved road must yield the right-of-way to all vehicles traveling on the paved road, even if no sign is present.",
    crash_fail_text:
      "CRASH! Car A pulled out too early. Drivers transitioning from unpaved, private, or alleyways must completely yield to traffic established on public paved roadways.",
    background_type: "tjunction",
  },
];

export default scenarios;
