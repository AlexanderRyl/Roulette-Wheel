// Get elements
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');
const ballEl = document.getElementById('ball');

// Constants & high-DPI setup
const SIZE = 480;
const DPR = window.devicePixelRatio || 1;
canvas.width = SIZE * DPR;
canvas.height = SIZE * DPR;
canvas.style.width = `${SIZE}px`;
canvas.style.height = `${SIZE}px`;
ctx.scale(DPR, DPR);

const CENTER = SIZE/2;
const RADIUS = CENTER - 20;
const POCKET_RAD = RADIUS - 10;
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const SLICE = 2*Math.PI/SEQ.length;
const SPIN_TIME = 5500;

// State
let wheelAng = 0, wheelVel = 0;
let ballAng = 0, ballVel = 0, ballRad = POCKET_RAD;
let spinning = false;

// Draw the wheel with separators & glow
function drawWheel() {
  ctx.clearRect(0,0,SIZE,SIZE);
  ctx.save();
    ctx.translate(CENTER,CENTER);
    ctx.rotate(wheelAng);
    for (let i=0; i<SEQ.length; i++) {
      const n = SEQ[i];
      const start = i*SLICE;
      // Fill segment
      ctx.beginPath();
      ctx.fillStyle = n===0 ? '#0a550a' : REDS.has(n) ? '#e20c0c' : '#222';
      ctx.moveTo(0,0);
      ctx.arc(0,0,RADIUS,start,start+SLICE);
      ctx.fill();
      // Separator line
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(RADIUS*Math.cos(start), RADIUS*Math.sin(start));
      ctx.lineTo((RADIUS-20)*Math.cos(start), (RADIUS-20)*Math.sin(start));
      ctx.stroke();
      // Number label
      ctx.save();
        ctx.rotate(start + SLICE/2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(RADIUS*0.07)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(n, RADIUS-25, 8);
      ctx.restore();
    }
  ctx.restore();
}

// Position ball DOM element
function updateBall() {
  const x = CENTER + ballRad*Math.cos(ballAng) - 8;
  const y = CENTER + ballRad*Math.sin(ballAng) - 8;
  ballEl.style.transform = `translate(${x}px, ${y}px)`;
}

// Spin animation
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.style.opacity = 0;

  wheelVel = 0.6 + Math.random()*0.4;
  ballVel = -wheelVel * (RADIUS/ballRad) * 1.3;
  ballAng = Math.random()*2*Math.PI;
  ballRad = RADIUS - 5;

  const start = performance.now();
  let last = start;

  function frame(now) {
    const dt = now - last;
    last = now;
    const elapsed = now - start;
    const decay = elapsed < SPIN_TIME ? 0.996 : 0.985;
    wheelVel *= decay**(dt/16);
    ballVel *= decay**(dt/16);
    if (elapsed >= SPIN_TIME) ballRad += (POCKET_RAD - ballRad)*0.06;

    wheelAng += wheelVel*(dt/16);
    ballAng += ballVel*(dt/16);

    drawWheel();
    updateBall();

    if (elapsed < SPIN_TIME || Math.abs(ballVel)>0.002) {
      requestAnimationFrame(frame);
    } else {
      snapAndFinalize();
    }
  }
  requestAnimationFrame(frame);
}

// Snap ball into exact pocket center and show result
function snapAndFinalize() {
  // Calculate pocket index
  const rel = ((ballAng - wheelAng)%(2*Math.PI) + 2*Math.PI)%(2*Math.PI);
  const idx = Math.floor(rel/SLICE) % SEQ.length;
  const centerAng = idx*SLICE + SLICE/2;
  const targetBallAng = wheelAng + centerAng;

  // Animate snapping
  const startAng = ballAng;
  const delta = targetBallAng - ballAng;
  const duration = 400;
  const t0 = performance.now();

  function snap(now) {
    const p = Math.min((now - t0)/duration, 1);
    ballAng = startAng + delta * easeOutQuad(p);
    updateBall();
    if (p < 1) requestAnimationFrame(snap);
    else showResult(idx);
  }
  requestAnimationFrame(snap);
}

// Easing
function easeOutQuad(t) {
  return t*(2-t);
}

// Display final result
function showResult(idx) {
  const num = SEQ[idx];
  const clr = num===0? 'green' : REDS.has(num)? 'red' : 'black';
  resultEl.innerHTML = `Result: <span style="color:${clr}; text-shadow:0 0 14px ${clr};">${num.toString().padStart(2,'0')} (${clr})</span>`;
  resultEl.style.animation = 'resultFade 1s ease forwards';
  spinning = false;
  spinBtn.disabled = false;
}

// Init
spinBtn.addEventListener('click', spin);
drawWheel();
updateBall();
