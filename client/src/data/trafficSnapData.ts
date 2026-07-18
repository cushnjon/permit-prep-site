export interface TrafficSign {
  id: string;
  name: string;
  name_es?: string;
  shape: "octagon" | "triangle" | "circle" | "rectangle" | "diamond" | "pentagon";
  signImage: string;
  shapeImage: string;
  description: string;
  description_es?: string;
  realWorldApplication: string;
  realWorldApplication_es?: string;
  zone: "Regulatory" | "Warning" | "Informational";
}

export interface TrafficSnapZone {
  zone: "Regulatory" | "Warning" | "Informational";
  description: string;
  description_es?: string;
  signs: TrafficSign[];
}

// Shape image URLs
const SHAPES = {
  octagon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-octagon-U9PrJCNFoibbkQqZg2oa2X.webp",
  triangle: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-triangle-SjghW7TNYCG4naD7niDsQr.webp",
  diamond: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-jehWDni3W5fzxkZTJnGXLJ.webp",
  rectangle: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-2VBbn6FqmTizSKgLXutRhm.webp",
  pentagon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-pentagon-jSAC3mcThfGtu4KxMgBPJG.webp",
  circle: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-2VBbn6FqmTizSKgLXutRhm.webp",
};

export const trafficSnapData: TrafficSnapZone[] = [
  {
    zone: "Regulatory",
    description: "Signs that communicate traffic laws and regulations drivers must obey.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        signs: [
      {
        id: "TS_REG_01",
        name: "Stop Sign",
        name_es: "Señal de Alto",
        shape: "octagon",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-stop-PsgX3CYxEHYpSNd5xPaFeN.webp",
        shapeImage: SHAPES.octagon,
        description: "Come to a complete stop and yield to all other traffic before proceeding.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used at intersections to control traffic flow and prevent collisions. Drivers must stop completely, check for oncoming traffic, and only proceed when safe.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_02",
        name: "Yield Sign",
        name_es: "Señal de Ceda el Paso",
        shape: "triangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-yield-4fxTvVctYSNdEWWYQhmFzC.webp",
        shapeImage: SHAPES.triangle,
        description: "Slow down and be prepared to stop. Yield to pedestrians and other vehicles with the right-of-way.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed at intersections, roundabouts, and merge points. Drivers must reduce speed and give right-of-way to other traffic before proceeding.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_03",
        name: "Speed Limit Sign",
        name_es: "Señal de Límite de Velocidad",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-speed-limit-LGxV35VJWzABESqhk2qpiC.webp",
        shapeImage: SHAPES.rectangle,
        description: "The maximum legal speed for the road. Drivers must not exceed this speed limit.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Posted on all roads to establish safe driving speeds based on road conditions, traffic patterns, and local regulations. Exceeding the limit can result in fines and accidents.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_04",
        name: "Do Not Enter Sign",
        name_es: "Señal de No Entrar",
        shape: "circle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-do-not-enter-Mv8yUJebxMAfrdR6uZkvKS.webp",
        shapeImage: SHAPES.circle,
        description: "Do not enter this road or area. Turning around is required.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used on one-way streets, divided highways, and restricted areas. Entering against this sign is illegal and dangerous, often resulting in head-on collisions.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_05",
        name: "One Way Sign",
        name_es: "Señal de Sentido Único",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-one-way-6xBv3JDYsCFVHAhRRqqPMk.webp",
        shapeImage: SHAPES.rectangle,
        description: "Traffic on this road flows in only one direction, indicated by the arrow.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed on one-way streets in urban areas and highways. Drivers must follow the direction indicated or face traffic violations and potential accidents.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_06",
        name: "No Parking Sign",
        name_es: "Señal de No Estacionar",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-no-parking-G4ewQa6jYcTqhXgdEA9yz7.webp",
        shapeImage: SHAPES.rectangle,
        description: "Parking is not permitted in this area at any time.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used in high-traffic areas, fire zones, loading zones, and near hydrants. Violating this sign results in parking tickets and potential towing of the vehicle.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Regulatory"
      }
    ]
  },
  {
    zone: "Warning",
    description: "Signs that alert drivers to potential hazards and road conditions ahead.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        signs: [
      {
        id: "TS_WARN_01",
        name: "Pedestrian Crossing Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-pedestrian-7rC9uP5sEJvTCppctSkaWi.webp",
        shapeImage: SHAPES.diamond,
        description: "Pedestrians frequently cross this road. Slow down and be prepared to stop.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed near schools, parks, shopping areas, and residential zones. Drivers must be alert and ready to yield to pedestrians crossing the street.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_02",
        name: "School Zone Sign",
        shape: "pentagon",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-school-zone-HyCgn49FZpVM4MNzQBvGND.webp",
        shapeImage: SHAPES.pentagon,
        description: "You are entering a school zone. Reduce speed and watch for children.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Posted near schools during school hours. Speed limits are reduced, and drivers must be extra vigilant for children crossing streets or playing nearby.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_03",
        name: "Curve Ahead Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-curve-ahead-aTb3SDtXfpE3nDUDoPGcRr.webp",
        shapeImage: SHAPES.diamond,
        description: "The road curves ahead. Reduce speed and stay in your lane.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed before sharp curves on highways and mountain roads. Drivers must slow down to maintain control and prevent skidding or rollovers.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_04",
        name: "Slippery Road Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-slippery-road-S8sBeLCDBsdwWvTFWdts3G.webp",
        shapeImage: SHAPES.diamond,
        description: "The road surface is slippery due to ice, rain, or loose gravel. Reduce speed and increase following distance.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Posted in areas prone to wet conditions, ice, or loose surfaces. Drivers must reduce speed and be prepared for reduced traction and longer stopping distances.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_05",
        name: "Merge Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-merge-6s7uALMTQxLPkx7mQXHPNd.webp",
        shapeImage: SHAPES.diamond,
        description: "Two lanes of traffic are merging into one. Be prepared to adjust your position and speed.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used on highways where lanes merge or exit ramps join the main road. Drivers must be alert and cooperate with merging traffic to prevent congestion and accidents.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_06",
        name: "Deer Crossing Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-deer-crossing-QKy7V2niBWdskhEsLjrgKH.webp",
        shapeImage: SHAPES.diamond,
        description: "Wildlife frequently crosses this road. Reduce speed and watch for animals.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed in rural and forested areas where deer and other wildlife are common. Collisions with large animals can cause serious injury or death.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Warning"
      }
    ]
  },
  {
    zone: "Informational",
    description: "Signs that provide helpful information and directions to drivers.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        signs: [
      {
        id: "TS_INFO_01",
        name: "Exit Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-exit-Ym5oumL3TS2FZJPRMd7kNA.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates the next highway exit. Exit numbers help with navigation and emergency services.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Posted on highways to guide drivers to exits. Exit numbers correspond to mile markers, helping drivers and emergency responders locate specific locations quickly.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_02",
        name: "Hospital Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-hospital-6joxwy5HHXzm9ofqhnhVkN.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates the direction to the nearest hospital or medical facility.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used in urban and rural areas to direct drivers to emergency medical services. Critical for emergency situations and navigation to healthcare facilities.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_03",
        name: "Rest Area Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-rest-area-ZSP3BAjPVPBBWuV7H2NWUN.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates the location of a rest area with facilities for drivers to take breaks.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Placed on long highways to encourage drivers to rest and avoid fatigue-related accidents. Rest areas provide bathrooms, parking, and sometimes food services.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_04",
        name: "Gas Station Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-gas-station-Uo2BUf6E3spJEgN6WHUpMX.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates the location of a nearby gas station or fuel service.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Helps drivers locate fuel services on highways and in unfamiliar areas. Essential for long-distance travel planning and fuel management.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_05",
        name: "Handicap Accessible Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-handicap-BBsAkUKWaLaaqghGznww3A.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates accessible facilities and parking for people with disabilities.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Used to mark accessible parking spaces, restrooms, and facilities. Reserved for people with disabilities and must not be obstructed.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_06",
        name: "Lodging Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/sign-lodging-fv4PgE7cHf7erqBYKeevgf.webp",
        shapeImage: SHAPES.rectangle,
        description: "Indicates the location of nearby hotels, motels, and lodging facilities.",
        description_es: "Alojamiento disponible. Los conductores pueden salir para encontrar un hotel.",
        realWorldApplication: "Helps travelers find accommodation on highways and in unfamiliar areas. Essential for long-distance travel planning and rest stops.",
        realWorldApplication_es: "Indica la disponibilidad de hoteles y moteles cercanos. Los conductores pueden salir de la carretera para encontrar un lugar para dormir.",
        zone: "Informational"
      }
    ]
  }
];
