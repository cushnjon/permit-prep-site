import { Zone } from "./gameData";

export const certificationQuestions: Zone = {
  zone: "Certification Test / Examen de Certificación",
  speed_tier: "Variable",
  background_tip: "This comprehensive certification test covers all essential safety topics. Pass with 70% or higher to receive your certificate.",
  questions: [
    {
      id: "Q_CERT_001",
      prompt: "Where is the greatest potential for a collision between a micromobility vehicle (e- bike/scooter) and a car?",
      a: "On long straightaways",
      b: "At intersections",
      c: "In residential driveways",
      d: "On dedicated bike paths",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_002",
      prompt: "When it first begins to rain, which of the following becomes dangerously slippery?",
      a: "Gravel shoulders",
      b: "Painted lane lines, crosswalks, and metal manhole covers",
      c: "Asphalt",
      d: "Concrete",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_003",
      prompt: "To maximize your visibility to other drivers, what is the best practice?",
      a: "Ride exclusively in the blind spots of larger vehicles.",
      b: "Wear dark, inconspicuous clothing.",
      c: "Wear bright/reflective clothing and keep front and rear lights on, even during the day.",
      d: "Constantly ring your bell while riding.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_004",
      prompt: "If you are forced to ride over unavoidable debris or a pothole, what should you do?",
      a: "Lock your elbows and knees and grip the handlebars as tightly as possible.",
      b: "Keep a straight path, rise slightly off the seat, and let your knees and legs absorb the shock.",
      c: "Swerve sharply at the last possible second.",
      d: "Apply the front brake heavily while riding over the object.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_005",
      prompt: "What does the term 'overdriving your headlights' mean when riding at night?",
      a: "Using high beams when approaching oncoming traffic.",
      b: "Riding so fast that your stopping distance exceeds the distance illuminated by your headlight.",
      c: "Leaving your lights on during the day.",
      d: "Draining the battery by keeping the lights on their highest setting.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_006",
      prompt: "When approaching a curve on your e-bike or e-scooter, what sequence of actions should you follow?",
      a: "Speed up, look outside the curve, lean away.",
      b: "Brake during the curve, look straight ahead, keep the bike upright.",
      c: "Slow down before the turn, look through the turn, press/lean in the direction of the turn, and roll the throttle on slightly.",
      d: "Pull the clutch and coast through the curve.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_007",
      prompt: "Pedestrians:",
      a: "Only have the right of way in marked crosswalks.",
      b: "Must yield to e-bikes because e-bikes are faster.",
      c: "Always have the right of way, and you must yield to them even if they cross illegally.",
      d: "Should only be warned with a horn when they are blocking the road.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_008",
      prompt: "The primary purpose of your horn or bell is to:",
      a: "Express anger at other road users.",
      b: "Alert others of your presence when you suspect they do not see you.",
      c: "Demand right of way at a four-way stop.",
      d: "Signal pedestrians to run faster.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_009",
      prompt: "During a rainstorm, when is the road typically the most slick and dangerous?",
      a: "After it has been raining for a few hours.",
      b: "Only when the rain stops.",
      c: "During the first 10 to 15 minutes of rainfall.",
      d: "During lightning strikes.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_010",
      prompt: "When stopped at a red light in traffic, you should:",
      a: "Check your phone quickly.",
      b: "Keep the vehicle in gear/powered on, keep an eye on your mirrors, and be ready to move if a car behind you fails to stop.",
      c: "Put both feet on the pedals and balance.",
      d: "Turn around completely to talk to the car behind you.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_011",
      prompt: "When exiting a driveway, alley, or sidewalk into moving street traffic, you must:",
      a: "Merge directly into the center lane.",
      b: "Maintain speed and expect cars to slow down for you.",
      c: "Stop, yield to all pedestrians on the sidewalk, and yield to all traffic on the street before entering.",
      d: "Only look left because that is where traffic comes from.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_012",
      prompt: "When approaching a 'blind' intersection with limited visibility due to parked cars, buildings, or hedges, you should:",
      a: "Honk your horn and ride through at full speed.",
      b: "Change your lane position to see as much of the cross street as possible, and slow down to be prepared to stop.",
      c: "Close your eyes and hope for the best.",
      d: "Ride on the sidewalk to avoid the intersection entirely.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_013",
      prompt: "At higher speeds, a sudden wobble or oscillation in the front steering can occur. How do you recover?",
      a: "Slam on the front brake.",
      b: "Accelerate aggressively.",
      c: "Grip the handlebars lightly, roll off the throttle, and shift your weight forward and down.",
      d: "Wrench the handlebars left and right to correct it.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_014",
      prompt: "Before every ride, a rider should perform a quick pre-ride inspection (often called T- CLOCS for motorcycles). For e-bikes/scooters, this primarily involves checking:",
      a: "Tire pressure, brakes, lights, and battery charge.",
      b: "The color of the vehicle and mirror polish.",
      c: "Just the battery charge.",
      d: "The suspension fluid levels.",
      correct_answer: "a" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_015",
      prompt: "When stopped behind a car at an intersection, where should you position yourself?",
      a: "In the center of the lane directly behind the bumper.",
      b: "On the extreme right edge of the road.",
      c: "In the left or right third of the lane, visible in the driver's side mirrors.",
      d: "On the sidewalk.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_016",
      prompt: "If an oncoming car is waiting to turn left at an intersection as you approach, you should:",
      a: "Assume they see you and maintain speed.",
      b: "Cover your brakes, slow down, and be prepared to take evasive action.",
      c: "Speed up to pass them quickly.",
      d: "Turn off your headlight so it doesn't blind them.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_017",
      prompt: "When riding at night, what should you use as a visual guide if oncoming headlights blind you?",
      a: "The centerline of the road.",
      b: "The oncoming car's headlights.",
      c: "The right edge of the road or the right lane line.",
      d: "Your dashboard display.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_018",
      prompt: "When executing a tight U-turn on an e-bike, applying a slight amount of rear brake can help by:",
      a: "Stopping the bike mid-turn.",
      b: "Stabilizing the chassis and controlling the speed smoothly.",
      c: "Initiating a skid to turn faster.",
      d: "Disengaging the motor completely.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_019",
      prompt: "When riding over metal bridge gratings, the vehicle may weave or wander slightly. You should:",
      a: "Slam on the brakes.",
      b: "Grip the handlebars tightly and fight the weave.",
      c: "Relax your grip, maintain a steady speed, and ride straight across.",
      d: "Zig-zag across the grating.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_020",
      prompt: "What visual clues indicate a parked car might suddenly pull out into your path?",
      a: "The car is completely off and dark.",
      b: "Dust is settling around the tires.",
      c: "Exhaust smoke, illuminated taillights/brake lights, or someone sitting in the driver's seat.",
      d: "The doors are locked.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_021",
      prompt: "If you are approaching an intersection and the traffic light turns yellow, you should:",
      a: "Speed up drastically to beat the red light.",
      b: "Stop immediately regardless of how close you are.",
      c: "Prepare to stop if you can do so safely, or proceed with caution if you are already too close to stop smoothly.",
      d: "Close your eyes.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_022",
      prompt: "What is the proper way to hold the handlebars while riding?",
      a: "With a 'death grip' squeezing as hard as possible.",
      b: "With straight, locked elbows.",
      c: "With a firm, relaxed grip and slightly bent elbows.",
      d: "With only one hand at all times.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_023",
      prompt: "When stopping at a traffic light, a group riding in a staggered formation should:",
      a: "Form a single file line.",
      b: "Stop side-by-side in pairs (two abreast) to take up less space and stay compact.",
      c: "Stop in a circle.",
      d: "Spread out into multiple lanes.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_024",
      prompt: "At a four-way stop, if you (on an e-bike) and a car arrive at adjacent stop signs simultaneously, who yields?",
      a: "The e-bike always yields because it is smaller.",
      b: "The car always yields.",
      c: "The vehicle on the left must yield to the vehicle on the right.",
      d: "The vehicle going the fastest gets to go.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_025",
      prompt: "If you approach an intersection and see a driver waiting to pull out who is looking directly at you, you should:",
      a: "Assume they see you and will wait.",
      b: "Honk and speed up.",
      c: "Assume they might not actually 'see' you (inattentional blindness), cover your brakes, and be ready to evade.",
      d: "Wave at them to pull out.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_026",
      prompt: "When riding an e-scooter in a bike lane past a long line of stopped cars in heavy traffic, what is a major 'hidden' hazard uniquely dangerous to you?",
      a: "The cars might run out of gas.",
      b: "A frustrated driver or passenger might suddenly open a door across the bike lane, or a pedestrian might dart out between the bumpers.",
      c: "Your battery will drain faster.",
      d: "The road surface will melt.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_027",
      prompt: "Following directly behind a large commercial truck or bus is especially dangerous for micromobility riders primarily because:",
      a: "They emit toxic fumes.",
      b: "Your low profile makes you entirely invisible to the truck driver's mirrors, and the truck completely blocks your forward line of sight.",
      c: "They are too loud.",
      d: "They attract lightning.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_028",
      prompt: "When coming to a complete stop behind a car at an intersection on your e-bike or e- scooter, you should leave at least one vehicle length of space and position yourself to the side. Why?",
      a: "To give yourself room to stretch.",
      b: "To avoid smelling their exhaust.",
      c: "To provide a physical escape route if the distracted driver behind you fails to stop.",
      d: "To make sure you don't trigger the traffic sensor.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_029",
      prompt: "When riding an e-bike through unavoidable standing water, what two hazards must you manage?",
      a: "Getting your shoes wet and annoying pedestrians.",
      b: "Hydroplaning your narrow tires, and protecting low-mounted electrical connections/motors from deep submersion damage.",
      c: "Braking too fast and popping a wheelie.",
      d: "The water turning to ice instantly.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_030",
      prompt: "If your e-bike or e-scooter battery drops to a critically low voltage while riding in heavy traffic, you should prepare for:",
      a: "The bike to suddenly go faster to get you home.",
      b: "The controller to enter 'limp mode,' abruptly cutting motor power to protect the battery cells, which could leave you stranded without acceleration in an intersection.",
      c: "The horn to honk continuously.",
      d: "The brakes to lock up automatically.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_031",
      prompt: "The core defensive riding philosophy for any e-bike or e-scooter rider navigating traffic is to:",
      a: "Assume you have the right-of-way and force cars to yield to your eco-friendly vehicle.",
      b: "Ride as if you are completely invisible to all other drivers on the road.",
      c: "Only ride during daylight hours.",
      d: "Rely entirely on the vehicle's electronic safety features to prevent crashes.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_032",
      prompt: "Having the legal right-of-way at an intersection on your e-bike:",
      a: "Physically protects you from a collision with a car.",
      b: "Guarantees that other drivers will yield to you.",
      c: "Does not matter if another driver fails to yield; you must always cover your brakes and be prepared to give up your right-of-way to survive.",
      d: "Means you never need to look both ways.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_033",
      prompt: "When you need to make an emergency stop on an e-bike or e-scooter, you should:",
      a: "Only use the rear brake to prevent going over the handlebars.",
      b: "Only use the front brake because it has more stopping power.",
      c: "Apply both brakes smoothly and firmly at the same time.",
      d: "Drag your feet on the ground to slow down.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_034",
      prompt: "To anticipate hazards effectively, how far ahead should you scan your path of travel?",
      a: "2 to 3 seconds ahead (just beyond your front tire).",
      b: "5 to 7 seconds ahead.",
      c: "10 to 15 seconds ahead.",
      d: "You should only watch the vehicle directly in front of you.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_035",
      prompt: "If you must perform an evasive swerve to avoid an obstacle, what should you never do simultaneously?",
      a: "Look where you are swerving.",
      b: "Counter-steer to initiate the turn.",
      c: "Apply the brakes.",
      d: "Lean the vehicle.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_036",
      prompt: "If you must brake hard while leaning in a curve, what is the best technique?",
      a: "Lock both brakes immediately.",
      b: "If space permits, straighten the vehicle upright first, then brake firmly.",
      c: "Brake only with the rear brake.",
      d: "Lean further into the curve while applying full front brake.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_037",
      prompt: "When riding down a long, steep hill, how should you manage your speed?",
      a: "Ride the brakes constantly all the way down.",
      b: "Turn off the motor completely.",
      c: "Manage your speed using a lower gear/motor resistance, and apply brakes intermittently to avoid overheating.",
      d: "Swerve side to side to bleed off speed.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_038",
      prompt: "If you experience a front tire blowout or rapid deflation while riding, you should:",
      a: "Slam on the front brake immediately.",
      b: "Accelerate to keep the tire spinning.",
      c: "Hold the handlebars firmly, ease off the throttle, and avoid using the front brake as you slowly guide the vehicle to the side.",
      d: "Lean far backward to pop a wheelie.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_039",
      prompt: "How should you react if a dog runs out into your path?",
      a: "Kick at the dog to scare it away.",
      b: "Swerve sharply into the oncoming lane to avoid it.",
      c: "Slow down as it approaches, then accelerate past its point of interception.",
      d: "Slam on your brakes and come to a complete stop.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_040",
      prompt: "If a vehicle is tailgating you closely from behind, what is the safest proactive measure you can take?",
      a: "Brake check the driver.",
      b: "Increase your following distance to the vehicle in front of you.",
      c: "Turn around and yell at the driver.",
      d: "Speed up to whatever speed the tailgater wants to go.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_041",
      prompt: "When hit by a strong gust of crosswind from the left, how should you counter it?",
      a: "Lean left into the wind by pressing gently on the left handlebar.",
      b: "Lean right, away from the wind.",
      c: "Lock your elbows and stop breathing.",
      d: "Apply both brakes immediately.",
      correct_answer: "a" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_042",
      prompt: "You are riding on pavement and see that the road ahead transitions to loose gravel. You should:",
      a: "Accelerate to glide over the gravel quickly.",
      b: "Brake firmly as soon as the front tire hits the gravel.",
      c: "Slow down before reaching the gravel, keep your head up, and maintain a steady speed without sudden braking or steering inputs.",
      d: "Stand up and lean entirely over the front handlebars.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_043",
      prompt: "If the throttle on your e-bike or e-scooter gets stuck in the open (accelerating) position, what should you do first?",
      a: "Jump off the vehicle immediately.",
      b: "Apply the brakes while attempting to turn off the power/hit the kill switch.",
      c: "Try to downshift.",
      d: "Wave your hands to warn others.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_044",
      prompt: "If you inadvertently lock the front tire during a hard brake and it begins to skid, you should:",
      a: "Keep the brake locked until you stop.",
      b: "Immediately release the front brake to allow the tire to regain traction, then reapply it smoothly.",
      c: "Accelerate to power out of the skid.",
      d: "Stand up on the pegs/deck.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_045",
      prompt: "If you misjudge a curve and are going too fast, what is the best initial reaction?",
      a: "Slam on the rear brake to slide the back end around.",
      b: "Look through the turn and increase your lean angle.",
      c: "Panic and stare at the outside edge of the road.",
      d: "Stand up to increase wind resistance.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_046",
      prompt: "When making a quick swerve to avoid a hazard, you should:",
      a: "Brake hard while swerving.",
      b: "Keep your body upright and push the vehicle underneath you.",
      c: "Lean your body further than the vehicle.",
      d: "Close your eyes momentarily.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_047",
      prompt: "Riding with tires that are significantly under-inflated will cause:",
      a: "Better fuel/battery efficiency.",
      b: "A smoother ride with better handling.",
      c: "Sluggish handling, reduced stability, and a higher risk of tire failure.",
      d: "Increased top speed.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_048",
      prompt: "Carrying a passenger on an e-bike or e-scooter will:",
      a: "Decrease your stopping distance.",
      b: "Make the vehicle accelerate faster.",
      c: "Change the center of gravity, making the vehicle heavier to steer and requiring longer stopping distances.",
      d: "Have no effect on handling.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_049",
      prompt: "If someone is tailgating you, why is it safer to increase the distance between you and the car ahead?",
      a: "It allows you to brake more gradually, giving the tailgater more time to react.",
      b: "It punishes the tailgater.",
      c: "It makes you go faster.",
      d: "It hides you from the tailgater.",
      correct_answer: "a" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_050",
      prompt: "If a railroad crossing track intersects the road at a sharp diagonal angle, you should:",
      a: "Stay in your lane and cross it diagonally.",
      b: "Swerve sharply at the last second to cross at 90 degrees.",
      c: "Adjust your lane position well in advance to cross the tracks as close to a 90-degree angle as safely possible.",
      d: "Accelerate and jump the tracks.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_051",
      prompt: "If an animal, such as a deer, suddenly jumps into your path and a collision is unavoidable, what is the best immediate action?",
      a: "Swerve wildly into the oncoming lane.",
      b: "Brake firmly, then release the brakes just before impact to allow the suspension to absorb the hit.",
      c: "Accelerate to hit it harder.",
      d: "Lay the bike down.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_052",
      prompt: "When riding in a staggered formation, how should the group pass a slower vehicle on a two-lane road?",
      a: "The entire group swerves around the vehicle together.",
      b: "The leader passes, and the rest follow blindly.",
      c: "The leader passes first, followed by each rider independently assessing if it is safe to pass.",
      d: "The last rider passes first to clear the way.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_053",
      prompt: "Why is it dangerous to ride an e-bike or e-scooter with severely worn tires on a wet road?",
      a: "The motor will draw too much power.",
      b: "Worn tread grooves cannot channel water away, severely increasing the risk of hydroplaning.",
      c: "It makes the tires too loud.",
      d: "The brakes will become too sensitive.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_054",
      prompt: "When deciding whether to swerve or brake to avoid a sudden hazard, what is the most important factor?",
      a: "The color of the hazard.",
      b: "The speed of the wind.",
      c: "The amount of space available. If you lack the distance to stop, you must swerve.",
      d: "Whether your horn works.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_055",
      prompt: "If a large insect hits you in the face or gets into your helmet while riding, you should:",
      a: "Let go of the handlebars to swat it.",
      b: "Ignore it as long as safely possible, slow down smoothly, and pull over before dealing with it.",
      c: "Brake aggressively in the middle of the road.",
      d: "Shake your head violently.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_056",
      prompt: "If your front brake fails entirely while riding, you should:",
      a: "Immediately jump off.",
      b: "Rely exclusively on the rear brake, apply it smoothly to avoid locking up, and give yourself much more stopping distance.",
      c: "Try to put your feet down while riding at top speed.",
      d: "Downshift aggressively.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_057",
      prompt: "At speeds above 10-15 mph, pushing forward on the right handlebar will cause the vehicle to:",
      a: "Lean left and turn left.",
      b: "Lean right and turn right.",
      c: "Stop immediately.",
      d: "Go perfectly straight.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_058",
      prompt: "When is it most critical to check your mirrors in traffic?",
      a: "Before slowing down, stopping, or changing direction.",
      b: "When going in a straight line with no cars around.",
      c: "While mid-way through a sharp curve.",
      d: "When parked.",
      correct_answer: "a" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_059",
      prompt: "To check your brakes during a pre-ride inspection, you should:",
      a: "Disassemble the brake calipers.",
      b: "Roll the vehicle forward and firmly squeeze each brake independently to ensure they hold the vehicle securely.",
      c: "Ride at top speed and slam on the brakes.",
      d: "Look at the brake handles.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_060",
      prompt: "Compared to carrying cargo in a low-mounted rack, wearing a heavy backpack on a stand-up e-scooter will:",
      a: "Improve your balance.",
      b: "Make you more aerodynamic.",
      c: "Significantly raise your center of gravity, making the scooter feel top-heavy and drastically increasing the risk of pitching over the handlebars during hard braking.",
      d: "Prevent you from getting a flat tire.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_061",
      prompt: "If the rear tire housing your e-bike's heavy hub motor suddenly blows out while riding, what is the best way to maintain control?",
      a: "Slam on the front brake immediately.",
      b: "Hold the handlebars firmly, ease off the throttle, and do not apply the rear brake as you gently steer to a safe stop.",
      c: "Accelerate to lift the rear tire off the ground.",
      d: "Brake hard with the rear brake only.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_062",
      prompt: "If you realize you have entered a curve too fast on an e-bike, what specific hazard must you avoid when leaning heavily into the turn?",
      a: "Grabbing both brakes as hard as you can.",
      b: "A 'pedal strike,' where the inside pedal hits the pavement and levers the bike's tires off the road.",
      c: "Standing up on the pedals.",
      d: "Choking the throttle.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_063",
      prompt: "Due to the much smaller wheel size of e-scooters (often 8 to 10 inches), how should you alter your visual scanning compared to riding a full-sized bicycle or motorcycle?",
      a: "Only look at the sky.",
      b: "Scan closer to the front tire for small potholes, debris, and pavement cracks that would normally be harmless to larger wheels.",
      c: "Scan only your mirrors.",
      d: "Look only at the centerline.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_064",
      prompt: "Large steel plates are often placed over trenches in construction zones. Because e- scooters frequently use small, solid (airless) tires, you should:",
      a: "Brake aggressively while on the plate.",
      b: "Accelerate to get over them quickly.",
      c: "Keep the vehicle upright, maintain a steady speed, and avoid absolutely any braking, turning, or throttle inputs while the tires are on the steel.",
      d: "Lean heavily to one side.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_065",
      prompt: "Many modern e-bikes and e-scooters utilize electronic regenerative braking in addition to mechanical disc brakes. On a slippery or wet surface, you should:",
      a: "Grab the brakes suddenly and forcefully.",
      b: "Use only the front mechanical brake.",
      c: "Apply the brake levers progressively and gently to prevent the sudden torque of the electronic motor-brake from locking the wheel.",
      d: "Turn off the vehicle.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_066",
      prompt: "If an aggressive driver is tailgating you while you are riding your e- scooter in a shared traffic lane, the safest response is to:",
      a: "Brake check them to teach them a lesson.",
      b: "Speed up to outrun them.",
      c: "Pull over or change lanes to let them pass as soon as safely possible, completely avoiding confrontation.",
      d: "Make obscene gestures to show you aren't intimidated.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_067",
      prompt: "E-bikes are significantly heavier than traditional bicycles. On a long downhill descent, relying solely on your mechanical brakes increases the risk of:",
      a: "The battery dying.",
      b: "'Brake fade'-boiling the hydraulic fluid or glazing the brake pads due to extreme heat, resulting in a sudden, total loss of braking power.",
      c: "The pedals spinning backwards.",
      d: "The tires getting cold.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_068",
      prompt: "Why is it important to check tire pressure frequently on e-scooters equipped with pneumatic (air-filled) tires?",
      a: "Tires look cooler when fully inflated.",
      b: "Low pressure drastically increases the risk of a 'pinch flat' (where the inner tube gets crushed against the rim when hitting a bump) due to the extremely small wheel diameter.",
      c: "It prevents the battery from overheating.",
      d: "It makes the deck more comfortable.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_069",
      prompt: "When riding in a bike lane or on the right side of the road next to parked cars, where should you position yourself?",
      a: "As close to the parked cars as possible to stay out of traffic.",
      b: "Far enough to the left to avoid doors suddenly opened by drivers.",
      c: "Weaving in and out of empty parking spaces.",
      d: "On the sidewalk.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_070",
      prompt: "Before changing lanes or turning, what is the most reliable way to ensure a vehicle is not in your blind spot?",
      a: "Relying solely on your mirrors.",
      b: "Listening for the sound of an engine.",
      c: "Turning your head to physically look over your shoulder (head check).",
      d: "Honking your horn before moving.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_071",
      prompt: "When riding in a traffic lane on a roadway, why might the center of the lane be hazardous?",
      a: "It is illegal for e-bikes to ride in the center of the lane.",
      b: "Cars cannot see you when you are in the center.",
      c: "Oil and engine fluids from cars often accumulate in the center, causing slippery conditions.",
      d: "It creates a wind-tunnel effect from passing cars.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_072",
      prompt: "What is 'target fixation'?",
      a: "A safety feature that locks your steering in a straight line.",
      b: "The tendency to inadvertently steer toward whatever you are staring at, such as an obstacle you want to avoid.",
      c: "Maintaining a constant 15 mph speed.",
      d: "Scanning your mirrors every 5 seconds.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_073",
      prompt: "If your vehicle is not equipped with electronic turn signals, you must:",
      a: "Assume drivers know where you are going based on your lane position.",
      b: "Shout out your intended direction.",
      c: "Use standardized hand signals to communicate your intentions to other road users.",
      d: "Only turn right so signals aren't needed.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_074",
      prompt: "When riding in a group of micromobility users, what is the best formation to ensure safety and visibility?",
      a: "Riding side-by-side filling the entire lane.",
      b: "Single-file with no space between riders.",
      c: "A staggered formation, where the leader is on the left side of the lane, the second rider on the right side, maintaining 2 seconds of distance between each.",
      d: "A completely random cluster.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_075",
      prompt: "If riding in a group and you need to pass a slower vehicle, how should the group execute the pass?",
      a: "The entire group passes simultaneously.",
      b: "The leader passes first, and each subsequent rider passes one at a time when safe.",
      c: "The last rider passes first to block traffic.",
      d: "Pass on the right side on the shoulder.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_076",
      prompt: "In most jurisdictions, lane splitting (riding between lanes of moving traffic) is:",
      a: "Recommended for all e-bikes.",
      b: "Illegal and highly dangerous due to the unpredictability of car movements.",
      c: "The safest way to avoid traffic jams.",
      d: "Required for two-wheeled vehicles.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_077",
      prompt: "The best way to discourage cars from trying to squeeze past you in the same lane is to:",
      a: "Ride on the extreme right edge of the pavement.",
      b: "Ride in the center or left third of the lane to 'claim the lane'.",
      c: "Weave back and forth.",
      d: "Ride on the shoulder.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_078",
      prompt: "While mirrors are essential, they do not show:",
      a: "Vehicles directly behind you.",
      b: "The road surface behind you.",
      c: "Vehicles in your blind spots over your left or right shoulders.",
      d: "The sky.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_079",
      prompt: "What is the recommended strategy when pulling out of a blind alleyway where buildings block your view of cross traffic on the street?",
      a: "Accelerate quickly to clear the alleyway as fast as possible.",
      b: "Lean forward over the handlebars and inch forward slowly until you can see clearly past the building edges.",
      c: "Honk your horn continuously and ride out at normal speed.",
      d: "Dismount and run across the street.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_080",
      prompt: "When riding on a road that is heavily crowned (slopes downward from the center to the edges), you should:",
      a: "Lean against the slope to stay perfectly vertical.",
      b: "Ride in the gutter to stay out of the way.",
      c: "Adjust your lane position to the left or right third to avoid the highest point, while keeping the vehicle perpendicular to the road surface.",
      d: "Only ride on the very top center peak.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_081",
      prompt: "Why should you increase your following distance when riding at night?",
      a: "Because e-bikes lose battery power faster at night.",
      b: "Because you cannot see hazards as early, giving you less time to react.",
      c: "Because cars go slower at night.",
      d: "Because the air is colder.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_082",
      prompt: "When riding in the right lane past a highway on-ramp or merge lane, what is the best lane position?",
      a: "The far right third of the lane.",
      b: "The center or left third of the lane.",
      c: "The shoulder.",
      d: "The bike path.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_083",
      prompt: "When approaching the blind crest of a hill on an e-bike, your motor assistance might drop your speed compared to surrounding traffic. Where is the safest lane position?",
      a: "In the left third of the lane, close to the center line.",
      b: "In the center or right third of the lane.",
      c: "On the shoulder.",
      d: "Weaving back and forth to be seen.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_084",
      prompt: "The 'Left-Turn Trap' is particularly common and fatal for Class 3 (28 mph) e-bikes because:",
      a: "You are turning left and stall the motor.",
      b: "Oncoming drivers see a bicycle profile and subconsciously assume you are traveling at 10 mph, drastically misjudging your approach speed and turning directly across your path.",
      c: "You turn left onto a one-way street.",
      d: "You use your left turn signal for too long.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_085",
      prompt: "If you are forced to ride over train tracks, a speed bump, or a deep rut, how should you approach it?",
      a: "At a sharp diagonal angle.",
      b: "At a 90-degree (perpendicular) angle to the tracks.",
      c: "By braking hard right as you hit the obstacle.",
      d: "By leaning heavily to one side.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_086",
      prompt: "When a large truck passes you at high speed, what invisible hazard should you prepare for?",
      a: "Engine heat.",
      b: "A sudden vacuum and wind blast that could push or pull your vehicle.",
      c: "Radio interference with your e-bike display.",
      d: "Temporary deafness.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_087",
      prompt: "How does cold weather affect a rider's safety?",
      a: "It improves battery efficiency.",
      b: "It lowers tire pressure and can cause hypothermia/fatigue, drastically slowing reaction times.",
      c: "It provides better traction on asphalt.",
      d: "It has no effect as long as you wear a jacket.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_088",
      prompt: "Why is riding in shorts and a t-shirt dangerous, even at low speeds?",
      a: "It causes wind drag.",
      b: "It distracts other drivers.",
      c: "Even a minor low-speed fall will cause severe road rash without protective abrasion-resistant clothing.",
      d: "It violates traffic laws.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_089",
      prompt: "Why is shatter-resistant eye protection essential for e-bike/scooter riders even at moderate speeds?",
      a: "It prevents bugs, dust, and debris from blinding you.",
      b: "It looks professional.",
      c: "It makes the vehicle go faster by reducing drag.",
      d: "It keeps your head warm.",
      correct_answer: "a" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_090",
      prompt: "What is an 'edge trap' and why is it uniquely dangerous for an e- scooter?",
      a: "A type of speed trap used by police.",
      b: "A raised lip running parallel to your path, such as a trolley track or uneven pavement seam, which can easily swallow a small scooter tire and violently wrench the handlebars from your grip.",
      c: "A pothole in the middle of the road.",
      d: "A loose gravel patch.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_091",
      prompt: "When carrying cargo on a micromobility vehicle, where is the best place to secure the weight?",
      a: "High up in a backpack.",
      b: "Hanging off the handlebars.",
      c: "As low and as centered on the vehicle frame as possible.",
      d: "On the front fender.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_092",
      prompt: "During extremely low-speed maneuvers (like a U-turn in a narrow space), what visual technique prevents you from losing balance?",
      a: "Staring directly down at the front wheel.",
      b: "Closing one eye.",
      c: "Keeping your head up and looking through the turn to where you want to go.",
      d: "Looking at your speedometer.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_093",
      prompt: "Which of the following is true regarding alcohol and riding a two- wheeled vehicle?",
      a: "Coffee will sober you up enough to ride safely.",
      b: "Balance and reaction time are impaired after even one drink.",
      c: "Riding an e-bike requires less coordination, so higher blood alcohol levels are safe.",
      d: "Alcohol improves your confidence and riding ability.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_094",
      prompt: "What type of road surface provides the least traction for an e-bike or e- scooter?",
      a: "Dry asphalt.",
      b: "Dry concrete.",
      c: "Wet leaves or painted lines.",
      d: "Grooved pavement.",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_095",
      prompt: "The concept of 'traction limits' means that:",
      a: "You have unlimited grip on dry asphalt.",
      b: "A tire has a finite amount of grip that is shared between turning and braking.",
      c: "Braking has no effect on cornering.",
      d: "You must always use maximum braking in a corner.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_096",
      prompt: "What is the single most critical piece of safety equipment for preventing fatal injuries?",
      a: "Knee and elbow pads",
      b: "Heavy leather boots",
      c: "A properly fitted, safety-certified helmet",
      d: "Protective gloves",
      correct_answer: "c" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_097",
      prompt: "When passing a parked car on your right, what is the most significant hazard to watch for?",
      a: "The car's alarm sounding.",
      b: "A driver suddenly opening their door into your path.",
      c: "The car rolling backward.",
      d: "The car's tires blowing out.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_098",
      prompt: "When visually scanning the road ahead on a fast-moving e-scooter, you should:",
      a: "Stare at a single spot directly in front of your tire.",
      b: "Keep your eyes actively moving, scanning near for small pavement hazards, far for traffic changes, and side-to-side for opening car doors.",
      c: "Only look at the centerline.",
      d: "Focus entirely on your digital display.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_099",
      prompt: "What is the minimum recommended following distance behind the vehicle in front of you under normal conditions?",
      a: "1 second",
      b: "2 to 3 seconds",
      c: "5 seconds",
      d: "10 seconds",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
    {
      id: "Q_CERT_100",
      prompt: "Which of the following is a sign that riding fatigue is impairing your safety?",
      a: "Increased awareness of your surroundings.",
      b: "Taking corners wider than intended and having wandering thoughts.",
      c: "Feeling more physically relaxed.",
      d: "Quicker reaction times.",
      correct_answer: "b" as const,
      correct_side_note: "Correct answer",
      semi_correct_side_note: "Incorrect answer",
      extended_reading: {
        title: "Additional Information",
        context_type: "Reference",
        summary: "Review the study materials for more details on this topic."
      },
      glossary: []
    },
  ],
};
