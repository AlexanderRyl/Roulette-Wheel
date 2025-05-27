// Get references to DOM elements
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const numberDisplay = document.getElementById('numberDisplay');
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');

// Wheel configuration
const numbers = [
  "0","28","9","26","30","11","7","20","32","17",
  "5","22","34","15","3","24","36","13","1","00",
  "27","10","25","29","12","8","19","31","18","6",
  "21","33","16","4","23","35","14","2"
]; // standard American wheel order:contentReference[oaicite:9]{index=9}

// Define colors for pockets
const greenNumbers = new Set(["0", "00"]);
const redNumbers = new Set([
  "1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"
]);
// The rest of the numbers are black (even numbers not in red list):contentReference[oaicite:10]{index=10}.
function pocketColor(num) {
  if (greenNumbers.has(num)) return "#008000"; // green
  return redNumbers.has(num) ? "#B22222" : "#000000"; // red or black
}

// Draw the roulette wheel (with given rotation offset)
function drawWheel(rotation = 0) {
  const cw = canvas.width;
  const ch = canvas.height;
  const cx = cw / 2;
  const cy = ch / 2;
  const outerRadius = Math.min(cx, cy) - 5; // leave a small margin
  const innerRadius = outerRadius * 0.6; // inner circle radius
  const centerRadius = outerRadius * 0.15; // center hub radius
  const fontSize = Math.round(outerRadius * 0.07);

  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(cx, cy);

  // Compute arc size for each of 38 pockets
  const pocketCount = numbers.length;
  const arc = 2 * Math.PI / pocketCount;
  // Offset so that "0" is centered at top (12 o'clock)
  const baseOffset = -Math.PI/2 - arc/2; 

  // Draw each segment
  for (let i = 0; i < pocketCount; i++) {
    const startAngle = baseOffset + i * arc + rotation;
    const endAngle = startAngle + arc;

    // Draw colored segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = pocketColor(numbers[i]);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";
    ctx.stroke();

    // Draw the number label
    ctx.save();
    // Position text at middle of segment, oriented outward
    const textAngle = startAngle + arc/2;
    ctx.rotate(textAngle + Math.PI/2);
    ctx.fillStyle = "#FFFFFF"; // white text for visibility
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Place text near outer edge
    ctx.fillText(numbers[i], (outerRadius * 0.85), 0);
    ctx.restore();
  }

  // Draw inner circle (as decorative center)
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, 2*Math.PI);
  ctx.fillStyle = "#8B4513"; // brown/gold for inner circle
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#DAA520";
  ctx.stroke();

  // Draw center hub
  ctx.beginPath();
  ctx.arc(0, 0, centerRadius, 0, 2*Math.PI);
  ctx.fillStyle = "#DAA520"; 
  ctx.fill();
  ctx.restore();
}

// Ease-out function for smooth deceleration
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Spin animation: from startAngle to endAngle over given duration
function animateSpin(startAngle, endAngle, duration, callback) {
  const startTime = performance.now();
  function frame(now) {
    const elapsed = now - startTime;
    if (elapsed < duration) {
      const t = easeOut(elapsed / duration);
      const currentAngle = startAngle + (endAngle - startAngle) * t;
      drawWheel(currentAngle);
      requestAnimationFrame(frame);
    } else {
      // Final frame
      drawWheel(endAngle);
      if (callback) callback();
    }
  }
  requestAnimationFrame(frame);
}

// Spin logic: random result on click
let spinning = false;
canvas.addEventListener('click', () => {
  if (spinning) return; // ignore if already spinning
  spinning = true;
  numberDisplay.textContent = ""; // clear previous result

  // Play spin sound
  spinSound.currentTime = 0;
  spinSound.play();

  // Pick a random pocket index
  const pocketCount = numbers.length;
  const randomIndex = Math.floor(Math.random() * pocketCount);
  // Compute target rotation: we want the chosen number at the pointer (12 o'clock).
  // With our offset, rotation = -index * arc (plus full rotations).
  const arc = 2 * Math.PI / pocketCount;
  const extraSpins = 3 + Math.floor(Math.random() * 3); // 3–5 full turns
  const targetRotation = (-randomIndex * arc) + (2 * Math.PI * extraSpins);

  // Animate from 0 to targetRotation over 4 seconds (4000 ms)
  animateSpin(0, targetRotation, 4000, () => {
    // After animation completes:
    const result = numbers[randomIndex];
    numberDisplay.textContent = "Result: " + result;
    // Play win sound
    winSound.currentTime = 0;
    winSound.play();
    spinning = false;
  });
});

// Initial draw
drawWheel(0);
