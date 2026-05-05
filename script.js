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
const massInput = document.getElementById("massInput");
const dragInput = document.getElementById("dragInput");
const windInput = document.getElementById("windInput");
const vacuumToggle = document.getElementById("vacuumToggle");
const previewToggle = document.getElementById("previewToggle");

const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const gravityValue = document.getElementById("gravityValue");
const massValue = document.getElementById("massValue");
const dragValue = document.getElementById("dragValue");
const windValue = document.getElementById("windValue");

const speedReadout = document.getElementById("speedReadout");
const vxReadout = document.getElementById("vxReadout");
const vyReadout = document.getElementById("vyReadout");
const sideVxReadout = document.getElementById("sideVxReadout");
const sideVyReadout = document.getElementById("sideVyReadout");
const axReadout = document.getElementById("axReadout");
const ayReadout = document.getElementById("ayReadout");
const timeReadout = document.getElementById("timeReadout");
const xEqReadout = document.getElementById("xEqReadout");
const yEqReadout = document.getElementById("yEqReadout");
const coordNote = document.getElementById("coordNote");

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
const LAUNCH_SPEED_SCALE = 6.6;
const GRAVITY_PIXEL_SCALE = 34;

const ball = {
  x: launcher.x + 38,
  y: launcher.y - 18,
  x0: launcher.x + 38,
  y0: launcher.y - 18,
  vx: 0,
  vy: 0,
  vx0: 0,
  vy0: 0,
  ax: 0,
  ay: 0,
  t: 0,
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

let activeShotPhysics = null;

const levels = {
  easy: {
    label: "Easy · Ideal Projectile",
    text: "Vacuum mode is locked ON. Focus on vx, vy, and gravity only.",
    defaults: { vacuum: true, drag: 0.01, wind: 0 },
    controls: { vacuum: false, mass: false, drag: false, wind: false },
    forgiveness: 16
  },
  medium: {
    label: "Medium · Drag + Mass",
    text: "Use vacuum toggle to compare ideal motion vs drag. Wind is disabled.",
    defaults: { vacuum: false, wind: 0 },
    controls: { vacuum: true, mass: true, drag: true, wind: false },
    forgiveness: 10
  },
  hard: {
    label: "Hard · Full Forces",
    text: "Full dynamics enabled: drag, mass, gravity, and crosswind.",
    defaults: { vacuum: false, wind: 4.0 },
    controls: { vacuum: true, mass: true, drag: true, wind: true },
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
  ball.x0 = ball.x;
  ball.y0 = ball.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.vx0 = 0;
  ball.vy0 = 0;
  ball.ax = 0;
  ball.ay = 0;
  ball.t = 0;
  ball.flying = false;
  ball.scored = false;
  activeShotPhysics = null;
  game.maxHeight = ball.y;
}

function updateStats() {
  scoreStat.textContent = String(game.score);
  shotsStat.textContent = String(game.shots);
  streakStat.textContent = String(game.streak);
  bestStat.textContent = String(game.best);
}

function setControlEnabled(input, enabled) {
  input.disabled = !enabled;
  const row = input.closest(".control-row, .preview-row");
  if (row) row.classList.toggle("disabled-control", !enabled);
}

function updateLabels() {
  angleValue.textContent = `${Number(angleInput.value).toFixed(0)}°`;
  powerValue.textContent = Number(powerInput.value).toFixed(0);
  gravityValue.textContent = Number(gravityInput.value).toFixed(1);
  massValue.textContent = Number(massInput.value).toFixed(2);
  dragValue.textContent = Number(dragInput.value).toFixed(3);
  windValue.textContent = Number(windInput.value).toFixed(1);
}

function applyLevelRules() {
  const cfg = levels[game.level];

  if (cfg.defaults.vacuum !== undefined) {
    vacuumToggle.checked = cfg.defaults.vacuum;
  }
  if (cfg.defaults.drag !== undefined) {
    dragInput.value = cfg.defaults.drag;
  }
  if (cfg.defaults.wind !== undefined) {
    windInput.value = cfg.defaults.wind;
  }

  setControlEnabled(vacuumToggle, cfg.controls.vacuum);
  setControlEnabled(massInput, cfg.controls.mass);
  setControlEnabled(dragInput, cfg.controls.drag);
  setControlEnabled(windInput, cfg.controls.wind);

  if (!cfg.controls.mass) {
    massInput.value = 0.62;
  }
  if (!cfg.controls.drag) {
    dragInput.value = 0.01;
  }
  if (!cfg.controls.wind) {
    windInput.value = 0;
  }
  if (!cfg.controls.vacuum) {
    vacuumToggle.checked = true;
  }

  lockInfo.textContent = cfg.text;
  updateLabels();
  updateReadout();
}

function setLevel(level) {
  game.level = level;
  levelOptions.forEach((btn) => btn.classList.toggle("selected", btn.dataset.level === level));
}

function getPhysicsFromControls() {
  const angleDeg = Number(angleInput.value);
  const angleRad = (angleDeg * Math.PI) / 180;
  const power = Number(powerInput.value);
  const gravity = Number(gravityInput.value);
  const mass = Number(massInput.value);
  const drag = Number(dragInput.value);
  const wind = Number(windInput.value);
  const vacuum = vacuumToggle.checked;

  const speed = power * LAUNCH_SPEED_SCALE;
  const vx0 = Math.cos(angleRad) * speed;
  // In canvas coordinates, negative y goes upward.
  const vy0 = -Math.abs(Math.sin(angleRad) * speed);

  return { angleDeg, angleRad, power, gravity, mass, drag, wind, vacuum, speed, vx0, vy0 };
}

function computeAccelerations(vx, vy, physics) {
  if (physics.vacuum) {
    return {
      ax: physics.wind * 8,
      ay: physics.gravity * GRAVITY_PIXEL_SCALE
    };
  }

  const speed = Math.hypot(vx, vy);
  const dragFactor = physics.drag / Math.max(physics.mass, 0.05);
  const dragAx = -dragFactor * vx * speed;
  const dragAy = -dragFactor * vy * speed;

  return {
    ax: physics.wind * 8 + dragAx,
    ay: physics.gravity * GRAVITY_PIXEL_SCALE + dragAy
  };
}

function physicsStep(state, physics, dt) {
  const { ax, ay } = computeAccelerations(state.vx, state.vy, physics);
  state.ax = ax;
  state.ay = ay;
  state.vx += ax * dt;
  state.vy += ay * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  state.t += dt;
}

function updateReadout() {
  const controlsPhysics = getPhysicsFromControls();
  const physics = activeShotPhysics || controlsPhysics;
  const t = ball.flying ? ball.t : 0;

  const vx = ball.flying ? ball.vx : physics.vx0;
  const vy = ball.flying ? ball.vy : physics.vy0;
  const { ax, ay } = ball.flying
    ? { ax: ball.ax, ay: ball.ay }
    : computeAccelerations(physics.vx0, physics.vy0, physics);

  speedReadout.textContent = `${physics.speed.toFixed(1)} px/s`;
  vxReadout.textContent = `${vx.toFixed(1)} px/s`;
  vyReadout.textContent = `${vy.toFixed(1)} px/s`;
  sideVxReadout.textContent = `${controlsPhysics.vx0.toFixed(1)} px/s`;
  sideVyReadout.textContent = `${controlsPhysics.vy0.toFixed(1)} px/s`;
  axReadout.textContent = `${ax.toFixed(1)} px/s²`;
  ayReadout.textContent = `${ay.toFixed(1)} px/s²`;
  timeReadout.textContent = `${t.toFixed(2)} s`;

  const x0 = ball.flying ? ball.x0 : launcher.x + 38;
  const y0 = ball.flying ? ball.y0 : launcher.y - 18;
  const xIdeal = x0 + physics.vx0 * t;
  const yIdeal = y0 + physics.vy0 * t + 0.5 * physics.gravity * GRAVITY_PIXEL_SCALE * t * t;
  xEqReadout.textContent = `${x0.toFixed(1)} + (${physics.vx0.toFixed(1)})(${t.toFixed(2)}) = ${xIdeal.toFixed(1)}`;
  yEqReadout.textContent =
    `${y0.toFixed(1)} + (${physics.vy0.toFixed(1)})(${t.toFixed(2)}) + 0.5(${(physics.gravity * GRAVITY_PIXEL_SCALE).toFixed(1)})(${(t * t).toFixed(2)}) = ${yIdeal.toFixed(1)}`;

  if (physics.vacuum) {
    coordNote.textContent =
      "Vacuum mode: drag = 0, so mass does not change the trajectory when initial velocity is the same. Upward launch uses negative vy on canvas.";
  } else {
    coordNote.textContent =
      "Drag mode: drag acceleration scales with 1/mass, so heavier balls decelerate less for the same drag setting.";
  }
}

function getMissFeedback(finalX) {
  if (ball.scored) return "Swish. Great projectile setup.";
  if (game.maxHeight > rim.y + 24) return "Arc stayed too low. Increase angle or launch speed.";
  if (finalX > rim.right + 30) return "Overshot. Reduce power or raise drag.";
  return "Close. Adjust angle and compare vx/vy before shooting again.";
}

function shoot() {
  if (ball.flying) return;

  const physics = getPhysicsFromControls();
  activeShotPhysics = { ...physics };

  ball.x0 = ball.x;
  ball.y0 = ball.y;
  ball.vx0 = physics.vx0;
  ball.vy0 = physics.vy0;
  ball.vx = physics.vx0;
  ball.vy = physics.vy0;
  ball.t = 0;

  ball.flying = true;
  ball.scored = false;

  game.shots += 1;
  game.maxHeight = ball.y;
  updateStats();
  feedbackMessage.textContent = "Shot launched. Watch vx, vy, and g vectors in flight.";

  let previousY = ball.y;

  function animate() {
    if (!ball.flying || !activeShotPhysics) return;
    const dt = 1 / 60;
    physicsStep(ball, activeShotPhysics, dt);
    game.maxHeight = Math.min(game.maxHeight, ball.y);
    updateReadout();

    const crossedRim =
      previousY < rim.y &&
      ball.y >= rim.y &&
      ball.x > rim.left - levels[game.level].forgiveness &&
      ball.x < rim.right + levels[game.level].forgiveness;

    if (crossedRim && !ball.scored) {
      ball.scored = true;
      game.score += 2;
      game.streak += 1;
      game.best = Math.max(game.best, game.score);
      feedbackMessage.textContent = "Bucket! Your projectile path crossed the rim plane.";
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
      setTimeout(() => {
        resetBall();
        updateReadout();
      }, 550);
      return;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function drawCourt() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#102237");
  bg.addColorStop(1, "#0d1a2a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(68, 147, 255, 0.07)";
  for (let i = 0; i < canvas.width; i += 56) {
    ctx.fillRect(i, 0, 1, canvas.height);
  }
  for (let j = 0; j < canvas.height; j += 56) {
    ctx.fillRect(0, j, canvas.width, 1);
  }

  const floor = ctx.createLinearGradient(0, floorY - 36, 0, canvas.height);
  floor.addColorStop(0, "#6f4f2f");
  floor.addColorStop(1, "#583c25");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

  ctx.strokeStyle = "rgba(255,238,219,0.38)";
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
  ctx.fillStyle = "#2a3e58";
  ctx.beginPath();
  ctx.roundRect(launcher.x - 44, launcher.y + 12, 88, 66, 16);
  ctx.fill();

  ctx.fillStyle = "#ffd2a7";
  ctx.beginPath();
  ctx.arc(launcher.x - 12, launcher.y - 2, 18, 0, Math.PI * 2);
  ctx.fill();

  const physics = getPhysicsFromControls();
  const len = 56;
  const armX = launcher.x + Math.cos(physics.angleRad) * len;
  const armY = launcher.y - Math.sin(physics.angleRad) * len;
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

function drawArrow(x1, y1, x2, y2, color, label) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;

  const ux = dx / len;
  const uy = dy / len;
  const arrowSize = 8;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * arrowSize - uy * 4, y2 - uy * arrowSize + ux * 4);
  ctx.lineTo(x2 - ux * arrowSize + uy * 4, y2 - uy * arrowSize - ux * 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = "700 13px Inter, sans-serif";
  ctx.fillText(label, x2 + 6, y2 - 6);
}

function clampMagnitude(value, maxAbs, minAbs = 0) {
  if (Math.abs(value) < minAbs) return value >= 0 ? minAbs : -minAbs;
  return Math.max(-maxAbs, Math.min(maxAbs, value));
}

function drawPhysicsVectors() {
  const physics = activeShotPhysics || getPhysicsFromControls();
  const currentVX = ball.flying ? ball.vx : physics.vx0;
  const currentVY = ball.flying ? ball.vy : physics.vy0;

  const vxLen = clampMagnitude(currentVX * 0.12, 84, 10);
  const vyLen = clampMagnitude(currentVY * 0.12, 84, 10);
  const gLen = clampMagnitude(physics.gravity * 2.2, 84, 20);

  drawArrow(ball.x, ball.y, ball.x + vxLen, ball.y, "#6ee6ff", "vx");
  drawArrow(ball.x, ball.y, ball.x, ball.y + vyLen, "#ff9ec7", "vy");
  drawArrow(ball.x + 18, ball.y, ball.x + 18, ball.y + gLen, "#ffd07f", "g");
}

function drawAngleGuide() {
  if (ball.flying) return;
  const physics = getPhysicsFromControls();
  const len = 100;
  const endX = launcher.x + Math.cos(physics.angleRad) * len;
  const endY = launcher.y - Math.sin(physics.angleRad) * len;
  ctx.strokeStyle = "#8cffd5";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(launcher.x, launcher.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.fillStyle = "#8cffd5";
  ctx.font = "800 15px Inter, sans-serif";
  ctx.fillText(`${physics.angleDeg.toFixed(0)}°`, endX + 8, endY - 8);
}

function drawTrajectoryPreview() {
  if (!previewToggle.checked || ball.flying) return;
  const physics = getPhysicsFromControls();
  const preview = {
    x: launcher.x + 38,
    y: launcher.y - 18,
    vx: physics.vx0,
    vy: physics.vy0,
    t: 0
  };

  ctx.fillStyle = "rgba(122, 233, 193, 0.75)";
  for (let i = 0; i < 180; i += 1) {
    physicsStep(preview, physics, 1 / 60);
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
  drawPhysicsVectors();
  updateReadout();
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
  applyLevelRules();
  updateStats();
  resetBall();
  feedbackMessage.textContent = "Tune controls and launch to explore projectile motion.";
  showScreen("game");
});

changeNameBtn.addEventListener("click", () => {
  showScreen("name");
});

shootBtn.addEventListener("click", shoot);

resetBtn.addEventListener("click", () => {
  resetBall();
  updateReadout();
  feedbackMessage.textContent = "Shot reset.";
});

backBtn.addEventListener("click", () => {
  showScreen("level");
});

[angleInput, powerInput, gravityInput, massInput, dragInput, windInput, vacuumToggle].forEach((input) => {
  input.addEventListener("input", () => {
    updateLabels();
    updateReadout();
  });
});

updateLabels();
setLevel("easy");
showScreen("name");
updateReadout();
render();
