const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const controls = {
  angle: document.getElementById("angleControl"),
  power: document.getElementById("powerControl"),
  gravity: document.getElementById("gravityControl"),
  wind: document.getElementById("windControl"),
  drag: document.getElementById("dragControl"),
  spin: document.getElementById("spinControl"),
  preview: document.getElementById("previewToggle")
};

const labels = {
  angle: document.getElementById("angleValue"),
  power: document.getElementById("powerValue"),
  gravity: document.getElementById("gravityValue"),
  wind: document.getElementById("windValue"),
  drag: document.getElementById("dragValue"),
  spin: document.getElementById("spinValue")
};

const scoreValue = document.getElementById("scoreValue");
const shotsValue = document.getElementById("shotsValue");
const streakValue = document.getElementById("streakValue");
const bestStreakValue = document.getElementById("bestStreakValue");
const statusText = document.getElementById("statusText");
const modeRuleText = document.getElementById("modeRuleText");
const shotCommandText = document.getElementById("shotCommandText");
const externalText = document.getElementById("externalText");
const playerDisplay = document.getElementById("playerDisplay");
const modeDisplay = document.getElementById("modeDisplay");

const entryOverlay = document.getElementById("entryOverlay");
const playerNameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");
const modeButtons = Array.from(document.querySelectorAll(".mode-card"));

const rim = { x: 814, y: 228, radius: 11 };
const rim2 = { x: 862, y: 228, radius: 11 };
const backboard = { x: 884, y: 145, w: 10, h: 120 };
const floorY = 490;
const hoopY = rim.y;
const hoopCenterX = (rim.x + rim2.x) * 0.5;

const player = { x: 132, y: floorY - 145 };

const ball = {
  x: player.x + 26,
  y: player.y - 13,
  vx: 0,
  vy: 0,
  radius: 12,
  spin: 0,
  inFlight: false,
  scoredThisShot: false,
  resultProcessed: false,
  outOfBounds: false
};

const game = {
  score: 0,
  shots: 0,
  streak: 0,
  bestStreak: 0,
  time: 0,
  started: false,
  playerName: "Guest",
  mode: "easy"
};

const modeProfiles = {
  easy: {
    label: "Easy Mode",
    description: "Assist enabled: bigger make window, tiny launch drift, softer weather.",
    rimTolerance: 17,
    angleJitter: 0.8,
    powerJitter: 1.8,
    windVariance: 2,
    gravityVariance: 0.3,
    turbulence: 2,
    dragScale: 0.9,
    scoreMultiplier: 1
  },
  medium: {
    label: "Medium Mode",
    description: "Random shot commands, moderate launch drift, active wind and gravity shifts.",
    rimTolerance: 8,
    angleJitter: 3.8,
    powerJitter: 4,
    windVariance: 6,
    gravityVariance: 0.8,
    turbulence: 8,
    dragScale: 1.05,
    scoreMultiplier: 1.35
  },
  hard: {
    label: "Hard Mode",
    description: "Strict command checks, narrow make window, high turbulence and shot disruption.",
    rimTolerance: 2,
    angleJitter: 7,
    powerJitter: 6,
    windVariance: 11,
    gravityVariance: 1.5,
    turbulence: 15,
    dragScale: 1.2,
    scoreMultiplier: 1.8
  }
};

const shotCommands = [
  {
    id: "arc-master",
    text: "Command: Arc Master (launch angle must be 55° to 74°).",
    test: (shot) => shot.angleInput >= 55 && shot.angleInput <= 74
  },
  {
    id: "power-window",
    text: "Command: Power Window (power must be 46 to 64).",
    test: (shot) => shot.powerInput >= 46 && shot.powerInput <= 64
  },
  {
    id: "no-spin",
    text: "Command: No Spin (spin between -2 and 2).",
    test: (shot) => Math.abs(shot.spinInput) <= 2
  },
  {
    id: "bank-only",
    text: "Command: Bank Shot Only (must hit backboard before scoring).",
    test: (shot) => shot.banked === true
  },
  {
    id: "headwind",
    text: "Command: Ride The Wind (shoot while wind indicator is not calm).",
    test: (shot) => Math.abs(shot.appliedWind) >= 2
  }
];

const modeCommandIndexes = {
  easy: [],
  medium: [0, 1, 2, 4],
  hard: [0, 1, 2, 3, 4]
};

const shotFactors = {
  appliedWind: 0,
  appliedGravity: 0,
  angleInput: 0,
  powerInput: 0,
  spinInput: 0,
  banked: false
};

let selectedMode = "easy";
let currentCommand = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function updateLabelValues() {
  labels.angle.textContent = `${controls.angle.value}°`;
  labels.power.textContent = `${controls.power.value}`;
  labels.gravity.textContent = `${Number(controls.gravity.value).toFixed(1)} m/s²`;
  labels.wind.textContent = `${Number(controls.wind.value).toFixed(1)}`;
  labels.drag.textContent = Number(controls.drag.value).toFixed(3);
  labels.spin.textContent = controls.spin.value;
}

function setStatus(message, good = false, bad = false) {
  statusText.textContent = message;
  statusText.style.color = good ? "#7ef8c6" : bad ? "#ff9b9b" : "#fed29c";
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
  ball.inFlight = false;
  ball.scoredThisShot = false;
  ball.resultProcessed = false;
  ball.outOfBounds = false;
  shotFactors.banked = false;
}

function getProfile() {
  return modeProfiles[game.mode];
}

function applyModeCardSelection() {
  modeButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.mode === selectedMode);
  });
}

function pickShotCommand() {
  const pool = modeCommandIndexes[game.mode];
  if (!pool.length) {
    currentCommand = null;
    shotCommandText.textContent = "Easy command feed: no restrictions. Just shoot and score.";
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  currentCommand = shotCommands[pick];
  shotCommandText.textContent = currentCommand.text;
}

function updateModeTexts() {
  const profile = getProfile();
  modeDisplay.textContent = profile.label;
  modeRuleText.textContent = profile.description;
}

function startSession() {
  const cleanName = playerNameInput.value.trim();
  game.playerName = cleanName || "Guest";
  game.mode = selectedMode;
  game.started = true;
  game.score = 0;
  game.shots = 0;
  game.streak = 0;
  game.bestStreak = 0;
  playerDisplay.textContent = game.playerName;
  updateModeTexts();
  pickShotCommand();
  updateScoreboard();
  resetBall();
  entryOverlay.classList.add("hidden");
  setStatus(`Welcome ${game.playerName}. ${modeProfiles[game.mode].label} is live.`, false, false);
}

function evaluateCommand() {
  if (game.mode === "easy" || !currentCommand) return true;
  return currentCommand.test(shotFactors);
}

function scoreShot() {
  const profile = getProfile();
  const commandPass = evaluateCommand();
  if (!commandPass) {
    game.streak = 0;
    setStatus("Shot entered the hoop, but command failed. No points this shot.", false, true);
    return;
  }

  const base = shotFactors.banked ? 90 : 70;
  const modeBoost = Math.round(base * profile.scoreMultiplier);
  game.score += modeBoost;
  game.streak += 1;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  if (game.streak >= 3) {
    game.score += Math.round(18 * profile.scoreMultiplier);
  }
  setStatus(
    `${shotFactors.banked ? "Bank shot" : "Clean bucket"}! +${modeBoost} (${profile.label})`,
    true,
    false
  );
}

function registerMiss(message) {
  game.streak = 0;
  setStatus(message, false, true);
}

function launchShot() {
  if (!game.started) {
    setStatus("Pick your name and mode first.", false, true);
    return;
  }
  if (ball.inFlight) return;

  const profile = getProfile();
  const angleInput = Number(controls.angle.value);
  const powerInput = Number(controls.power.value);
  const spinInput = Number(controls.spin.value);

  const angleWithNoise = angleInput + randomBetween(-profile.angleJitter, profile.angleJitter);
  const powerWithNoise = powerInput + randomBetween(-profile.powerJitter, profile.powerJitter);
  const angle = angleWithNoise * (Math.PI / 180);
  const speed = Math.max(20, powerWithNoise) * 4.05;

  ball.vx = Math.cos(angle) * speed;
  ball.vy = -Math.sin(angle) * speed;
  ball.spin = spinInput * 0.1;
  ball.inFlight = true;
  ball.scoredThisShot = false;
  ball.resultProcessed = false;
  ball.outOfBounds = false;

  if (game.mode === "easy") {
    const idealVx = (hoopCenterX - ball.x) / 2.2;
    ball.vx = ball.vx * 0.72 + idealVx * 0.28;
  }

  shotFactors.appliedWind = Number(controls.wind.value) + randomBetween(-profile.windVariance, profile.windVariance);
  shotFactors.appliedGravity =
    Number(controls.gravity.value) + randomBetween(-profile.gravityVariance, profile.gravityVariance);
  shotFactors.angleInput = angleInput;
  shotFactors.powerInput = powerInput;
  shotFactors.spinInput = spinInput;
  shotFactors.banked = false;

  game.shots += 1;
  setStatus("Ball launched with live physics modifiers...", false, false);
}

function collideWithRim(r) {
  const dx = ball.x - r.x;
  const dy = ball.y - r.y;
  const distance = Math.hypot(dx, dy);
  const minDist = ball.radius + r.radius;
  if (distance < minDist) {
    const nx = dx / (distance || 1);
    const ny = dy / (distance || 1);
    const overlap = minDist - distance;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    const relVel = ball.vx * nx + ball.vy * ny;
    if (relVel < 0) {
      const restitution = 0.72;
      ball.vx -= (1 + restitution) * relVel * nx;
      ball.vy -= (1 + restitution) * relVel * ny;
      ball.vx += ball.spin * -ny * 1.1;
      ball.vy += ball.spin * nx * 1.1;
    }
  }
}

function nextCommandAfterShot() {
  if (game.mode !== "easy") {
    pickShotCommand();
  }
}

function physicsStep(dt) {
  if (!ball.inFlight) return;

  const profile = getProfile();
  const drag = Number(controls.drag.value) * profile.dragScale;
  const turbulence = Math.sin(game.time * 6.4) * profile.turbulence;
  const wind = shotFactors.appliedWind * 8 + turbulence;
  const g = shotFactors.appliedGravity * 75;
  externalText.textContent = `Live factors: wind ${shotFactors.appliedWind.toFixed(1)}, gravity ${shotFactors.appliedGravity.toFixed(1)} m/s²`;

  const speed = Math.hypot(ball.vx, ball.vy);
  const magnus = ball.spin * Math.max(0, speed) * 0.0018;
  const ax = wind - drag * ball.vx * speed + magnus * -ball.vy;
  const ay = g - drag * ball.vy * speed + magnus * ball.vx;

  ball.vx += ax * dt;
  ball.vy += ay * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.spin *= 0.998;

  if (ball.y + ball.radius > floorY) {
    ball.y = floorY - ball.radius;
    if (Math.abs(ball.vy) > 28) {
      ball.vy *= -0.62;
      ball.vx *= 0.84;
      ball.spin *= 0.8;
    } else {
      ball.vy = 0;
      ball.vx *= 0.88;
      if (Math.abs(ball.vx) < 10) ball.vx = 0;
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
    ball.vx *= -0.75;
    ball.spin += 0.75;
    shotFactors.banked = true;
  }

  collideWithRim(rim);
  collideWithRim(rim2);

  const tolerance = getProfile().rimTolerance;
  const wentThroughHoop =
    !ball.scoredThisShot &&
    ball.vy > 20 &&
    ball.x > rim.x - tolerance &&
    ball.x < rim2.x + tolerance &&
    ball.y > hoopY - (15 + tolerance * 0.15) &&
    ball.y < hoopY + (18 + tolerance * 0.2);

  if (wentThroughHoop && !ball.resultProcessed) {
    ball.scoredThisShot = true;
    ball.resultProcessed = true;
    scoreShot();
  }

  const out = ball.x > canvas.width + 70 || ball.x < -70 || ball.y > canvas.height + 90;
  if (out && !ball.outOfBounds) {
    ball.outOfBounds = true;
    if (!ball.resultProcessed) {
      ball.resultProcessed = true;
      registerMiss("Missed shot. Adjust launch angle, power, and mode factors.");
    }
  }

  if (ball.outOfBounds || (!ball.inFlight && ball.vx === 0 && ball.vy === 0)) {
    resetBall();
    nextCommandAfterShot();
  } else if (Math.abs(ball.vx) < 1 && Math.abs(ball.vy) < 1 && ball.y >= floorY - ball.radius) {
    if (!ball.resultProcessed) {
      ball.resultProcessed = true;
      registerMiss("Shot died out before scoring. Re-tune your setup.");
    }
    resetBall();
    nextCommandAfterShot();
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#15203e");
  grad.addColorStop(1, "#060a15");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4f5f88";
  for (let i = 0; i < 45; i += 1) {
    const x = (i * 81 + Math.sin(game.time * 0.4 + i) * 20) % canvas.width;
    const y = 40 + (i % 5) * 30;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#13203c";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
  ctx.strokeStyle = "#254074";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();
}

function drawCourt() {
  ctx.strokeStyle = "#7fa4ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(740, floorY, 160, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#d8e7ff";
  ctx.fillRect(backboard.x, backboard.y, backboard.w, backboard.h);

  ctx.strokeStyle = "#ff7a5f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rim.x, rim.y);
  ctx.lineTo(rim2.x, rim2.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(240,240,255,0.85)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) {
    const nx = rim.x + (i / 5) * (rim2.x - rim.x);
    ctx.beginPath();
    ctx.moveTo(nx, rim.y + 2);
    ctx.lineTo(nx + Math.sin(game.time * 2 + i) * 4, rim.y + 26);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.fillStyle = "#2a3963";
  ctx.fillRect(player.x - 42, floorY - 120, 56, 104);
  ctx.fillStyle = "#ffcf9c";
  ctx.beginPath();
  ctx.arc(player.x - 16, floorY - 138, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffcf9c";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(player.x + 3, floorY - 95);
  ctx.lineTo(player.x + 23, floorY - 116);
  ctx.stroke();
}

function drawTrajectoryPreview() {
  if (!controls.preview.checked || ball.inFlight) return;
  let px = player.x + 26;
  let py = player.y - 13;
  const angle = Number(controls.angle.value) * (Math.PI / 180);
  const power = Number(controls.power.value);
  let vx = Math.cos(angle) * power * 4.05;
  let vy = -Math.sin(angle) * power * 4.05;
  let spin = Number(controls.spin.value) * 0.1;
  const g = Number(controls.gravity.value) * 75;
  const drag = Number(controls.drag.value);
  const wind = Number(controls.wind.value) * 8;

  ctx.fillStyle = "rgba(125, 229, 192, 0.65)";
  for (let i = 0; i < 120; i += 1) {
    const speed = Math.hypot(vx, vy);
    const magnus = spin * Math.max(0, speed) * 0.0018;
    const ax = wind - drag * vx * speed + magnus * -vy;
    const ay = g - drag * vy * speed + magnus * vx;
    vx += ax * 0.016;
    vy += ay * 0.016;
    px += vx * 0.016;
    py += vy * 0.016;
    spin *= 0.998;
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
  ctx.rotate(game.time * 9 + ball.spin * 0.1);
  ctx.fillStyle = "#f48f31";
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5f2b06";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius - 1.8, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius - 1.8, Math.PI + 0.15, Math.PI * 2 - 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-ball.radius + 1.8, -2);
  ctx.quadraticCurveTo(0, 3.5, ball.radius - 1.8, -2);
  ctx.stroke();
  ctx.restore();
}

function drawWindIndicator() {
  const shownWind = ball.inFlight ? shotFactors.appliedWind : Number(controls.wind.value);
  const strength = Math.abs(shownWind);
  const dir = shownWind >= 0 ? 1 : -1;
  const baseX = 100;
  const baseY = 48;
  ctx.fillStyle = "#dce6ff";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Wind: ${shownWind.toFixed(1)}`, baseX, baseY - 10);
  ctx.strokeStyle = strength > 8 ? "#ffae6b" : "#91cffd";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX + dir * (20 + strength * 3), baseY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(baseX + dir * (20 + strength * 3), baseY);
  ctx.lineTo(baseX + dir * (12 + strength * 3), baseY - 5);
  ctx.moveTo(baseX + dir * (20 + strength * 3), baseY);
  ctx.lineTo(baseX + dir * (12 + strength * 3), baseY + 5);
  ctx.stroke();
}

function draw() {
  drawBackground();
  drawCourt();
  drawPlayer();
  drawTrajectoryPreview();
  drawBall();
  drawWindIndicator();
}

function tick() {
  game.time += 0.016;
  physicsStep(0.016);
  updateScoreboard();
  draw();
  requestAnimationFrame(tick);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;
    applyModeCardSelection();
  });
});

startBtn.addEventListener("click", startSession);

document.getElementById("shootBtn").addEventListener("click", launchShot);

document.getElementById("resetBtn").addEventListener("click", () => {
  resetBall();
  setStatus("Ball reset. Try a fresh shot.", false, false);
});

document.getElementById("newCommandBtn").addEventListener("click", () => {
  if (!game.started) {
    setStatus("Pick your mode first.", false, true);
    return;
  }
  pickShotCommand();
  setStatus("Shot command refreshed.", false, false);
});

Object.values(controls).forEach((el) => {
  el.addEventListener("input", updateLabelValues);
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    launchShot();
  }
  if (e.code === "Enter" && !game.started) {
    startSession();
  }
});

applyModeCardSelection();
updateModeTexts();
updateLabelValues();
pickShotCommand();
externalText.textContent = "Live factors: wait for launch.";
tick();
