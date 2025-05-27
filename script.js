// Grab elements
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');
const ballEl = document.getElementById('ball');
const audio = document.getElementById('spin-audio');

// Canvas & constants
const SIZE = 500;
const DPR = window.devicePixelRatio || 1;
canvas.width = SIZE * DPR;
canvas.height = SIZE * DPR;
canvas.style.width = SIZE + 'px';
canvas.style.height = SIZE + 'px';
ctx.scale(DPR, DPR);

const CENTER = SIZE / 2;
const RADIUS = CENTER - 20;
const POCKET_RAD = RADIUS - 10;
const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const SLICE = (2 * Math.PI) / SEQ.length;
const FIXED_SPIN = 5000; // 5 seconds exactly

// State
let wheelAng = 0, wheelVel = 0;
let ballAng = 0, ballVel = 0, ballRad = POCKET_RAD;
let spinning = false;

// Draw the wheel
function drawWheel() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(wheelAng);
    SEQ.forEach((n,i) => {
      const start = i * SLICE;
      // pocket fill
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,RADIUS,start,start+SLICE);
      ctx.fillStyle = n === 0 ? '#006600' : REDS.has(n) ? '#cc0000' : '#111';
      ctx.fill();
      // pocket border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(RADIUS * Math.cos(start), RADIUS * Math.sin(start));
      ctx.lineTo((RADIUS-15) * Math.cos(start), (RADIUS-15) * Math.sin(start));
      ctx.stroke();
      // number
      ctx.save();
        ctx.rotate(start + SLICE/2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(RADIUS*0.07)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(n, RADIUS - 20, 8);
      ctx.restore();
    });
  ctx.restore();
  // bullseye
  ctx.save(); ctx.translate(CENTER, CENTER);
    ctx.beginPath(); ctx.arc(0,0,20,0,2*Math.PI);
    ctx.fillStyle = '#222'; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,12,0,2*Math.PI);
    ctx.fillStyle = 'gold'; ctx.fill();
  ctx.restore();
}

// Position ball DOM element
function updateBall() {
  const x = CENTER + ballRad * Math.cos(ballAng) - 9;
  const y = CENTER + ballRad * Math.sin(ballAng) - 9;
  ballEl.style.transform = `translate(${x}px, ${y}px)`;
}

// Spin logic with fixed duration
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.style.opacity = 0;
  audio.currentTime = 0;
  audio.play();

  wheelVel = 0.8 + Math.random() * 0.4;
  ballVel = -wheelVel * (RADIUS / ballRad) * 1.3;
  ballRad = RADIUS - 5;
  ballAng = Math.random() * 2 * Math.PI;

  const start = performance.now();
  let last = start;

  function frame(now) {
    const dt = now - last;
    last = now;
    const elapsed = now - start;
    // uniform decay until fixed time, then drop
    const decay = 0.996;
    wheelVel *= decay ** (dt/16);
    ballVel *= decay ** (dt/16);
    if (elapsed >= FIXED_SPIN) {
      ballRad += (POCKET_RAD - ballRad) * 0.05;
    }

    wheelAng += wheelVel * (dt/16);
    ballAng += ballVel * (dt/16);

    drawWheel();
    updateBall();

    if (elapsed < FIXED_SPIN || Math.abs(ballVel) > 0.002) {
      requestAnimationFrame(frame);
    } else {
      audio.pause();
      snapAndFinalize();
    }
  }

  requestAnimationFrame(frame);
}

// Snap ball to exact pocket
function snapAndFinalize() {
  const rel = ((ballAng - wheelAng) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  const idx = Math.floor(rel / SLICE) % SEQ.length;
  const centerAng = idx * SLICE + SLICE/2;
  const target = wheelAng + centerAng;
  const startAng = ballAng;
  const delta = target - ballAng;
  const duration = 400;
  const t0 = performance.now();

  function snap(now) {
    const p = Math.min((now - t0)/duration, 1);
    ballAng = startAng + delta * (1 - Math.pow(1 - p, 2));
    updateBall();
    if (p < 1) requestAnimationFrame(snap);
    else showResult(idx);
  }

  requestAnimationFrame(snap);
}

// Show result
function showResult(idx) {
  const num = SEQ[idx];
  const color = num === 0 ? 'green' : REDS.has(num) ? 'red' : 'black';
  resultEl.innerHTML = `Result: <span style="color:${color}; text-shadow:0 0 12px ${color};">${num.toString().padStart(2,'0')} (${color})</span>`;
  resultEl.style.animation = 'fadeIn 1s forwards';
  spinning = false;
  spinBtn.disabled = false;
}

// Init
spinBtn.addEventListener('click', spin);
drawWheel();
updateBall();
