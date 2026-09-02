import fs from "node:fs/promises";

const previewUrl = "https://3000-im8cabn0rg62ig26kh45a-495aa555.us1.manus.computer/";
const cdpPort = 9222;
const width = Number(process.env.SMOKE_WIDTH || 375);
const height = Number(process.env.SMOKE_HEIGHT || 812);
const outputPath = process.env.SMOKE_OUTPUT || `/home/ubuntu/verification/bingo-${width}.png`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function unescapeString(value) {
  return JSON.parse(`"${value}"`);
}

function parseQuestions(source) {
  const questions = [];
  const pattern = /\{ id: (\d+), question: "((?:\\.|[^"\\])*)", options: \[(.*?)\], answer: "((?:\\.|[^"\\])*)" \}/gs;
  for (const match of source.matchAll(pattern)) {
    questions.push({ question: unescapeString(match[2]), answer: unescapeString(match[4]) });
  }
  return questions;
}

async function target() {
  const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await response.json();
  const page = targets.find((entry) => entry.type === "page" && entry.url.includes("manus.computer"));
  if (!page) throw new Error("No active preview page found");
  return page;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}

async function run() {
  const source = await fs.readFile("/home/ubuntu/permit-prep-site/client/src/components/SpeedTestGame.tsx", "utf8");
  const questions = parseQuestions(source);
  if (questions.length !== 100) throw new Error(`Expected 100 questions, parsed ${questions.length}`);

  const socket = await connect((await target()).webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (resolve) {
      pending.delete(message.id);
      resolve(message);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Evaluation failed");
    return response.result?.result?.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Page.navigate", { url: previewUrl });
  await sleep(1600);
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('DMV License Speed Test')); button?.click(); return Boolean(button); })()`);
  await sleep(250);
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('Start Speed Test')); button?.click(); return Boolean(button); })()`);
  await sleep(450);

  let filledSlots = 0;
  let doubleFillObserved = false;
  let bonusObserved = false;
  let answered = 0;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = await evaluate(`(() => ({
      question: document.querySelector('h3')?.textContent?.trim() || null,
      filled: document.querySelectorAll('[aria-label^="Bingo Prep space"][aria-label*="filled"]').length,
      bonus: [...document.querySelectorAll('*')].some((node) => (node.textContent || '').trim() === 'Bingo +1,000'),
    }))()`);
    if (!state.question) break;
    const item = questions.find((candidate) => candidate.question === state.question);
    if (!item) throw new Error(`No answer mapping for question: ${state.question}`);
    const clicked = await evaluate(`(() => {
      const answer = ${JSON.stringify(item.answer)};
      const button = [...document.querySelectorAll('button')].find((node) => /^[A-D]\\./.test((node.textContent || '').trim()) && (node.textContent || '').includes(answer));
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error(`Could not select answer for: ${item.question}`);
    answered += 1;
    await sleep(110);
    const after = await evaluate(`(() => ({
      filled: document.querySelectorAll('[aria-label^="Bingo Prep space"][aria-label*="filled"]').length,
      bonus: [...document.querySelectorAll('*')].some((node) => (node.textContent || '').trim() === 'Bingo +1,000'),
    }))()`);
    if (after.filled - filledSlots >= 2) doubleFillObserved = true;
    if (after.bonus) bonusObserved = true;
    filledSlots = after.filled;
    if (bonusObserved) break;
    await sleep(520);
  }

  const summary = await evaluate(`(() => ({
    viewport: { width: window.innerWidth, height: window.innerHeight },
    bodyWidth: document.body.scrollWidth,
    answered: ${answered},
    doubleFillObserved: ${doubleFillObserved},
    bonusObserved: ${bonusObserved},
    filledSlots: document.querySelectorAll('[aria-label^="Bingo Prep space"][aria-label*="filled"]').length,
    bingoText: (document.body.innerText || '').includes('Bingo +1,000'),
    answerButtons: [...document.querySelectorAll('button')].filter((node) => /^[A-D]\\./.test((node.textContent || '').trim())).length,
  }))()`);
  const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await fs.mkdir("/home/ubuntu/verification", { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(screenshot.result.data, "base64"));
  console.log(JSON.stringify(summary));
  socket.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
