export interface GlossaryItem {
  term: string;
  quick_tip: string;
  correct_answer: string;
}

export interface Question {
  images?: string[];
  id: string;
  prompt: string;
  prompt_es?: string;
  a: string;
  a_es?: string;
  b: string;
  b_es?: string;
  c: string;
  c_es?: string;
  d: string;
  d_es?: string;
  correct_answer: "a" | "b" | "c" | "d";
  correct_side_note: string;
  correct_side_note_es?: string;
  semi_correct_side_note: string;
  semi_correct_side_note_es?: string;
  extended_reading: {
    title: string;
    title_es?: string;
    context_type: string;
    context_type_es?: string;
    summary: string;
    summary_es?: string;
  };
  glossary?: GlossaryItem[];

}

export interface Zone {
  zone: string;
  speed_tier: string;
  background_tip: string;
  questions: Question[];
}

export const gameData: Zone[] = [
  {
    zone: "Zone 1: The DMV Parking Lot / Zona 1: El Estacionamiento del DMV",
    speed_tier: "15 MPH",
    background_tip: "Licensing protocols require strict documentation, identity verification, and eye exams before hitting the road.",
    questions: [
      {
        id: "Q_LEG_02",
        prompt: "Under the statutory Implied Consent Law, what do you legally agree to by signing your license application?",
        prompt_es: "Bajo la Ley de Consentimiento Implícito, ¿a qué estás legalmente de acuerdo al firmar tu solicitud de licencia?",
        a: "To take a breath, blood, or urine test if an officer suspects a chemical DUI.",
        a_es: "Someterte a una prueba de aliento, sangre u orina si un oficial sospecha un DUI químico.",
        b: "To carry comprehensive collision and liability insurance policies at all times.",
        b_es: "Llevar pólizas integrales de seguro de colisión y responsabilidad civil en todo momento.",
        c: "To automatically plead guilty to minor mechanical and equipment violations.",
        c_es: "Declararte automáticamente culpable de violaciones menores de equipos mecánicos.",
        d: "To always cooperate with traffic officers and show your physical license upon request.",
        d_es: "Cooperar siempre con los oficiales de tránsito y mostrar tu licencia física cuando se solicite.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-parking-lot-scenario-jsXYpueVp28cADofk5GMV7.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-licensing-VGXns5uYfuHPs467kwrL6R.webp"],
        correct_side_note: "10 POINTS: Spot on. Implied Consent explicitly ties your signature on your license to an advance agreement to submit to chemical screenings if lawfully requested by an officer. Refusal triggers independent, immediate administrative penalties.",
        correct_side_note_es: "10 PUNTOS: Exacto. El Consentimiento Implícito vincula explícitamente tu firma en tu licencia a un acuerdo previo de someterte a pruebas químicas si lo solicita legalmente un oficial. La negativa desencadena sanciones administrativas inmediatas e independientes.",
        semi_correct_side_note: "5 POINTS: Close, but incomplete. While showing your physical license and cooperating are standard legal obligations of an operator, they do not satisfy the specific statutory mandate of the 'Implied Consent' chemical testing clause.",
        semi_correct_side_note_es: "5 PUNTOS: Cerca, pero incompleto. Si bien mostrar tu licencia física y cooperar son obligaciones legales estándar de un operador, no satisfacen el mandato estatutario específico de la cláusula de pruebas químicas de 'Consentimiento Implícito'.",
        extended_reading: {
          title: "The Playground Contract: Signing Up for the Team",
          context_type: "Kid-Friendly Breakdown",
          summary: "Think of signing your license application like joining a school playground game. By joining the game, you are making a pinky promise to follow the referee's safety rules before you even start playing. If a coach or police officer needs to check that everyone is playing fair and healthy, your signature means you already promised to say 'Yes' and cooperate!"
        },
        glossary: [
          {
            term: "Implied Consent",
            quick_tip: "A legal agreement you make by signing your license that you'll take chemical tests if asked by an officer.",
            correct_answer: "To take a breath, blood, or urine test if an officer suspects a chemical DUI."
          },
          {
            term: "Chemical DUI",
            quick_tip: "Driving under the influence of alcohol or drugs, detected through breath, blood, or urine tests.",
            correct_answer: "Refusal to submit to chemical testing can result in immediate administrative penalties."
          },
          {
            term: "License Application",
            quick_tip: "The official document you sign to get permission to drive, which includes legal agreements.",
            correct_answer: "Your signature on the license application means you agree to the Implied Consent Law."
          }
        ]
      }
    ]
  },
  {
    zone: "Zone 2: Suburban Streets / Zona 2: Calles Suburbanas",
    speed_tier: "25 MPH",
    background_tip: "At intersections, never assume priority. Right-of-way can only be granted by others, never claimed manually.",
    questions: [
      {
        id: "Q_ROW_01",
        prompt: "When approaching an intersection, what is the legal status of the Right-of-Way?",
        prompt_es: "Al acercarse a una intersección, ¿cuál es el estado legal del derecho de paso?",
        a: "It is automatically yours if you are traveling straight on a main street.",
        a_es: "Es automáticamente tuyo si viajas recto en una calle principal.",
        b: "You must assertively take it to keep traffic flowing smoothly.",
        b_es: "Debes asertivamente tomarlo para mantener el tráfico fluyendo suavemente.",
        c: "You can never legally take it; you can only yield it to others.",
        c_es: "Nunca puedes legalmente tomarlo; solo puedes cederlo a otros.",
        d: "It belongs strictly to whichever vehicle is larger or heavier.",
        d_es: "Pertenece estrictamente al vehículo que es más grande o pesado.",
        correct_answer: "c",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/parking-garage-safety-7A8sdCkinzXpjwaK5fhZQp.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q2-yield-right-of-way-Yfz6BX8rfRmkWEHqfut7fV.webp"],
        correct_side_note: "10 POINTS: Perfectly answered. The vehicle code is written entirely around who must *yield* the right-of-way. The law never gives you the right to forcefully claim a patch of asphalt.",
        semi_correct_side_note: "5 POINTS: Incorrect application of physical realities. While a larger commercial truck can cause massive physical damage due to momentum laws, it does not possess a legal right-of-way exemption in suburban zoning blocks.",
        extended_reading: {
          title: "The Lightning McQueen Rule: Big Trucks and Kind Choices",
          context_type: "Animated Story Analogy",
          summary: "In cartoons like 'Cars', massive semi-trucks like Mack are much bigger than little race cars, but that doesn't mean they get to cut in line! On the real road, nobody 'owns' the right-of-way. Just like in the school cafeteria line, you have to wait for someone else to be nice and say, 'Your turn to go ahead of me!'"
        },
        glossary: [
          {
            term: "Right-of-Way",
            quick_tip: "The legal permission to proceed through an intersection or road before other vehicles.",
            correct_answer: "You can only yield right-of-way to others; you cannot claim it yourself."
          }
        ]
      },
      {
        id: "Q_ROW_02",
        prompt: "What does a statutory 'Yield' mandate you to do as a licensed operator?",
        prompt_es: "En una intersección controlada por semáforos, ¿cuándo es legal girar a la izquierda?",
        a: "Maintain current velocity while flashing high beams to warn crossing vehicles.",
        a_es: "Siempre que el tráfico opuesto esté claro, incluso con una luz roja.",
        b: "Come to a mandatory 3-second stop regardless of current traffic flow.",
        b_es: "Solo cuando tienes una flecha verde de giro a la izquierda o una luz verde sólida.",
        c: "Slow down slightly while continuing through the lane without looking.",
        c_es: "Cuando el tráfico opuesto está claro y tu luz es verde.",
        d: "Slow down or stop completely to let cross traffic or pedestrians pass first.",
        d_es: "Nunca es legal girar a la izquierda en una intersección controlada.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q3-controlled-intersection-DqoogBzVp9BexpBwUEZh47.webp"],
        correct_side_note: "10 POINTS: Exactly right. A yield sign requires you to defer your path to others. If cross-traffic is present, that slow down must turn into a full, legal stop.",
        semi_correct_side_note: "5 POINTS: Dangerous practice. Reducing your speed slightly (coasting) without scanning the oncoming corridors or pedestrian lines fails the basic standard of a proactive yield check.",
        extended_reading: {
          title: "Look Right, Look Left: The Freeze-Dance Sign",
          context_type: "Kindergarten Game Rules",
          summary: "A Yield sign is like playing a game of Freeze Dance with other cars. When you see it, you must slow down your feet and look around. If you see a bike, a person walking, or another car coming up the hallway, you have to freeze completely and let them pass by first before you can start dancing forward again!"
        },
        glossary: [
          {
            term: "Yield Sign",
            quick_tip: "A red and white triangular sign that requires you to slow down or stop to let other traffic pass first.",
            correct_answer: "You must slow down or stop completely to let cross traffic or pedestrians pass first."
          }
        ]
      },
      {
        id: "Q_ROW_03",
        prompt: "What legally defines an intersection as a 'Controlled Intersection'?",
        prompt_es: "En una intersección no controlada, ¿quién tiene derecho de paso?",
        a: "It features painted crosswalks, clear lane dividers, and streetlights.",
        a_es: "El vehículo que llega primero siempre tiene derecho de paso.",
        b: "It is monitored continuously by automated municipal speed cameras.",
        b_es: "El vehículo en la calle principal tiene derecho de paso.",
        c: "It is any standard junction located within city or business limits.",
        c_es: "El vehículo que viaja recto tiene derecho de paso sobre los que giran.",
        d: "It is regulated actively by traffic lights, stop signs, or yield signs.",
        d_es: "El vehículo en tu lado derecho tiene derecho de paso.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q4-uncontrolled-intersection-GzCCtfNra3zEqCJ7ESXi2k.webp"],
        correct_side_note: "10 POINTS: Excellent. Control requires active, regulatory traffic devices (lights, signage) that legally dictate vehicle cadence and movement sequences.",
        semi_correct_side_note: "5 POINTS: Too broad. While city and business districts contain a high concentration of controlled junctions, simply being inside municipal limits does not automatically make an un-signaled street corner 'controlled'.",
        extended_reading: {
          title: "Simon Says and Traffic Lights",
          context_type: "Middle School Science Corner",
          summary: "An intersection is 'controlled' when it acts just like a game of Simon Says! The big metal traffic lights and red Stop signs are Simon. If the light says 'Red,' Simon says stop! If there are no signs or lights at all, it's uncontrolled, meaning drivers have to use their shared neighborhood rulebook to decide who goes first."
        },
        glossary: [
          {
            term: "Controlled Intersection",
            quick_tip: "An intersection regulated by traffic lights, stop signs, or yield signs that control vehicle movement.",
            correct_answer: "It is regulated actively by traffic lights, stop signs, or yield signs."
          }
        ]
      },
      {
        id: "Q_ROW_04",
        prompt: "If you arrive at an Uncontrolled Intersection simultaneously with a car on your right, who proceeds?",
        prompt_es: "Si llegas a una Intersección No Controlada simultáneamente con un auto a tu derecha, ¿quién procede?",
        a: "The vehicle traveling at the higher overall rate of speed proceeds first.",
        a_es: "El vehículo que viaja a mayor velocidad procede primero.",
        b: "The vehicle turning left always takes precedence over straight-moving lanes.",
        b_es: "El vehículo que gira a la izquierda siempre tiene precedencia sobre los que van recto.",
        c: "Whichever vehicle signals their intention first is allowed to proceed.",
        c_es: "El vehículo que señala su intención primero puede proceder.",
        d: "The vehicle arriving on your right has the legal right-of-way.",
        d_es: "El vehículo que llega a tu derecha tiene derecho de paso legal.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/left-turn-safety-2cxnQLeLzBrsc3iHcUW4Uc.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q5-blind-spot-9jnn848pexZCtZv5dEWCGo.webp"],
        correct_side_note: "10 POINTS: Correct. The 'rule of the right' dictates that when two vehicles meet simultaneously at an unmarked grid, you must yield to the driver on your right side.",
        semi_correct_side_note: "5 POINTS: Incorrect. Turning on an electronic indicator lamp merely shows intent; it never grants you legal priority over a vehicle positioned to your right at a dead stop.",
        extended_reading: {
          title: "The Right-Hand High-Five Rule",
          context_type: "Classroom Sharing Lesson",
          summary: "When two students reach for the same toy or box of crayons at the exact same second, how do they share? Road laws make it easy: always look to your right hand! If a car is sitting right where your right hand is pointing, they get to pick up the toy—or cross the street—first. It keeps everyone smiling and avoids bumps!"
        },
        glossary: [
          {
            term: "Rule of the Right",
            quick_tip: "At an uncontrolled intersection, the vehicle on your right has the right-of-way when arriving simultaneously.",
            correct_answer: "The vehicle arriving on your right has the legal right-of-way."
          }
        ]
      },
      {
        id: "Q_ROW_05",
        prompt: "How must a driver check their vehicle's blind spots before executing any lane adjustment?",
        prompt_es: "¿Cómo debe un conductor revisar los puntos ciegos de su vehículo antes de cambiar de carril?",
        a: "Adjust your interior rearview mirror outward while moving forward.",
        a_es: "Ajusta tu espejo retrovisor interior hacia afuera mientras te mueves hacia adelante.",
        b: "Rely strictly on your side-view mirrors and integrated radar sensors.",
        b_es: "Confía únicamente en tus espejos laterales y sensores de radar integrados.",
        c: "Check your side-view mirrors twice before signaling and moving.",
        c_es: "Revisa tus espejos laterales dos veces antes de señalizar y moverte.",
        d: "Physically turn your head and look directly over your shoulder.",
        d_es: "Gira físicamente tu cabeza y mira directamente sobre tu hombro.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/lane-change-safety-c6YBDfUZPwjRskLGrhxVir.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q6-basic-speed-law-MKwxMn7me3djNtQLXhy9Hg.webp"],
        correct_side_note: "10 POINTS: Perfect. Convex and flat side-view mirrors cannot capture the distinct pocket alongside your vehicle's rear quarters. A physical head-turn is non-negotiable.",
        semi_correct_side_note: "5 POINTS: Safe habit, but flawed. Checking mirrors multiple times narrows your field of view down the side, but it still fails to reveal objects hidden parallel to your B-and-C pillars.",
        extended_reading: {
          title: "Playing Hide-and-Seek with Big Cars",
          context_type: "Fun Safety Science",
          summary: "Did you know cars have built-in hiding spots? They are called blind spots! Even if a driver looks in all three of their glass mirrors, a small motorcycle or a bicycle can be hiding right next to the back door like a sneaky hide-and-seek player. The only way to spot them is to turn your neck all the way around like an owl!"
        },
        glossary: [
          {
            term: "Blind Spot",
            quick_tip: "Areas around your vehicle that you cannot see in your mirrors and require a physical head-turn to check.",
            correct_answer: "Physically turn your head and look directly over your shoulder to check blind spots."
          }
        ]
      }
    ]
  },
  {
    zone: "Zone 3: The Open Highway / Zona 3: La Carretera Abierta",
    speed_tier: "45 MPH",
    background_tip: "Speed signs show maximums under perfect conditions. Wet, slick, or crowded roads demand immediate speed reduction.",
    questions: [
      {
        id: "Q_SPD_01",
        prompt: "Under the Basic Speed Law, how should you adjust your speed during heavy rain or thick fog?",
        prompt_es: "Bajo la Ley de Velocidad Básica, ¿cómo debes ajustar tu velocidad durante lluvia fuerte o niebla espesa?",
        a: "Maintain the exact posted speed limit to prevent rear-end collisions.",
        a_es: "Mantén la velocidad exacta del límite de velocidad para evitar colisiones traseras.",
        b: "Drive 10 MPH faster than surrounding traffic to clear the hazard quickly.",
        b_es: "Conduce 10 MPH más rápido que el tráfico circundante para salir del peligro rápidamente.",
        c: "Turn on your hazard lights and continue driving at the normal speed limit.",
        c_es: "Enciende tus luces de emergencia y continúa conduciendo al límite de velocidad normal.",
        d: "Slow down below the posted limit to match what is safe for current conditions.",
        d_es: "Reduce tu velocidad por debajo del límite de velocidad para que coincida con lo que es seguro para las condiciones actuales.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/weather-hazard-driving-3uHfhAXgzdKuRPMXiuEQW8.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q7-hydroplaning-NKcdUaQyuugJYxh8qUZpPF.webp"],
        correct_side_note: "10 POINTS: Spot on. The Basic Speed Law dictates that your velocity must always be reasonable and prudent for the environment, regardless of what is printed on the speed sign.",
        semi_correct_side_note: "5 POINTS: Dangerous logic. Running your amber hazards while refusing to drop your speed to match reduced friction coefficients creates an unpredictable moving hazard on high-speed roads.",
        extended_reading: {
          title: "Running in Heavy Mud vs. Running on Grass",
          context_type: "Gym Class Example",
          summary: "Imagine running as fast as you can during gym class on dry grass. Now imagine trying to sprint that fast through thick, slippery mud or in total darkness! You would trip, right? The Basic Speed Law just means using your common sense. If the weather gets messy, you have to slow down your tires so you stay safe."
        },
        glossary: [
          {
            term: "Basic Speed Law",
            quick_tip: "A law requiring you to drive at a safe speed for current road and weather conditions, regardless of posted limits.",
            correct_answer: "Slow down below the posted limit to match what is safe for current conditions."
          }
        ]
      },
      {
        id: "Q_SPD_02",
        prompt: "What immediate physical hazard occurs to a vehicle during a state of Hydroplaning?",
        prompt_es: "¿Cuál es el peligro físico inmediato que ocurre a un vehículo durante un estado de Hidroplaneo?",
        a: "Brake pads overheat rapidly due to moisture accumulation in the calipers.",
        a_es: "Las pastillas de freno se sobrecalientan rápidamente debido a la acumulación de humedad en los cilindros.",
        b: "The engine stalls instantly due to water entering the air intake system.",
        b_es: "El motor se detiene instantáneamente debido a que el agua entra en el sistema de admisión de aire.",
        c: "Your brakes lose partial pressure, increasing your general stopping distance.",
        c_es: "Tus frenos pierden presión parcial, aumentando tu distancia general de frenado.",
        d: "Tires ride on a layer of water, causing a total loss of traction and steering.",
        d_es: "Los neumáticos se deslizan sobre una capa de agua, causando una pérdida total de tracción y dirección.",
        correct_answer: "d",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q8-left-turn-oncoming-mcZ5rxjezxjZZmD4U7SJf3.webp"],
        correct_side_note: "10 POINTS: Exactly. Hydroplaning occurs when fluid hydrodynamic pressure matches the vertical load of your vehicle, lifting the rubber completely off the pavement onto a water wedge.",
        semi_correct_side_note: "5 POINTS: Misdiagnoses the core failure. Hydroplaning compromises your tires' contact patch, not the hydraulic fluid inside your brake lines. You lose steering control before braking even matters.",
        extended_reading: {
          title: "The Slip-and-Slide Effect on the Road",
          context_type: "Summer Toy Science",
          summary: "Have you ever run and slid across a backyard Slip-and-Slide water mat? It's super fun because your body floats right on top of the wet plastic! But when a heavy car goes too fast over a deep puddle, its tires do the exact same thing. The rubber lifts off the street and floats on the water. When that happens, the steering wheel won't turn the car at all!"
        },
        glossary: [
          {
            term: "Hydroplaning",
            quick_tip: "When tires lose contact with the road and float on water, causing loss of steering and braking control.",
            correct_answer: "Tires ride on a layer of water, causing a total loss of traction and steering."
          }
        ]
      },
      {
        id: "Q_SPD_03",
        prompt: "What is the standard minimum following distance recommended by the DMV to avoid tailgating?",
        a: "Maintain a minimum buffer of 3-to-4 seconds behind the lead vehicle.",
        b: "Keep a strict distance of exactly two car lengths for every 10 MPH of speed.",
        c: "Maintain a tight 1-to-2 second gap when driving in ideal weather conditions.",
        d: "Keep a safe distance of at least three full vehicle lengths on the highway.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/night-driving-safety-9mvPXHSv2KH3jVSrkrvbYq.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q9-right-turn-red-light-5u93Qf2aBVWVCQy8LSHFLG.webp"],
        correct_side_note: "10 POINTS: Correct. Time-based tracking (seconds) scales automatically as your speed increases, ensuring an adequate spatial safety buffer regardless of velocity.",
        semi_correct_side_note: "5 POINTS: Outdated metric. Measuring by arbitrary 'car lengths' is incredibly inaccurate at 45+ MPH because drivers consistently misjudge physical linear distances while moving.",
        extended_reading: {
          title: "The Bubble Rule: Giving Your Friends Personal Space",
          context_type: "School Bus Safety Rule",
          summary: "In school, teachers talk about keeping an 'invisible bubble' of personal space around yourself so nobody accidentally bumps elbows. Cars need a giant time-bubble on the highway! Counting 'one-alligator, two-alligator, three-alligator' after the car ahead passes a tree gives you a perfect safety bubble to stop safely if they step on their brakes."
        },
        glossary: [
          {
            term: "Following Distance",
            quick_tip: "The safe space between your vehicle and the one ahead, measured in seconds (typically 3-4 seconds).",
            correct_answer: "Maintain a minimum buffer of 3-to-4 seconds behind the lead vehicle."
          }
        ]
      },
      {
        id: "Q_SIG_01",
        prompt: "What is the core legal purpose and typical color palette of a statutory Regulatory Sign?",
        a: "They mandate what you must or must not do by law; colored red, white, and black.",
        b: "They warn you of upcoming road hazards; colored bright yellow and diamond-shaped.",
        c: "They show mileage and exit destinations; colored green, blue, or brown.",
        d: "They provide basic legal speed rules for specific highways and cities.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/parking-lot-safety-TzUFTpZ964yKGpSbVaXfvU.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q10-pedestrian-crosswalk-ZFFehsCtYWzrKm9H78YUzX.webp"],
        correct_side_note: "10 POINTS: Perfect. Regulatory signs represent actual laws. Disobeying a red, white, or black sign (like a Stop or Speed Limit sign) is an immediate moving violation.",
        semi_correct_side_note: "5 POINTS: Too limited. While speed limit panels are a prominent subset of regulatory signage, these markers govern everything from turn tracking and lane restrictions to wrong-way mandates.",
        extended_reading: {
          title: "Red, White, and Black: The Rule Makers",
          context_type: "Color Secret Code",
          summary: "Road signs speak in a secret color code. Red, White, and Black signs are the bosses of the highway. They tell you exactly what the law says you MUST do (like STOP or go 25 MPH). If a sign has these colors, it's not a suggestion—it's a strict rule, just like 'No running in the hallways!'"
        },
        glossary: [
          {
            term: "Regulatory Sign",
            quick_tip: "A red, white, and black sign that tells you what you must or must not do by law.",
            correct_answer: "They mandate what you must or must not do by law; colored red, white, and black."
          }
        ]
      },
      {
        id: "Q_SIG_02",
        prompt: "How can you instantly identify a standard Warning Sign by its geometric shape and color profile?",
        a: "They are almost always bright yellow and diamond-shaped.",
        b: "They are configured as vertical rectangles with a solid white background.",
        c: "They are designed as equilateral triangles pointing directly downward.",
        d: "They are bright orange and used exclusively to highlight highway zones.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/school-zone-safety-bmqPuvDfiFthKu76Ynjejk.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q11-emergency-vehicle-UmbPuYsUKzVZJwFhdothn2.webp"],
        correct_side_note: "10 POINTS: Spot on. Yellow diamonds alert operators to changing physical road conditions, upcoming curves, lane mergers, or environmental hazards ahead.",
        semi_correct_side_note: "5 POINTS: Confuses distinct classes. Orange signs are temporary warning markers explicitly reserved for road construction and maintenance zones, not standard perpetual warnings.",
        extended_reading: {
          title: "Yellow Diamonds Mean 'Watch Out!'",
          context_type: "Preschool Picture Book Style",
          summary: "Bright yellow diamonds look like little glowing warning lights on the side of the road. They don't give you tickets, but they whisper helpful secrets like: 'Hey driver, there's a sharp turn coming up!' or 'Watch out, deer like to cross the grass here!' They give your eyes a heads-up so you don't get surprised."
        },
        glossary: [
          {
            term: "Warning Sign",
            quick_tip: "A bright yellow diamond-shaped sign that alerts you to upcoming road hazards or changes.",
            correct_answer: "They are almost always bright yellow and diamond-shaped."
          }
        ]
      },
      {
        id: "Q_SIG_03",
        prompt: "What specific information do structural Guide Signs provide to a driver on the road?",
        a: "Directional routing, mileage to destinations, and available motorist services.",
        b: "Immediate speed limits, axle weight restrictions, and no-turn mandates.",
        c: "Active road construction warning lines and temporary flagger instructions.",
        d: "Helpful updates about changing lane layouts and upcoming toll bridges.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/construction-zone-safety-Vuz64Noiaehx98WB6hMPE9.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q12-highway-merging-MPt3HJZo96zNQdnaqtSMaT.webp"],
        correct_side_note: "10 POINTS: Correct. Guide signs are informational pillars—green for routes/miles, blue for services, and brown for public parks or recreation.",
        semi_correct_side_note: "5 POINTS: Incomplete. While toll notices or structural lane layout maps do fall under informational guidance, they represent a minor fragment of the overall destination and tracking matrix.",
        extended_reading: {
          title: "The Green, Blue, and Brown Map Signs",
          context_type: "Adventure Map Guide",
          summary: "Guide signs are like real-life treasure maps! Giant green signs tell you how many miles are left until you reach Disneyland or Grandma's house. Big blue signs tell you where to find yummy snacks or gas stations, and brown signs point to cool camping parks and hiking trails. They help your family navigate without getting lost!"
        },
        glossary: [
          {
            term: "Guide Sign",
            quick_tip: "Green, blue, or brown signs that provide directional routing, mileage, and information about services.",
            correct_answer: "Directional routing, mileage to destinations, and available motorist services."
          }
        ]
      },
      {
        id: "Q_SIG_04",
        prompt: "What road surface marking identifies an HOV Lane, and who is legally authorized to use it?",
        a: "Marked by a white diamond symbol; reserved for vehicles meeting minimum passenger limits.",
        b: "Marked by solid double yellow lines; reserved exclusively for emergency vehicles.",
        c: "Marked by broken white lines; reserved for high-speed commercial cargo trucks.",
        d: "Marked by a solid white boundary; reserved for buses and motorcycles only.",
        correct_answer: "a",
        images: ["https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/right-turn-on-red-bqhgPzY8yHjYjtT3Ww7gQU.webp", "https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-q13-backing-up-safely-WtkpkUEVtFmvP25RCq4wGm.webp"],
        correct_side_note: "10 POINTS: Perfectly answered. High-Occupancy Vehicle lanes use the white diamond pavement marker to keep high-capacity commuter traffic flowing efficiently.",
        semi_correct_side_note: "5 POINTS: Partially correct depending on local context. Many states allow transit buses and solo motorcycles to utilize HOV diamond lanes for safety, but this completely overlooks the main carpool occupancy rules.",
        extended_reading: {
          title: "The Carpool Diamond: The Car-Sharing Reward Lane",
          context_type: "Eco-Friendly Short Story",
          summary: "When people share a ride together instead of driving separate cars, they are helping keep the air clean and reducing traffic jams. To reward them, the road has a special lane painted with shiny white diamonds! If you have your family or friends in the car, you get to jump into the Diamond Lane and zoom past the slow traffic!"
        },
        glossary: [
          {
            term: "HOV Lane",
            quick_tip: "A lane marked with white diamond symbols reserved for vehicles with minimum passenger occupancy.",
            correct_answer: "Marked by a white diamond symbol; reserved for vehicles meeting minimum passenger limits."
          }
        ]
      }
    ]
  },
];
