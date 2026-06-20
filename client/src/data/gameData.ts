export interface Question {
  id: string;
  prompt: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct_answer: "a" | "b" | "c" | "d";
  correct_side_note: string;
  semi_correct_side_note: string;
  extended_reading: {
    title: string;
    context_type: string;
    summary: string;
  };
}

export interface Zone {
  zone: string;
  speed_tier: string;
  background_tip: string;
  questions: Question[];
}

export const gameData: Zone[] = [
  {
    zone: "Zone 1: The DMV Parking Lot",
    speed_tier: "15 MPH",
    background_tip: "Licensing protocols require strict documentation, identity verification, and eye exams before hitting the road.",
    questions: [
      {
        id: "Q_LEG_02",
        prompt: "Under the statutory Implied Consent Law, what do you legally agree to by signing your license application?",
        a: "To take a breath, blood, or urine test if an officer suspects a chemical DUI.",
        b: "To carry comprehensive collision and liability insurance policies at all times.",
        c: "To automatically plead guilty to minor mechanical and equipment violations.",
        d: "To always cooperate with traffic officers and show your physical license upon request.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Spot on. Implied Consent explicitly ties your signature on your license to an advance agreement to submit to chemical screenings if lawfully requested by an officer. Refusal triggers independent, immediate administrative penalties.",
        semi_correct_side_note: "5 POINTS: Close, but incomplete. While showing your physical license and cooperating are standard legal obligations of an operator, they do not satisfy the specific statutory mandate of the 'Implied Consent' chemical testing clause.",
        extended_reading: {
          title: "The Playground Contract: Signing Up for the Team",
          context_type: "Kid-Friendly Breakdown",
          summary: "Think of signing your license application like joining a school playground game. By joining the game, you are making a pinky promise to follow the referee's safety rules before you even start playing. If a coach or police officer needs to check that everyone is playing fair and healthy, your signature means you already promised to say 'Yes' and cooperate!"
        }
      }
    ]
  },
  {
    zone: "Zone 2: Suburban Streets",
    speed_tier: "25 MPH",
    background_tip: "At intersections, never assume priority. Right-of-way can only be granted by others, never claimed manually.",
    questions: [
      {
        id: "Q_ROW_01",
        prompt: "When approaching an intersection, what is the legal status of the Right-of-Way?",
        a: "You can never legally take it; you can only yield it to others.",
        b: "It is automatically yours if you are traveling straight on a main street.",
        c: "You must assertively take it to keep traffic flowing smoothly.",
        d: "It belongs strictly to whichever vehicle is larger or heavier.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Perfectly answered. The vehicle code is written entirely around who must *yield* the right-of-way. The law never gives you the right to forcefully claim a patch of asphalt.",
        semi_correct_side_note: "5 POINTS: Incorrect application of physical realities. While a larger commercial truck can cause massive physical damage due to momentum laws, it does not possess a legal right-of-way exemption in suburban zoning blocks.",
        extended_reading: {
          title: "The Lightning McQueen Rule: Big Trucks and Kind Choices",
          context_type: "Animated Story Analogy",
          summary: "In cartoons like 'Cars', massive semi-trucks like Mack are much bigger than little race cars, but that doesn't mean they get to cut in line! On the real road, nobody 'owns' the right-of-way. Just like in the school cafeteria line, you have to wait for someone else to be nice and say, 'Your turn to go ahead of me!'"
        }
      },
      {
        id: "Q_ROW_02",
        prompt: "What does a statutory 'Yield' mandate you to do as a licensed operator?",
        a: "Slow down or stop completely to let cross traffic or pedestrians pass first.",
        b: "Maintain current velocity while flashing high beams to warn crossing vehicles.",
        c: "Come to a mandatory 3-second stop regardless of current traffic flow.",
        d: "Slow down slightly while continuing through the lane without looking.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Exactly right. A yield sign requires you to defer your path to others. If cross-traffic is present, that slow down must turn into a full, legal stop.",
        semi_correct_side_note: "5 POINTS: Dangerous practice. Reducing your speed slightly (coasting) without scanning the oncoming corridors or pedestrian lines fails the basic standard of a proactive yield check.",
        extended_reading: {
          title: "Look Right, Look Left: The Freeze-Dance Sign",
          context_type: "Kindergarten Game Rules",
          summary: "A Yield sign is like playing a game of Freeze Dance with other cars. When you see it, you must slow down your feet and look around. If you see a bike, a person walking, or another car coming up the hallway, you have to freeze completely and let them pass by first before you can start dancing forward again!"
        }
      },
      {
        id: "Q_ROW_03",
        prompt: "What legally defines an intersection as a 'Controlled Intersection'?",
        a: "It is regulated actively by traffic lights, stop signs, or yield signs.",
        b: "It features painted crosswalks, clear lane dividers, and streetlights.",
        c: "It is monitored continuously by automated municipal speed cameras.",
        d: "It is any standard junction located within city or business limits.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Excellent. Control requires active, regulatory traffic devices (lights, signage) that legally dictate vehicle cadence and movement sequences.",
        semi_correct_side_note: "5 POINTS: Too broad. While city and business districts contain a high concentration of controlled junctions, simply being inside municipal limits does not automatically make an un-signaled street corner 'controlled'.",
        extended_reading: {
          title: "Simon Says and Traffic Lights",
          context_type: "Middle School Science Corner",
          summary: "An intersection is 'controlled' when it acts just like a game of Simon Says! The big metal traffic lights and red Stop signs are Simon. If the light says 'Red,' Simon says stop! If there are no signs or lights at all, it's uncontrolled, meaning drivers have to use their shared neighborhood rulebook to decide who goes first."
        }
      },
      {
        id: "Q_ROW_04",
        prompt: "If you arrive at an Uncontrolled Intersection simultaneously with a car on your right, who proceeds?",
        a: "The vehicle arriving on your right has the legal right-of-way.",
        b: "The vehicle traveling at the higher overall rate of speed proceeds first.",
        c: "The vehicle turning left always takes precedence over straight-moving lanes.",
        d: "Whichever vehicle signals their intention first is allowed to proceed.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Correct. The 'rule of the right' dictates that when two vehicles meet simultaneously at an unmarked grid, you must yield to the driver on your right side.",
        semi_correct_side_note: "5 POINTS: Incorrect. Turning on an electronic indicator lamp merely shows intent; it never grants you legal priority over a vehicle positioned to your right at a dead stop.",
        extended_reading: {
          title: "The Right-Hand High-Five Rule",
          context_type: "Classroom Sharing Lesson",
          summary: "When two students reach for the same toy or box of crayons at the exact same second, how do they share? Road laws make it easy: always look to your right hand! If a car is sitting right where your right hand is pointing, they get to pick up the toy—or cross the street—first. It keeps everyone smiling and avoids bumps!"
        }
      },
      {
        id: "Q_ROW_05",
        prompt: "How must a driver check their vehicle's blind spots before executing any lane adjustment?",
        a: "Physically turn your head and look directly over your shoulder.",
        b: "Adjust your interior rearview mirror outward while moving forward.",
        c: "Rely strictly on your side-view mirrors and integrated radar sensors.",
        d: "Check your side-view mirrors twice before signaling and moving.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Perfect. Convex and flat side-view mirrors cannot capture the distinct pocket alongside your vehicle's rear quarters. A physical head-turn is non-negotiable.",
        semi_correct_side_note: "5 POINTS: Safe habit, but flawed. Checking mirrors multiple times narrows your field of view down the side, but it still fails to reveal objects hidden parallel to your B-and-C pillars.",
        extended_reading: {
          title: "Playing Hide-and-Seek with Big Cars",
          context_type: "Fun Safety Science",
          summary: "Did you know cars have built-in hiding spots? They are called blind spots! Even if a driver looks in all three of their glass mirrors, a small motorcycle or a bicycle can be hiding right next to the back door like a sneaky hide-and-seek player. The only way to spot them is to turn your neck all the way around like an owl!"
        }
      }
    ]
  },
  {
    zone: "Zone 3: The Open Highway",
    speed_tier: "45 MPH",
    background_tip: "Speed signs show maximums under perfect conditions. Wet, slick, or crowded roads demand immediate speed reduction.",
    questions: [
      {
        id: "Q_SPD_01",
        prompt: "Under the Basic Speed Law, how should you adjust your speed during heavy rain or thick fog?",
        a: "Slow down below the posted limit to match what is safe for current conditions.",
        b: "Maintain the exact posted speed limit to prevent rear-end collisions.",
        c: "Drive 10 MPH faster than surrounding traffic to clear the hazard quickly.",
        d: "Turn on your hazard lights and continue driving at the normal speed limit.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Spot on. The Basic Speed Law dictates that your velocity must always be reasonable and prudent for the environment, regardless of what is printed on the speed sign.",
        semi_correct_side_note: "5 POINTS: Dangerous logic. Running your amber hazards while refusing to drop your speed to match reduced friction coefficients creates an unpredictable moving hazard on high-speed roads.",
        extended_reading: {
          title: "Running in Heavy Mud vs. Running on Grass",
          context_type: "Gym Class Example",
          summary: "Imagine running as fast as you can during gym class on dry grass. Now imagine trying to sprint that fast through thick, slippery mud or in total darkness! You would trip, right? The Basic Speed Law just means using your common sense. If the weather gets messy, you have to slow down your tires so you stay safe."
        }
      },
      {
        id: "Q_SPD_02",
        prompt: "What immediate physical hazard occurs to a vehicle during a state of Hydroplaning?",
        a: "Tires ride on a layer of water, causing a total loss of traction and steering.",
        b: "Brake pads overheat rapidly due to moisture accumulation in the calipers.",
        c: "The engine stalls instantly due to water entering the air intake system.",
        d: "Your brakes lose partial pressure, increasing your general stopping distance.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Exactly. Hydroplaning occurs when fluid hydrodynamic pressure matches the vertical load of your vehicle, lifting the rubber completely off the pavement onto a water wedge.",
        semi_correct_side_note: "5 POINTS: Misdiagnoses the core failure. Hydroplaning compromises your tires' contact patch, not the hydraulic fluid inside your brake lines. You lose steering control before braking even matters.",
        extended_reading: {
          title: "The Slip-and-Slide Effect on the Road",
          context_type: "Summer Toy Science",
          summary: "Have you ever run and slid across a backyard Slip-and-Slide water mat? It's super fun because your body floats right on top of the wet plastic! But when a heavy car goes too fast over a deep puddle, its tires do the exact same thing. The rubber lifts off the street and floats on the water. When that happens, the steering wheel won't turn the car at all!"
        }
      },
      {
        id: "Q_SPD_03",
        prompt: "What is the standard minimum following distance recommended by the DMV to avoid tailgating?",
        a: "Maintain a minimum buffer of 3-to-4 seconds behind the lead vehicle.",
        b: "Keep a strict distance of exactly two car lengths for every 10 MPH of speed.",
        c: "Maintain a tight 1-to-2 second gap when driving in ideal weather conditions.",
        d: "Keep a safe distance of at least three full vehicle lengths on the highway.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Correct. Time-based tracking (seconds) scales automatically as your speed increases, ensuring an adequate spatial safety buffer regardless of velocity.",
        semi_correct_side_note: "5 POINTS: Outdated metric. Measuring by arbitrary 'car lengths' is incredibly inaccurate at 45+ MPH because drivers consistently misjudge physical linear distances while moving.",
        extended_reading: {
          title: "The Bubble Rule: Giving Your Friends Personal Space",
          context_type: "School Bus Safety Rule",
          summary: "In school, teachers talk about keeping an 'invisible bubble' of personal space around yourself so nobody accidentally bumps elbows. Cars need a giant time-bubble on the highway! Counting 'one-alligator, two-alligator, three-alligator' after the car ahead passes a tree gives you a perfect safety bubble to stop safely if they step on their brakes."
        }
      },
      {
        id: "Q_SIG_01",
        prompt: "What is the core legal purpose and typical color palette of a statutory Regulatory Sign?",
        a: "They mandate what you must or must not do by law; colored red, white, and black.",
        b: "They warn you of upcoming road hazards; colored bright yellow and diamond-shaped.",
        c: "They show mileage and exit destinations; colored green, blue, or brown.",
        d: "They provide basic legal speed rules for specific highways and cities.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Perfect. Regulatory signs represent actual laws. Disobeying a red, white, or black sign (like a Stop or Speed Limit sign) is an immediate moving violation.",
        semi_correct_side_note: "5 POINTS: Too limited. While speed limit panels are a prominent subset of regulatory signage, these markers govern everything from turn tracking and lane restrictions to wrong-way mandates.",
        extended_reading: {
          title: "Red, White, and Black: The Rule Makers",
          context_type: "Color Secret Code",
          summary: "Road signs speak in a secret color code. Red, White, and Black signs are the bosses of the highway. They tell you exactly what the law says you MUST do (like STOP or go 25 MPH). If a sign has these colors, it's not a suggestion—it's a strict rule, just like 'No running in the hallways!'"
        }
      },
      {
        id: "Q_SIG_02",
        prompt: "How can you instantly identify a standard Warning Sign by its geometric shape and color profile?",
        a: "They are almost always bright yellow and diamond-shaped.",
        b: "They are configured as vertical rectangles with a solid white background.",
        c: "They are designed as equilateral triangles pointing directly downward.",
        d: "They are bright orange and used exclusively to highlight highway zones.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Spot on. Yellow diamonds alert operators to changing physical road conditions, upcoming curves, lane mergers, or environmental hazards ahead.",
        semi_correct_side_note: "5 POINTS: Confuses distinct classes. Orange signs are temporary warning markers explicitly reserved for road construction and maintenance zones, not standard perpetual warnings.",
        extended_reading: {
          title: "Yellow Diamonds Mean 'Watch Out!'",
          context_type: "Preschool Picture Book Style",
          summary: "Bright yellow diamonds look like little glowing warning lights on the side of the road. They don't give you tickets, but they whisper helpful secrets like: 'Hey driver, there's a sharp turn coming up!' or 'Watch out, deer like to cross the grass here!' They give your eyes a heads-up so you don't get surprised."
        }
      },
      {
        id: "Q_SIG_03",
        prompt: "What specific information do structural Guide Signs provide to a driver on the road?",
        a: "Directional routing, mileage to destinations, and available motorist services.",
        b: "Immediate speed limits, axle weight restrictions, and no-turn mandates.",
        c: "Active road construction warning lines and temporary flagger instructions.",
        d: "Helpful updates about changing lane layouts and upcoming toll bridges.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Correct. Guide signs are informational pillars—green for routes/miles, blue for services, and brown for public parks or recreation.",
        semi_correct_side_note: "5 POINTS: Incomplete. While toll notices or structural lane layout maps do fall under informational guidance, they represent a minor fragment of the overall destination and tracking matrix.",
        extended_reading: {
          title: "The Green, Blue, and Brown Map Signs",
          context_type: "Adventure Map Guide",
          summary: "Guide signs are like real-life treasure maps! Giant green signs tell you how many miles are left until you reach Disneyland or Grandma's house. Big blue signs tell you where to find yummy snacks or gas stations, and brown signs point to cool camping parks and hiking trails. They help your family navigate without getting lost!"
        }
      },
      {
        id: "Q_SIG_04",
        prompt: "What road surface marking identifies an HOV Lane, and who is legally authorized to use it?",
        a: "Marked by a white diamond symbol; reserved for vehicles meeting minimum passenger limits.",
        b: "Marked by solid double yellow lines; reserved exclusively for emergency vehicles.",
        c: "Marked by broken white lines; reserved for high-speed commercial cargo trucks.",
        d: "Marked by a solid white boundary; reserved for buses and motorcycles only.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Perfectly answered. High-Occupancy Vehicle lanes use the white diamond pavement marker to keep high-capacity commuter traffic flowing efficiently.",
        semi_correct_side_note: "5 POINTS: Partially correct depending on local context. Many states allow transit buses and solo motorcycles to utilize HOV diamond lanes for safety, but this completely overlooks the main carpool occupancy rules.",
        extended_reading: {
          title: "The Carpool Diamond: The Car-Sharing Reward Lane",
          context_type: "Eco-Friendly Short Story",
          summary: "When people share a ride together instead of driving separate cars, they are helping keep the air clean and reducing traffic jams. To reward them, the road has a special lane painted with shiny white diamonds! If you have your family or friends in the car, you get to jump into the Diamond Lane and zoom past the slow traffic!"
        }
      }
    ]
  },
  {
    zone: "Zone 4: Nighttime / Mountain Driving",
    speed_tier: "65 MPH",
    background_tip: "High speeds paired with mountain grades, poor visibility, or chemical impairment carry extreme statutory penalties.",
    questions: [
      {
        id: "Q_LEG_01",
        prompt: "What are the precise legal Blood Alcohol Concentration (BAC) limits for drivers over and under 21?",
        a: "0.08% or higher for adults over 21; 0.00% (Zero Tolerance) for anyone under 21.",
        b: "0.10% or higher for adults over 21; 0.02% or lower for anyone under 21.",
        c: "0.05% or higher for all drivers regardless of age due to federal mandate.",
        d: "0.08% for adults; any trace amount that visibly impairs driving for minors.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Absolutely. Per statutory law, a 0.08% BAC is the per se legal limit for adult criminal impairment. For minors under 21, Zero Tolerance dictates that any measurable alcohol (0.00% - 0.02% depending on state equipment tolerances) results in immediate legal action.",
        semi_correct_side_note: "5 POINTS: Close, but legally weak. While visible physical impairment is heavily prosecuted, the state does not require a minor to 'look drunk' to charge them; the mere chemical presence of alcohol violates the Zero Tolerance statute.",
        extended_reading: {
          title: "Zero Tolerance: The Absolute Zero Rule",
          context_type: "Science & Safety Lesson",
          summary: "In math and science, zero means absolutely nothing at all. For young drivers under 21 years old, the law has a rule called Zero Tolerance. This means a young person's body must have exactly ZERO alcohol in it if they are steering a car. It keeps their growing brains sharp and guarantees everyone stays perfectly safe on the road!"
        }
      },
      {
        id: "Q_LEG_03",
        prompt: "What is the operational methodology of a driver executing a proper Defensive Driving strategy?",
        a: "Actively looking ahead to anticipate hazards and making preemptive adjustments.",
        b: "Maintaining your right-of-way strictly to force erratic drivers to yield.",
        c: "Using rapid lane changes to stay clear of large commercial vehicle clusters.",
        d: "Driving significantly below the speed limit to maximize reaction time.",
        correct_answer: "a",
        correct_side_note: "10 POINTS: Outstanding. Defensive driving requires constant scanning, mapping hazard vectors 12-15 seconds ahead, and assuming other drivers will make critical errors.",
        semi_correct_side_note: "5 POINTS: Overly cautious and disruptive. While slowing down increases your buffer, traveling significantly below the normal flow of high-speed highway traffic creates an artificial bottleneck that forces dangerous swerving behind you.",
        extended_reading: {
          title: "Being a Superhero Defensive Driver",
          context_type: "Relatable Analogy",
          summary: "A defensive driver is like a superhero with super-vision! Instead of just staring at the bumper right in front of them, they keep their eyes scanning far ahead to spot potential trouble before it happens—like a loose ball rolling into the street or a puddle of ice. They are always ready to protect themselves and others by staying alert!"
        }
      }
    ]
  }
];
