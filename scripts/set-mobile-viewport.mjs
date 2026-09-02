const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = targets.find((entry) => entry.type === 'page' && entry.url.includes('manus.computer'));
if (!target) throw new Error('No active preview page found');
const ws = await new Promise((resolve, reject) => {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  socket.addEventListener('open', () => resolve(socket), { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (resolve) { pending.delete(message.id); resolve(message); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const requestId = ++id;
  pending.set(requestId, resolve);
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
console.log('Mobile viewport set to 375x812 without page reload.');
ws.close();
