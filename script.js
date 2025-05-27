// ========== Setup & Constants ==========
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');

const SIZE = 500;
const DPR = window.devicePixelRatio || 1;
canvas.width = SIZE * DPR;
canvas.height = SIZE * DPR;
canvas.style.width = SIZE + 'px';
canvas.style.height = SIZE + 'px';
ctx.scale(DPR, DPR);

const CENTER = SIZE / 2;
const RADIUS = 240;
const POCKET_RAD = RADIUS - 20;
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_SET = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const SLICE = (2 * Math.PI) / SEQ.length;
const SPIN_DURATION = 5000;

let wheelAngle = 0, wheelVel = 0;
let ballAngle = 0, ballRad = RADIUS - 5, ballVel = 0;
let dropping = false, spinning = false;

// ========== Draw Functions ==========
function clearAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawWheel() {
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(wheelAngle);
  SEQ.forEach((n, i) => {
    const start = i * SLICE;
    ctx.beginPath();
    ctx.fillStyle = n === 0 ? '#088' : RED_SET.has(n) ? '#c00' : '#111';
    ctx.moveTo(0,0);
    ctx.arc(0,0,RADIUS,start,start + SLICE);
    ctx.fill();
    ctx.save();
      ctx.rotate(start + SLICE / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(RADIUS * 0.06)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(n, RADIUS - 12, 6);
    ctx.restore();
  });
  ctx.restore();
}

function drawBall() {
  const x = CENTER + ballRad * Math.cos(ballAngle);
  const y = CENTER + ballRad * Math.sin(ballAngle);
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(x,y,8,0,2*Math.PI);
  ctx.fill();
}

// ========== Spin Logic ==========
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '';

  wheelVel = 0.5 + Math.random() * 0.3;
  ballVel = -wheelVel * (RADIUS / ballRad) * 1.2;
  ballRad = RADIUS - 5;
  ballAngle = Math.random() * 2 * Math.PI;
  dropping = false;
  const startTime = performance.now();
  let lastTime = startTime;

  function step(now) {
    const dt = now - lastTime;
    lastTime = now;
    const elapsed = now - startTime;

    if (elapsed < SPIN_DURATION) {
      const decay = 0.995 ** (dt / 16);
      wheelVel *= decay;
      ballVel *= decay;
    } else if (!dropping) {
      dropping = true;
    }

    if (dropping) {
      const decay2 = 0.98 ** (dt / 16);
      wheelVel *= decay2;
      ballVel *= decay2;
      ballRad += (POCKET_RAD - ballRad) * 0.05;
      if (Math.abs(ballVel) < 0.001) return finalize();
    }

    wheelAngle += wheelVel * (dt / 16);
    ballAngle += ballVel * (dt / 16);

    clearAll(); drawWheel(); drawBall();
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ========== Finalize & Result ==========
function finalize() {
  const rel = ((ballAngle - wheelAngle) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  const idx = Math.floor(rel / SLICE) % SEQ.length;
  const num = SEQ[idx];
  const color = num === 0 ? 'green' : RED_SET.has(num) ? 'red' : 'black';

  clearAll();
  drawWheel();
  drawBall();

  resultEl.innerHTML = `Result: <span style="text-shadow:0 0 10px gold;">${num} (${color})</span>`;
  spinning = false;
  spinBtn.disabled = false;
}

// ========== Init ==========
spinBtn.addEventListener('click', spin);
clearAll(); drawWheel(); drawBall();
