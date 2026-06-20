// Color Clash: Signage Matching Game
export interface SignageCard {
  id: string;
  image_description: string;
  sign_name: string;
  color: string;
  shape: string;
}

export interface ColorClashRound {
  id: string;
  title: string;
  description: string;
  cards: SignageCard[];
  correct_matches: Record<string, string>; // card_id -> category_id
}

export const colorClashRounds: ColorClashRound[] = [
  {
    id: "round_1",
    title: "Regulatory vs Warning Signs",
    description: "Match traffic signs to their correct category based on color and shape",
    cards: [
      {
        id: "card_1",
        image_description: "Red octagon with white border and text STOP",
        sign_name: "Stop Sign",
        color: "red",
        shape: "octagon"
      },
      {
        id: "card_2",
        image_description: "Yellow diamond with black border and curved arrow",
        sign_name: "Curve Warning",
        color: "yellow",
        shape: "diamond"
      },
      {
        id: "card_3",
        image_description: "White rectangle with black text 25 MPH",
        sign_name: "Speed Limit",
        color: "white",
        shape: "rectangle"
      },
      {
        id: "card_4",
        image_description: "Yellow diamond with pedestrian crossing symbol",
        sign_name: "Pedestrian Crossing",
        color: "yellow",
        shape: "diamond"
      },
      {
        id: "card_5",
        image_description: "Red and white triangular yield sign",
        sign_name: "Yield Sign",
        color: "red",
        shape: "triangle"
      },
      {
        id: "card_6",
        image_description: "Green rectangle with white arrow and text",
        sign_name: "Direction Sign",
        color: "green",
        shape: "rectangle"
      }
    ],
    correct_matches: {
      "card_1": "regulatory",
      "card_2": "warning",
      "card_3": "regulatory",
      "card_4": "warning",
      "card_5": "regulatory",
      "card_6": "guide"
    }
  },
  {
    id: "round_2",
    title: "Sign Colors and Meanings",
    description: "Match signs to their color categories",
    cards: [
      {
        id: "card_7",
        image_description: "Blue rectangle with white symbol for hospital",
        sign_name: "Hospital Sign",
        color: "blue",
        shape: "rectangle"
      },
      {
        id: "card_8",
        image_description: "Brown rectangle with white text for scenic area",
        sign_name: "Scenic Area",
        color: "brown",
        shape: "rectangle"
      },
      {
        id: "card_9",
        image_description: "Orange diamond with construction symbol",
        sign_name: "Construction Zone",
        color: "orange",
        shape: "diamond"
      },
      {
        id: "card_10",
        image_description: "Red octagon STOP sign",
        sign_name: "Stop",
        color: "red",
        shape: "octagon"
      },
      {
        id: "card_11",
        image_description: "Green rectangle with white arrow",
        sign_name: "Exit Sign",
        color: "green",
        shape: "rectangle"
      },
      {
        id: "card_12",
        image_description: "Yellow diamond with animal crossing symbol",
        sign_name: "Deer Crossing",
        color: "yellow",
        shape: "diamond"
      }
    ],
    correct_matches: {
      "card_7": "blue",
      "card_8": "brown",
      "card_9": "orange",
      "card_10": "red",
      "card_11": "green",
      "card_12": "yellow"
    }
  }
];
