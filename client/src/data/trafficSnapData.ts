export interface TrafficSign {
  id: string;
  name: string;
  shape: "octagon" | "triangle" | "circle" | "rectangle" | "diamond" | "pentagon";
  signImage: string;
  shapeImage: string;
  description: string;
  realWorldApplication: string;
  zone: "Regulatory" | "Warning" | "Informational";
}

export interface TrafficSnapZone {
  zone: "Regulatory" | "Warning" | "Informational";
  description: string;
  signs: TrafficSign[];
}

export const trafficSnapData: TrafficSnapZone[] = [
  {
    zone: "Regulatory",
    description: "Signs that communicate traffic laws and regulations drivers must obey.",
    signs: [
      {
        id: "TS_REG_01",
        name: "Stop Sign",
        shape: "octagon",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-stop-sign-Kx9mN2pQrS3tUvWxYzAbCd.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-octagon-EfGhIjKlMnOpQrStUvWxYz.webp",
        description: "Come to a complete stop and yield to all other traffic before proceeding.",
        realWorldApplication: "Used at intersections to control traffic flow and prevent collisions. Drivers must stop completely, check for oncoming traffic, and only proceed when safe.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_02",
        name: "Yield Sign",
        shape: "triangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-yield-sign-AbCdEfGhIjKlMnOpQrStUv.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-triangle-WxYzAbCdEfGhIjKlMnOpQr.webp",
        description: "Slow down and be prepared to stop. Yield to pedestrians and other vehicles with the right-of-way.",
        realWorldApplication: "Placed at intersections, roundabouts, and merge points. Drivers must reduce speed and give right-of-way to other traffic before proceeding.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_03",
        name: "Speed Limit Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-speed-limit-StUvWxYzAbCdEfGhIjKlMn.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-OpQrStUvWxYzAbCdEfGhIj.webp",
        description: "The maximum legal speed for the road. Drivers must not exceed this speed limit.",
        realWorldApplication: "Posted on all roads to establish safe driving speeds based on road conditions, traffic patterns, and local regulations. Exceeding the limit can result in fines and accidents.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_04",
        name: "Do Not Enter Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-do-not-enter-KlMnOpQrStUvWxYzAbCdEf.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-GhIjKlMnOpQrStUvWxYzAb.webp",
        description: "Do not enter this road or area. Turning around is required.",
        realWorldApplication: "Used on one-way streets, divided highways, and restricted areas. Entering against this sign is illegal and dangerous, often resulting in head-on collisions.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_05",
        name: "One Way Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-one-way-CdEfGhIjKlMnOpQrStUvWx.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-YzAbCdEfGhIjKlMnOpQrSt.webp",
        description: "Traffic on this road flows in only one direction, indicated by the arrow.",
        realWorldApplication: "Placed on one-way streets in urban areas and highways. Drivers must follow the direction indicated or face traffic violations and potential accidents.",
        zone: "Regulatory"
      },
      {
        id: "TS_REG_06",
        name: "No Parking Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-no-parking-UvWxYzAbCdEfGhIjKlMnOp.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-QrStUvWxYzAbCdEfGhIjKl.webp",
        description: "Parking is not permitted in this area at any time.",
        realWorldApplication: "Used in high-traffic areas, fire zones, loading zones, and near hydrants. Violating this sign results in parking tickets and potential towing of the vehicle.",
        zone: "Regulatory"
      }
    ]
  },
  {
    zone: "Warning",
    description: "Signs that alert drivers to potential hazards and road conditions ahead.",
    signs: [
      {
        id: "TS_WARN_01",
        name: "Pedestrian Crossing Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-pedestrian-MnOpQrStUvWxYzAbCdEfGh.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-IjKlMnOpQrStUvWxYzAbCd.webp",
        description: "Pedestrians frequently cross this road. Slow down and be prepared to stop.",
        realWorldApplication: "Placed near schools, parks, shopping areas, and residential zones. Drivers must be alert and ready to yield to pedestrians crossing the street.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_02",
        name: "School Zone Sign",
        shape: "pentagon",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-school-zone-EfGhIjKlMnOpQrStUvWxYz.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-pentagon-AbCdEfGhIjKlMnOpQrStUv.webp",
        description: "You are entering a school zone. Reduce speed and watch for children.",
        realWorldApplication: "Posted near schools during school hours. Speed limits are reduced, and drivers must be extra vigilant for children crossing streets or playing nearby.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_03",
        name: "Curve Ahead Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-curve-ahead-WxYzAbCdEfGhIjKlMnOpQr.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-StUvWxYzAbCdEfGhIjKlMn.webp",
        description: "The road curves ahead. Reduce speed and stay in your lane.",
        realWorldApplication: "Placed before sharp curves on highways and mountain roads. Drivers must slow down to maintain control and prevent skidding or rollovers.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_04",
        name: "Slippery Road Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-slippery-road-OpQrStUvWxYzAbCdEfGhIj.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-KlMnOpQrStUvWxYzAbCdEf.webp",
        description: "The road surface is slippery due to ice, rain, or loose gravel. Reduce speed and increase following distance.",
        realWorldApplication: "Posted in areas prone to wet conditions, ice, or loose surfaces. Drivers must reduce speed and be prepared for reduced traction and longer stopping distances.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_05",
        name: "Merge Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-merge-GhIjKlMnOpQrStUvWxYzAb.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-CdEfGhIjKlMnOpQrStUvWx.webp",
        description: "Two lanes of traffic are merging into one. Be prepared to adjust your position and speed.",
        realWorldApplication: "Used on highways where lanes merge or exit ramps join the main road. Drivers must be alert and cooperate with merging traffic to prevent congestion and accidents.",
        zone: "Warning"
      },
      {
        id: "TS_WARN_06",
        name: "Deer Crossing Sign",
        shape: "diamond",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-deer-crossing-YzAbCdEfGhIjKlMnOpQrSt.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-diamond-UvWxYzAbCdEfGhIjKlMnOp.webp",
        description: "Wildlife frequently crosses this road. Reduce speed and watch for animals.",
        realWorldApplication: "Placed in rural and forested areas where deer and other wildlife are common. Collisions with large animals can cause serious injury or death.",
        zone: "Warning"
      }
    ]
  },
  {
    zone: "Informational",
    description: "Signs that provide helpful information and directions to drivers.",
    signs: [
      {
        id: "TS_INFO_01",
        name: "Exit Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-exit-QrStUvWxYzAbCdEfGhIjKl.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-MnOpQrStUvWxYzAbCdEfGh.webp",
        description: "Indicates the next highway exit. Exit numbers help with navigation and emergency services.",
        realWorldApplication: "Posted on highways to guide drivers to exits. Exit numbers correspond to mile markers, helping drivers and emergency responders locate specific locations quickly.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_02",
        name: "Hospital Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-hospital-IjKlMnOpQrStUvWxYzAbCd.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-EfGhIjKlMnOpQrStUvWxYz.webp",
        description: "Indicates the direction to the nearest hospital or medical facility.",
        realWorldApplication: "Used in urban and rural areas to direct drivers to emergency medical services. Critical for emergency situations and navigation to healthcare facilities.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_03",
        name: "Rest Area Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-rest-area-AbCdEfGhIjKlMnOpQrStUv.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-WxYzAbCdEfGhIjKlMnOpQr.webp",
        description: "Indicates the location of a rest area with facilities for drivers to take breaks.",
        realWorldApplication: "Placed on long highways to encourage drivers to rest and avoid fatigue-related accidents. Rest areas provide bathrooms, parking, and sometimes food services.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_04",
        name: "Gas Station Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-gas-station-StUvWxYzAbCdEfGhIjKlMn.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-OpQrStUvWxYzAbCdEfGhIj.webp",
        description: "Indicates the location of a nearby gas station or fuel service.",
        realWorldApplication: "Helps drivers locate fuel services on highways and in unfamiliar areas. Essential for long-distance travel planning and fuel management.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_05",
        name: "Handicap Accessible Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-handicap-KlMnOpQrStUvWxYzAbCdEf.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-GhIjKlMnOpQrStUvWxYzAb.webp",
        description: "Indicates accessible facilities and parking for people with disabilities.",
        realWorldApplication: "Used to mark accessible parking spaces, restrooms, and facilities. Reserved for people with disabilities and must not be obstructed.",
        zone: "Informational"
      },
      {
        id: "TS_INFO_06",
        name: "Lodging Sign",
        shape: "rectangle",
        signImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/traffic-lodging-CdEfGhIjKlMnOpQrStUvWx.webp",
        shapeImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/shape-rectangle-YzAbCdEfGhIjKlMnOpQrSt.webp",
        description: "Indicates the location of nearby hotels, motels, and lodging facilities.",
        realWorldApplication: "Helps travelers find accommodation on highways and in unfamiliar areas. Essential for long-distance travel planning and rest stops.",
        zone: "Informational"
      }
    ]
  }
];
