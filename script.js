const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const controls = {
  angle: document.getElementById("angleControl"),
  power: document.getElementById("powerControl"),
  gravity: document.getElementById("gravityControl"),
  wind: document.getElementById("windControl"),
  preview: document.getElementById("previewToggle")
};

const labels = {
  angle: document.getElementById("angleValue"),
  power: document.getElementById("powerValue"),
  gravity: document.getElementById("gravityValue"),
  wind: document.getElementById("windValue")
};

const playerNameInput = document.getElementById("playerName");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const modeDescription = document.getElementById("modeDescription");
const restrictionText = document.getElementById("restrictionText");

const scoreValue = document.getElementById("scoreValue");
const shotsValue = document.getElementById("shotsValue");
const streakValue = document.getElementById("streakValue");
const bestStreakValue = document.getElementById("bestStreakValue");
const externalText = document.getElementById("externalText");
const statusText = document.getElementById("statusText");

const rim = { x: 814, y: 228, radius: 11 };
const rim2 = { x: 862, y: 228, radius: 11 };
const backboard = { x: 884, y: 145, w: 10, h: 120 };
const floorY = 490;
const hoopY = rim.y;
const hoopX = (rim.x + rim2.x) * 0.5;

const player = { x: 132, y: floorY - 145 };

const ball = {
  x: player.x + 26,
  y: player.y - 13,
  vx: 0,
  vy: 0,
  spin: 0,
  radius: 12,
  inFlight: false,
  scored: false,
  processed: false,
  out: false
};

const game = {
  mode: "easy",
  score: 0,
  shots: 0,
  streak: 0,
  bestStreak: 0,
  time: 0
};

const modes = {
  easy: {
    label: "Easy",
    description: "Most shots are makeable. Restriction: power must be at least 42.",
    rimTolerance: 18,
    angleJitter: 0.4,
    windJitter: 1.2,
    gravityJitter: 0.2,
    assist: 0.26,
    restriction: {
      name: "Power floor",
      generate: () => ({ minPower: 42 }),
      text: (r) => `Restriction: Keep power >= ${r.minPower}.`,
      pass: (shot, r) => shot.power >= r.minPower
    }
  },
  medium: {
    label: "Medium",
    description: "Slightly harder, still fair. Restriction: your angle must be inside a random zone.",
    rimTolerance: 11,
    angleJitter: 1.3,
    windJitter: 2.5,
    gravityJitter: 0.45,
    assist: 0.12,
    restriction: {
      name: "Angle zone",
      generate: () => {
        const min = Math.round(40 + Math.random() * 10);
        return { min, max: min + 16 };
      },
      text: (r) => `Restriction: Angle must stay between ${r.min}° and ${r.max}°.`,
      pass: (shot, r) => shot.angle >= r.min && shot.angle <= r.max
    }
  },
  hard: {
    label: "Hard",
    description: "Hardest but still possible. Restriction: angle must stay in a tighter random zone.",
    rimTolerance: 7,
    angleJitter: 2.1,
    windJitter: 4.2,
    gravityJitter: 0.75,
    assist: 0.04,
    restriction: {
      name: "Tight angle zone",
      generate: () => {
        const min = Math.round(46 + Math.random() * 8);
        return { min, max: min + 10 };
      },
      text: (r) => `Restriction: Angle must stay between ${r.min}° and ${r.max}°.`,
      pass: (shot, r) => shot.angle >= r.min && shot.angle <= r.max
    }
  }
};

const liveFactors = {
  wind: 0,
  gravity: 9.8,
  shotAngle: 50,
  shotPower: 58,
  banked: false
};

let activeRestriction = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function setStatus(text, state = "normal") {
  statusText.textContent = text;
  if (state === "good") statusText.style.color = "#75efc2";
  else if (state === "bad") statusText.style.color = "#ffacac";
  else statusText.style.color = "#ffd8a0";
}

function setMode(mode) {
  game.mode = mode;
  modeButtons.forEach((b) => b.classList.toggle("selected", b.dataset.mode === mode));
  modeDescription.textContent = modes[mode].description;
  prepareRestriction();
  setStatus(`${modes[mode].label} mode selected.`, "normal");
}

function prepareRestriction() {
  const profile = modes[game.mode];
  activeRestriction = profile.restriction.generate();
  restrictionText.textContent = profile.restriction.text(activeRestriction);
}

function updateLabels() {
  labels.angle.textContent = `${controls.angle.value}°`;
  labels.power.textContent = controls.power.value;
  labels.gravity.textContent = `${Number(controls.gravity.value).toFixed(1)} m/s²`;
  labels.wind.textContent = Number(controls.wind.value).toFixed(1);
}

function updateScoreboard() {
  scoreValue.textContent = String(game.score);
  shotsValue.textContent = String(game.shots);
  streakValue.textContent = String(game.streak);
  bestStreakValue.textContent = String(game.bestStreak);
}

function resetBall() {
  ball.x = player.x + 26;
  ball.y = player.y - 13;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.inFlight = false;
  ball.scored = false;
  ball.processed = false;
  ball.out = false;
  liveFactors.banked = false;
}

function launchShot() {
  if (ball.inFlight) return;

  const profile = modes[game.mode];
  const angle = Number(controls.angle.value);
  const power = Number(controls.power.value);

  liveFactors.shotAngle = angle;
  liveFactors.shotPower = power;
  liveFactors.wind = Number(controls.wind.value) + randomBetween(-profile.windJitter, profile.windJitter);
  liveFactors.gravity = Number(controls.gravity.value) + randomBetween(-profile.gravityJitter, profile.gravityJitter);
  liveFactors.banked = false;

  const launchAngle = (angle + randomBetween(-profile.angleJitter, profile.angleJitter)) * (Math.PI / 180);
  const launchPower = Math.max(25, power);
  const speed = launchPower * 4.05;

  ball.vx = Math.cos(launchAngle) * speed;
  ball.vy = -Math.sin(launchAngle) * speed;
  ball.spin = randomBetween(-0.35, 0.35);
  ball.inFlight = true;
  ball.scored = false;
  ball.processed = false;
  ball.out = false;

  const targetVx = (hoopX - ball.x) / 2.25;
  ball.vx = ball.vx * (1 - profile.assist) + targetVx * profile.assist;

  game.shots += 1;
  setStatus("Shot launched.", "normal");
}

function resolveShotIfNeeded(made) {
  if (ball.processed) return;
  ball.processed = true;

  if (!made) {
    game.streak = 0;
    setStatus("Missed shot. Adjust angle, power, or physics sliders.", "bad");
    prepareRestriction();
    return;
  }

  const profile = modes[game.mode];
  const passed = profile.restriction.pass(
    { angle: liveFactors.shotAngle, power: liveFactors.shotPower, banked: liveFactors.banked },
    activeRestriction
  );

  if (!passed) {
    game.streak = 0;
    setStatus("Made the basket, but failed the mode restriction (no points).", "bad");
    prepareRestriction();
    return;
  }

  const points = liveFactors.banked ? 80 : 60;
  game.score += points;
  game.streak += 1;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  if (game.streak >= 3) game.score += 20;

  const playerName = playerNameInput.value.trim() || "Guest";
  setStatus(`${playerName} scored! +${points}`, "good");
  prepareRestriction();
}

function collideRim(r) {
  const dx = ball.x - r.x;
  const dy = ball.y - r.y;
  const distance = Math.hypot(dx, dy);
  const minDist = ball.radius + r.radius;
  if (distance >= minDist) return;

  const nx = dx / (distance || 1);
  const ny = dy / (distance || 1);
  const overlap = minDist - distance;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const rel = ball.vx * nx + ball.vy * ny;
  if (rel < 0) {
    const bounce = 0.72;
    ball.vx -= (1 + bounce) * rel * nx;
    ball.vy -= (1 + bounce) * rel * ny;
  }
}

function physicsStep(dt) {
  if (!ball.inFlight) return;

  const wind = liveFactors.wind * 8;
  const gravity = liveFactors.gravity * 75;
  const drag = 0.012;
  const speed = Math.hypot(ball.vx, ball.vy);
  const ax = wind - drag * ball.vx * speed;
  const ay = gravity - drag * ball.vy * speed;

  ball.vx += ax * dt;
  ball.vy += ay * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  externalText.textContent = `External factors: wind ${liveFactors.wind.toFixed(1)}, gravity ${liveFactors.gravity.toFixed(1)} m/s²`;

  if (ball.y + ball.radius > floorY) {
    ball.y = floorY - ball.radius;
    if (Math.abs(ball.vy) > 24) {
      ball.vy *= -0.62;
      ball.vx *= 0.86;
    } else {
      ball.vy = 0;
      ball.vx *= 0.9;
      if (Math.abs(ball.vx) < 8) ball.vx = 0;
    }
  }

  if (
    ball.x + ball.radius > backboard.x &&
    ball.x - ball.radius < backboard.x + backboard.w &&
    ball.y + ball.radius > backboard.y &&
    ball.y - ball.radius < backboard.y + backboard.h &&
    ball.vx > 0
  ) {
    ball.x = backboard.x - ball.radius;
    ball.vx *= -0.78;
    liveFactors.banked = true;
  }

  collideRim(rim);
  collideRim(rim2);

  const tolerance = modes[game.mode].rimTolerance;
  const made =
    !ball.scored &&
    ball.vy > 16 &&
    ball.x > rim.x - tolerance &&
    ball.x < rim2.x + tolerance &&
    ball.y > hoopY - 14 &&
    ball.y < hoopY + 21;

  if (made) {
    ball.scored = true;
    resolveShotIfNeeded(true);
  }

  const out = ball.x > canvas.width + 70 || ball.x < -70 || ball.y > canvas.height + 90;
  if (out && !ball.out) {
    ball.out = true;
    resolveShotIfNeeded(false);
  }

  if (ball.out || (Math.abs(ball.vx) < 1 && Math.abs(ball.vy) < 1 && ball.y >= floorY - ball.radius)) {
    if (!ball.scored) resolveShotIfNeeded(false);
    resetBall();
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#182649");
  grad.addColorStop(1, "#081022");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#13203c";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
  ctx.strokeStyle = "#284677";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();
}

function drawCourt() {
  ctx.strokeStyle = "#7ea5ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(740, floorY, 160, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#dfebff";
  ctx.fillRect(backboard.x, backboard.y, backboard.w, backboard.h);

  ctx.strokeStyle = "#ff7d61";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rim.x, rim.y);
  ctx.lineTo(rim2.x, rim2.y);
  ctx.stroke();
}

function drawPlayer() {
  ctx.fillStyle = "#2b3a63";
  ctx.fillRect(player.x - 42, floorY - 120, 56, 104);

  ctx.fillStyle = "#ffd0a0";
  ctx.beginPath();
  ctx.arc(player.x - 16, floorY - 138, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffd0a0";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(player.x + 3, floorY - 95);
  ctx.lineTo(player.x + 23, floorY - 116);
  ctx.stroke();
}

function drawPreview() {
  if (!controls.preview.checked || ball.inFlight) return;

  let px = player.x + 26;
  let py = player.y - 13;
  const angle = Number(controls.angle.value) * (Math.PI / 180);
  const power = Number(controls.power.value);
  let vx = Math.cos(angle) * power * 4.05;
  let vy = -Math.sin(angle) * power * 4.05;
  const wind = Number(controls.wind.value) * 8;
  const g = Number(controls.gravity.value) * 75;
  const drag = 0.012;

  ctx.fillStyle = "rgba(128, 234, 196, 0.7)";
  for (let i = 0; i < 110; i += 1) {
    const speed = Math.hypot(vx, vy);
    vx += (wind - drag * vx * speed) * 0.016;
    vy += (g - drag * vy * speed) * 0.016;
    px += vx * 0.016;
    py += vy * 0.016;

    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (py > floorY || px > canvas.width || px < 0) break;
  }
}

function drawBall() {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(game.time * 7);
  ctx.fillStyle = "#f69033";
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5e2d07";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius - 1.6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius - 1.6, Math.PI + 0.2, Math.PI * 2 - 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawWindArrow() {
  const wind = ball.inFlight ? liveFactors.wind : Number(controls.wind.value);
  const dir = wind >= 0 ? 1 : -1;
  const strength = Math.abs(wind);
  const baseX = 92;
  const baseY = 48;

  ctx.fillStyle = "#dcebff";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Wind ${wind.toFixed(1)}`, baseX, baseY - 12);

  ctx.strokeStyle = strength > 7 ? "#ffb06d" : "#95d0ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX + dir * (20 + strength * 3), baseY);
  ctx.stroke();
}

function draw() {
  drawBackground();
  drawCourt();
  drawPlayer();
  drawPreview();
  drawBall();
  drawWindArrow();
}

function tick() {
  game.time += 0.016;
  physicsStep(0.016);
  updateScoreboard();
  draw();
  requestAnimationFrame(tick);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.getElementById("shootBtn").addEventListener("click", launchShot);
document.getElementById("resetBtn").addEventListener("click", () => {
  resetBall();
  setStatus("Ball reset.", "normal");
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    launchShot();
  }
});

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateLabels);
});

updateLabels();
setMode("easy");
updateScoreboard();
tick();
