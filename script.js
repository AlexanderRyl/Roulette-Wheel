// Elements & Context Setup
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');

// Canvas sizing for high-DPI
const SIZE = 500;
const DPR = window.devicePixelRatio || 1;
canvas.width = SIZE * DPR;
canvas.height = SIZE * DPR;
canvas.style.width = '100%';
canvas.style.height = '100%';
ctx.scale(DPR, DPR);

// Constants
const CENTER = SIZE / 2;
const RADIUS = CENTER - 20;
const POCKET_RAD = RADIUS - 10;
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_SET = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const SLICE = (2 * Math.PI) / SEQ.length;
const SPIN_TIME = 5000;

// State
let wheelAngle = 0;
let ballAngle = 0;
let wheelVel = 0;
let ballVel = 0;
let spinning = false;

// Draw Wheel
function drawWheel() {
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(wheelAngle);
  for (let i = 0; i < SEQ.length; i++) {
    const n = SEQ[i];
    const start = i * SLICE;
    // Segment
    ctx.beginPath();
    ctx.fillStyle = n === 0 ? '#088' : RED_SET.has(n) ? '#c00' : '#111';
    ctx.moveTo(0,0);
    ctx.arc(0,0,RADIUS,start,start + SLICE);
    ctx.fill();
    // Number
    ctx.save();
      ctx.rotate(start + SLICE/2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(RADIUS*0.08)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(n, RADIUS - 15, 8);
    ctx.restore();
  }
  ctx.restore();
}

// Draw Ball
function drawBall() {
  const x = CENTER + ballRad * Math.cos(ballAngle);
  const y = CENTER + ballRad * Math.sin(ballAngle);
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(x,y,8,0,2*Math.PI);
  ctx.fill();
}

// Clear
function clearAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Spin Logic
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '';

  // Initialize velocities
  wheelVel = 0.5 + Math.random()*0.3;
  ballVel = -wheelVel * (RADIUS/(RADIUS-5)) * 1.2;
  ballRad = RADIUS - 5;
  ballAngle = Math.random() * 2*Math.PI;

  const start = performance.now();
  let last = start;

  function animate(now) {
    const dt = now - last;
    last = now;
    const elapsed = now - start;

    // Slow down until SPIN_TIME, then drop
    const decay = elapsed < SPIN_TIME ? 0.995 : 0.98;
    wheelVel *= decay**(dt/16);
    ballVel *= decay**(dt/16);
    if (elapsed >= SPIN_TIME) ballRad += (POCKET_RAD - ballRad)*0.05;

    // Update angles
    wheelAngle += wheelVel*(dt/16);
    ballAngle += ballVel*(dt/16);

    clearAll();
    drawWheel();
    drawBall();

    if (elapsed < SPIN_TIME || Math.abs(ballVel) > 0.001) {
      requestAnimationFrame(animate);
    } else {
      finalize();
    }
  }
  requestAnimationFrame(animate);
}

// Finalize
function finalize() {
  // Determine winning pocket
  const rel = ((ballAngle - wheelAngle)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  const idx = Math.floor(rel/SLICE)%SEQ.length;
  const num = SEQ[idx];
  const color = num===0? 'green' : RED_SET.has(num)? 'red' : 'black';

  resultEl.innerHTML = `Result: <span style="text-shadow:0 0 10px gold;">${num} (${color})</span>`;
  spinning = false;
  spinBtn.disabled = false;
}

// Event Listener & Init
spinBtn.addEventListener('click', spin);
clearAll();
drawWheel();
// Position ball initially
ballRad = RADIUS - 5;
ballAngle = 0;
drawBall();
