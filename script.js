const nameScreen = document.getElementById("nameScreen");
const levelScreen = document.getElementById("levelScreen");
const gameScreen = document.getElementById("gameScreen");

const playerNameInput = document.getElementById("playerNameInput");
const enterLabBtn = document.getElementById("enterLabBtn");
const nameMessage = document.getElementById("nameMessage");

const welcomeName = document.getElementById("welcomeName");
const levelOptions = Array.from(document.querySelectorAll(".level-option"));
const startGameBtn = document.getElementById("startGameBtn");
const changeNameBtn = document.getElementById("changeNameBtn");

const hudName = document.getElementById("hudName");
const hudLevel = document.getElementById("hudLevel");
const lockInfo = document.getElementById("lockInfo");
const feedbackMessage = document.getElementById("feedbackMessage");

const scoreStat = document.getElementById("scoreStat");
const shotsStat = document.getElementById("shotsStat");
const streakStat = document.getElementById("streakStat");
const bestStat = document.getElementById("bestStat");

const angleInput = document.getElementById("angleInput");
const powerInput = document.getElementById("powerInput");
const gravityInput = document.getElementById("gravityInput");
const windInput = document.getElementById("windInput");
const dragInput = document.getElementById("dragInput");
const previewToggle = document.getElementById("previewToggle");

const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const gravityValue = document.getElementById("gravityValue");
const windValue = document.getElementById("windValue");
const dragValue = document.getElementById("dragValue");

const shootBtn = document.getElementById("shootBtn");
const resetBtn = document.getElementById("resetBtn");
const backBtn = document.getElementById("backBtn");

const canvas = document.getElementById("courtCanvas");
const ctx = canvas.getContext("2d");

const floorY = 500;
const launcher = { x: 130, y: floorY - 110 };
const hoop = { x: 846, y: 222 };
const rim = { left: 818, right: 874, y: 230 };
const backboard = { x: 890, y: 150, w: 10, h: 128 };

const ball = {
  x: launcher.x + 38,
  y: launcher.y - 18,
  vx: 0,
  vy: 0,
  r: 12,
  flying: false,
  scored: false
};

const game = {
  playerName: "Guest Player",
  level: "easy",
  score: 0,
  shots: 0,
  streak: 0,
  best: 0,
  maxHeight: ball.y
};

const levels = {
  easy: {
    label: "Easy",
    locked: null,
    assist: 0.22,
    forgiveness: 16
  },
  medium: {
    label: "Medium",
    locked: {
      field: "wind",
      value: 5.0,
      text: "Locked factor: Wind is fixed at +5.0"
    },
    assist: 0.12,
    forgiveness: 10
  },
  hard: {
    label: "Hard",
    locked: {
      field: "drag",
      value: 0.02,
      text: "Locked factor: Drag is fixed at 0.020"
    },
    assist: 0.05,
    forgiveness: 6
  }
};

function showScreen(screen) {
  nameScreen.classList.toggle("hidden", screen !== "name");
  levelScreen.classList.toggle("hidden", screen !== "level");
  gameScreen.classList.toggle("hidden", screen !== "game");
}

function resetBall() {
  ball.x = launcher.x + 38;
  ball.y = launcher.y - 18;
  ball.vx = 0;
  ball.vy = 0;
  ball.flying = false;
  ball.scored = false;
  game.maxHeight = ball.y;
}

function updateStats() {
  scoreStat.textContent = String(game.score);
  shotsStat.textContent = String(game.shots);
  streakStat.textContent = String(game.streak);
  bestStat.textContent = String(game.best);
}

function updateLabels() {
  angleValue.textContent = `${Number(angleInput.value).toFixed(0)}°`;
  powerValue.textContent = Number(powerInput.value).toFixed(0);
  gravityValue.textContent = Number(gravityInput.value).toFixed(1);
  windValue.textContent = Number(windInput.value).toFixed(1);
  dragValue.textContent = Number(dragInput.value).toFixed(3);
}

function applyLevelLocks() {
  // Easy: all factors controllable
  angleInput.disabled = false;
  powerInput.disabled = false;
  gravityInput.disabled = false;
  windInput.disabled = false;
  dragInput.disabled = false;

  const lock = levels[game.level].locked;
  if (lock) {
    if (lock.field === "wind") {
      windInput.value = lock.value;
      windInput.disabled = true;
    }
    if (lock.field === "drag") {
      dragInput.value = lock.value;
      dragInput.disabled = true;
    }
    lockInfo.textContent = lock.text;
  } else {
    lockInfo.textContent = "No locked factors. Control everything.";
  }
  updateLabels();
}

function setLevel(level) {
  game.level = level;
  levelOptions.forEach((btn) => btn.classList.toggle("selected", btn.dataset.level === level));
}

function getPhysics() {
  const angleDeg = Number(angleInput.value);
  const angleRad = (angleDeg * Math.PI) / 180;
  const power = Number(powerInput.value);
  const gravity = Number(gravityInput.value);
  const wind = Number(windInput.value);
  const drag = Number(dragInput.value);

  const speed = power * 4.2;
  const vx = Math.cos(angleRad) * speed;
  // Always negative on launch, so the ball first travels upward on canvas.
  const vy = -Math.abs(Math.sin(angleRad) * speed);

  return { angleDeg, angleRad, power, gravity, wind, drag, vx, vy };
}

function physicsStep(state, p, dt) {
  const speed = Math.hypot(state.vx, state.vy);
  const dragAx = -p.drag * state.vx * speed;
  const dragAy = -p.drag * state.vy * speed;

  const ax = p.wind * 8 + dragAx;
  const ay = p.gravity * 48 + dragAy;

  state.vx += ax * dt;
  state.vy += ay * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
}

function getMissFeedback(finalX) {
  if (ball.scored) return "Nice shot!";
  if (game.maxHeight > rim.y + 24) return "Too low — increase angle or power.";
  if (finalX > rim.right + 30) return "Too far — lower power.";
  return "Close! Try a small adjustment in angle or power.";
}

function shoot() {
  if (ball.flying) return;

  const p = getPhysics();
  ball.vx = p.vx;
  ball.vy = p.vy;
  const assistVX = (hoop.x - ball.x) / 2.25;
  ball.vx = ball.vx * (1 - levels[game.level].assist) + assistVX * levels[game.level].assist;
  ball.flying = true;
  ball.scored = false;

  game.shots += 1;
  game.maxHeight = ball.y;
  updateStats();
  feedbackMessage.textContent = "Shot launched...";

  let previousY = ball.y;

  function animate() {
    if (!ball.flying) return;
    const dt = 1 / 60;
    physicsStep(ball, p, dt);
    game.maxHeight = Math.min(game.maxHeight, ball.y);

    const forgiveness = levels[game.level].forgiveness;
    const crossedRim =
      previousY < rim.y &&
      ball.y >= rim.y &&
      ball.x > rim.left - forgiveness &&
      ball.x < rim.right + forgiveness;

    if (crossedRim && !ball.scored) {
      ball.scored = true;
      game.score += 2;
      game.streak += 1;
      game.best = Math.max(game.best, game.score);
      feedbackMessage.textContent = "Nice shot!";
      updateStats();
    }

    previousY = ball.y;

    const out =
      ball.y > canvas.height + 80 ||
      ball.x > canvas.width + 80 ||
      ball.x < -80;

    if (out) {
      if (!ball.scored) {
        game.streak = 0;
        feedbackMessage.textContent = getMissFeedback(ball.x);
        updateStats();
      }
      ball.flying = false;
      setTimeout(resetBall, 550);
      return;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function drawCourt() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#302118");
  bg.addColorStop(1, "#1f1611");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const floor = ctx.createLinearGradient(0, floorY - 40, 0, canvas.height);
  floor.addColorStop(0, "#744f31");
  floor.addColorStop(1, "#5e3f28");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

  ctx.strokeStyle = "rgba(255,230,200,0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();

  ctx.fillStyle = "#f4ede7";
  ctx.fillRect(backboard.x, backboard.y, backboard.w, backboard.h);

  ctx.strokeStyle = "#ff6f47";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(rim.left, rim.y);
  ctx.lineTo(rim.right, rim.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i += 1) {
    const x = rim.left + ((rim.right - rim.left) * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, rim.y + 2);
    ctx.lineTo(x + 6, rim.y + 54);
    ctx.stroke();
  }
}

function drawLauncher() {
  ctx.fillStyle = "#3d2c24";
  ctx.beginPath();
  ctx.roundRect(launcher.x - 44, launcher.y + 12, 88, 66, 16);
  ctx.fill();

  ctx.fillStyle = "#ffd2a7";
  ctx.beginPath();
  ctx.arc(launcher.x - 12, launcher.y - 2, 18, 0, Math.PI * 2);
  ctx.fill();

  const p = getPhysics();
  const len = 56;
  const armX = launcher.x + Math.cos(p.angleRad) * len;
  const armY = launcher.y - Math.sin(p.angleRad) * len;
  ctx.strokeStyle = "#ffd2a7";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(launcher.x + 2, launcher.y + 32);
  ctx.lineTo(armX, armY);
  ctx.stroke();
}

function drawBall() {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.fillStyle = "#f89237";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a320b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 2, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 2, Math.PI + 0.2, Math.PI * 2 - 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawAngleGuide() {
  if (ball.flying) return;
  const p = getPhysics();
  const len = 100;
  const endX = launcher.x + Math.cos(p.angleRad) * len;
  const endY = launcher.y - Math.sin(p.angleRad) * len;
  ctx.strokeStyle = "#ffd07f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(launcher.x, launcher.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.fillStyle = "#ffd07f";
  ctx.font = "800 15px Inter, sans-serif";
  ctx.fillText(`${p.angleDeg.toFixed(0)}°`, endX + 8, endY - 8);
}

function drawTrajectoryPreview() {
  if (!previewToggle.checked || ball.flying) return;
  const p = getPhysics();
  const preview = { x: launcher.x, y: launcher.y, vx: p.vx, vy: p.vy };
  ctx.fillStyle = "rgba(122, 233, 193, 0.72)";
  for (let i = 0; i < 160; i += 1) {
    physicsStep(preview, p, 1 / 60);
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(preview.x, preview.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (preview.y > canvas.height || preview.x > canvas.width || preview.x < 0) break;
  }
}

function render() {
  drawCourt();
  drawTrajectoryPreview();
  drawAngleGuide();
  drawLauncher();
  drawBall();
  requestAnimationFrame(render);
}

enterLabBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    nameMessage.textContent = "Please enter a player name.";
    nameMessage.style.color = "var(--danger)";
    return;
  }
  game.playerName = name;
  welcomeName.textContent = name;
  nameMessage.textContent = "";
  showScreen("level");
});

levelOptions.forEach((btn) => {
  btn.addEventListener("click", () => {
    setLevel(btn.dataset.level);
  });
});

startGameBtn.addEventListener("click", () => {
  game.score = 0;
  game.shots = 0;
  game.streak = 0;
  game.best = 0;
  hudName.textContent = game.playerName;
  hudLevel.textContent = levels[game.level].label;
  applyLevelLocks();
  updateStats();
  resetBall();
  feedbackMessage.textContent = "Tune controls and shoot.";
  showScreen("game");
});

changeNameBtn.addEventListener("click", () => {
  showScreen("name");
});

shootBtn.addEventListener("click", shoot);

resetBtn.addEventListener("click", () => {
  resetBall();
  feedbackMessage.textContent = "Shot reset.";
});

backBtn.addEventListener("click", () => {
  showScreen("level");
});

[angleInput, powerInput, gravityInput, windInput, dragInput].forEach((input) => {
  input.addEventListener("input", updateLabels);
});

updateLabels();
setLevel("easy");
showScreen("name");
render();
