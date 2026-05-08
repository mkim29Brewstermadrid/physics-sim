const nameScreen = document.getElementById("nameScreen");
const levelScreen = document.getElementById("levelScreen");
const gameScreen = document.getElementById("gameScreen");

const guestBtn = document.getElementById("guestBtn");
const authMessage = document.getElementById("authMessage");

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
const distanceInput = document.getElementById("distanceInput");
const previewToggle = document.getElementById("previewToggle");
const graphToggle = document.getElementById("graphToggle");
const distanceValue = document.getElementById("distanceValue");
const spotRow = document.getElementById("spotRow");
const spotInfo = document.getElementById("spotInfo");
const nextSpotBtn = document.getElementById("nextSpotBtn");

const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const gravityValue = document.getElementById("gravityValue");

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
const tryAgainBtn = document.getElementById("tryAgainBtn");
const viewCalcBtn = document.getElementById("viewCalcBtn");
const shotNotice = document.getElementById("shotNotice");
const shotNoticeTitle = document.getElementById("shotNoticeTitle");
const shotNoticeMessage = document.getElementById("shotNoticeMessage");
const graphPanel = document.getElementById("graphPanel");
const graphMeta = document.getElementById("graphMeta");
const graphCanvas = document.getElementById("graphCanvas");
const graphCtx = graphCanvas.getContext("2d");

const canvas = document.getElementById("courtCanvas");
const ctx = canvas.getContext("2d");

const floorY = 500;
const launcher = { x: 130, y: floorY - 110 };
const rim = { left: 818, right: 874, y: 230 };
const backboard = { x: 890, y: 150, w: 10, h: 128 };
const RIM_NODE_RADIUS = 7;
const LAUNCH_SPEED_SCALE = 6.6;
const GRAVITY_PIXEL_SCALE = 34;
const DISTANCE_LINES = [
  { x: 280, label: "Paint Line" },
  { x: 180, label: "Mid-range Line" },
  { x: 80, label: "Three-point Line" }
];

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
  path: [],
  r: 12,
  flying: false,
  scored: false
};

const game = {
  playerName: "Guest",
  userKey: null,
  isGuest: true,
  guestBest: 0,
  level: "easy",
  score: 0,
  shots: 0,
  streak: 0,
  best: 0,
  maxHeight: ball.y,
  currentSpotIndex: 0,
  spotMakes: [],
  shotResolved: false
};

let activeShotPhysics = null;

const levels = {
  easy: {
    label: "Easy · Ideal Projectile",
    text: "Make 2 shots from the mid-range line.",
    distanceMode: { type: "spots", spots: [180], labels: ["Mid-range Line"], makesPerSpot: 2 },
    inputMode: "slider",
    showPreview: true,
    sliderRules: {
      angle: { min: 20, max: 85, step: 1, value: 52 },
      power: { min: 30, max: 92, step: 1, value: 58 },
      gravity: { min: 6, max: 14, step: 0.1, value: 9.8 }
    },
    forgiveness: 16
  },
  medium: {
    label: "Medium · Guided Vacuum",
    text: "Make 2 shots from two lines with typed values.",
    distanceMode: {
      type: "spots",
      spots: [280, 80],
      labels: ["Paint Line", "Three-point Line"],
      makesPerSpot: 2
    },
    inputMode: "typed",
    showPreview: true,
    sliderRules: {
      angle: { min: 40, max: 64, step: 2, value: 52 },
      power: { min: 44, max: 80, step: 4, value: 64 },
      gravity: { min: 9.0, max: 10.8, step: 0.3, value: 9.9 }
    },
    forgiveness: 10
  },
  hard: {
    label: "Hard · Vacuum Challenge",
    text: "Make 2 shots from all lines with typed values and no trajectory guide.",
    distanceMode: {
      type: "spots",
      spots: [280, 180, 80],
      labels: ["Paint Line", "Mid-range Line", "Three-point Line"],
      makesPerSpot: 2
    },
    inputMode: "typed",
    showPreview: false,
    sliderRules: {
      angle: { min: 38, max: 72, step: 1, value: 54 },
      power: { min: 46, max: 84, step: 2, value: 68 },
      gravity: { min: 8.6, max: 11.6, step: 0.2, value: 9.8 }
    },
    forgiveness: 6
  }
};

function getCurrentHighScore() {
  return game.guestBest;
}

function saveCurrentHighScore(score) {
  game.guestBest = Math.max(game.guestBest, score);
}

function showScreen(screen) {
  nameScreen.classList.toggle("hidden", screen !== "name");
  levelScreen.classList.toggle("hidden", screen !== "level");
  gameScreen.classList.toggle("hidden", screen !== "game");
}

function hideShotNotice() {
  shotNotice.classList.add("hidden");
}

function showShotNotice(title, message) {
  shotNoticeTitle.textContent = title;
  shotNoticeMessage.textContent = message;
  shotNotice.classList.remove("hidden");
}

function updateGraphVisibility() {
  graphPanel.classList.toggle("hidden", !graphToggle.checked);
}

function drawShotGraph() {
  if (!graphToggle.checked || ball.path.length < 2) {
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    graphMeta.textContent = "Toggle graph on and shoot to see x-y trajectory.";
    return;
  }

  const pts = ball.path;
  const xMin = Math.min(...pts.map((d) => d.x)) - 18;
  const xMax = Math.max(...pts.map((d) => d.x)) + 18;
  const yMin = Math.min(...pts.map((d) => d.y)) - 18;
  const yMax = Math.max(...pts.map((d) => d.y)) + 18;

  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  graphCtx.fillStyle = "rgba(8, 24, 40, 0.15)";
  graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

  const pad = 26;
  const w = graphCanvas.width - pad * 2;
  const h = graphCanvas.height - pad * 2;
  const tx = (x) => pad + ((x - xMin) / Math.max(1, xMax - xMin)) * w;
  const ty = (y) => pad + ((yMax - y) / Math.max(1, yMax - yMin)) * h;

  graphCtx.strokeStyle = "rgba(180, 220, 255, 0.25)";
  graphCtx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const gx = pad + (w * i) / 10;
    graphCtx.beginPath();
    graphCtx.moveTo(gx, pad);
    graphCtx.lineTo(gx, pad + h);
    graphCtx.stroke();
  }
  for (let i = 0; i <= 6; i += 1) {
    const gy = pad + (h * i) / 6;
    graphCtx.beginPath();
    graphCtx.moveTo(pad, gy);
    graphCtx.lineTo(pad + w, gy);
    graphCtx.stroke();
  }

  graphCtx.strokeStyle = "rgba(125, 234, 203, 0.96)";
  graphCtx.lineWidth = 2.2;
  graphCtx.beginPath();
  graphCtx.moveTo(tx(pts[0].x), ty(pts[0].y));
  for (let i = 1; i < pts.length; i += 1) graphCtx.lineTo(tx(pts[i].x), ty(pts[i].y));
  graphCtx.stroke();

  graphCtx.fillStyle = "rgba(234, 248, 255, 0.92)";
  graphCtx.font = "600 12px Inter, sans-serif";
  graphCtx.fillText("x distance", graphCanvas.width - 86, graphCanvas.height - 8);
  graphCtx.save();
  graphCtx.translate(10, 68);
  graphCtx.rotate(-Math.PI / 2);
  graphCtx.fillText("y height", 0, 0);
  graphCtx.restore();

  const p = activeShotPhysics || getPhysicsFromControls();
  graphMeta.textContent = `vx=${p.vx0.toFixed(1)}, vy=${p.vy0.toFixed(1)}, g=${(p.gravity * GRAVITY_PIXEL_SCALE).toFixed(1)} | points=${pts.length}`;
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
  ball.path = [];
  ball.flying = false;
  ball.scored = false;
  activeShotPhysics = null;
  game.maxHeight = ball.y;
  game.shotResolved = false;
}

function updateStats() {
  scoreStat.textContent = String(game.score);
  shotsStat.textContent = String(game.shots);
  streakStat.textContent = String(game.streak);
  bestStat.textContent = String(game.best);
}

function nearestDistanceLabel(x) {
  let best = DISTANCE_LINES[0];
  let bestDelta = Math.abs(x - best.x);
  for (let i = 1; i < DISTANCE_LINES.length; i += 1) {
    const delta = Math.abs(x - DISTANCE_LINES[i].x);
    if (delta < bestDelta) {
      best = DISTANCE_LINES[i];
      bestDelta = delta;
    }
  }
  return best.label;
}

function setLauncherX(x, reset = true) {
  launcher.x = x;
  distanceInput.value = String(Math.round(x));
  distanceValue.textContent = nearestDistanceLabel(x);
  if (reset && !ball.flying) {
    resetBall();
    updateReadout();
  }
}

function updateSpotInfo() {
  const cfg = levels[game.level];
  if (cfg.distanceMode.type !== "spots") return;
  const total = cfg.distanceMode.spots.length;
  const label = cfg.distanceMode.labels[game.currentSpotIndex];
  const required = cfg.distanceMode.makesPerSpot;
  const current = game.spotMakes[game.currentSpotIndex] ?? 0;
  const doneCount = game.spotMakes.reduce((sum, v) => sum + Math.min(v, required), 0);
  const targetCount = total * required;
  spotInfo.textContent = `Spot ${game.currentSpotIndex + 1}/${total}: ${label} · ${current}/${required} here · Total ${doneCount}/${targetCount}`;
}

function applyDistanceMode(cfg) {
  const mode = cfg.distanceMode;
  game.spotMakes = new Array(mode.spots.length).fill(0);
  game.currentSpotIndex = 0;

  distanceInput.min = String(Math.min(...mode.spots));
  distanceInput.max = String(Math.max(...mode.spots));
  distanceInput.step = "1";
  distanceInput.disabled = true;
  spotRow.classList.remove("hidden");
  nextSpotBtn.classList.toggle("hidden", mode.spots.length <= 1);
  setLauncherX(mode.spots[game.currentSpotIndex], false);
  updateSpotInfo();
}

function applySliderRule(input, rule) {
  input.min = String(rule.min);
  input.max = String(rule.max);
  input.step = String(rule.step);
  const currentValue = Number(input.value);
  const base = Number.isFinite(currentValue) ? currentValue : rule.value;
  const clamped = Math.min(rule.max, Math.max(rule.min, base));
  const snapped = Math.round((clamped - rule.min) / rule.step) * rule.step + rule.min;
  input.value = String(Number(snapped.toFixed(3)));
}

function updateLabels() {
  angleValue.textContent = `${Number(angleInput.value).toFixed(0)}°`;
  powerValue.textContent = Number(powerInput.value).toFixed(0);
  gravityValue.textContent = Number(gravityInput.value).toFixed(1);
  distanceValue.textContent = nearestDistanceLabel(launcher.x);
}

function setInputMode(cfg) {
  const controls = [
    [angleInput, cfg.sliderRules.angle],
    [powerInput, cfg.sliderRules.power],
    [gravityInput, cfg.sliderRules.gravity]
  ];
  const typed = cfg.inputMode === "typed";
  controls.forEach(([input, rule]) => {
    input.type = typed ? "number" : "range";
    input.min = String(rule.min);
    input.max = String(rule.max);
    input.step = String(rule.step);
    input.value = String(rule.value);
  });
}

function clampNumericInputs() {
  const cfg = levels[game.level];
  applySliderRule(angleInput, cfg.sliderRules.angle);
  applySliderRule(powerInput, cfg.sliderRules.power);
  applySliderRule(gravityInput, cfg.sliderRules.gravity);
}

function applyLevelRules() {
  const cfg = levels[game.level];
  setInputMode(cfg);
  clampNumericInputs();

  applyDistanceMode(cfg);

  const previewRow = previewToggle.closest(".preview-row");
  previewToggle.checked = cfg.showPreview;
  previewToggle.disabled = !cfg.showPreview;
  if (previewRow) previewRow.classList.toggle("hidden", !cfg.showPreview);

  lockInfo.textContent = cfg.text;
  updateGraphVisibility();
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

  const speed = power * LAUNCH_SPEED_SCALE;
  const vx0 = Math.cos(angleRad) * speed;
  const vy0 = -Math.abs(Math.sin(angleRad) * speed);

  return { angleDeg, angleRad, power, gravity, speed, vx0, vy0 };
}

function computeAccelerations(vx, vy, physics) {
  return {
    ax: 0,
    ay: physics.gravity * GRAVITY_PIXEL_SCALE
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

function resolveBackboardCollision() {
  const boardTop = backboard.y;
  const boardBottom = backboard.y + backboard.h;
  const boardLeft = backboard.x;
  const boardRight = backboard.x + backboard.w;
  const verticallyOverlapping = ball.y + ball.r > boardTop && ball.y - ball.r < boardBottom;

  if (!verticallyOverlapping) return false;

  const hitFrontFace =
    ball.vx > 0 &&
    ball.x + ball.r >= boardLeft &&
    ball.x - ball.r < boardLeft;
  if (hitFrontFace) {
    ball.x = boardLeft - ball.r - 0.2;
    ball.vx = -Math.abs(ball.vx) * 0.44;
    ball.vy *= 0.94;
    return true;
  }

  const hitBackFace =
    ball.vx < 0 &&
    ball.x - ball.r <= boardRight &&
    ball.x + ball.r > boardRight;
  if (hitBackFace) {
    ball.x = boardRight + ball.r + 0.2;
    ball.vx = Math.abs(ball.vx) * 0.44;
    ball.vy *= 0.94;
    return true;
  }

  return false;
}

function resolveRimCollision() {
  const rimNodes = [
    { x: rim.left, y: rim.y },
    { x: rim.right, y: rim.y }
  ];

  let hit = false;
  for (const node of rimNodes) {
    const dx = ball.x - node.x;
    const dy = ball.y - node.y;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const minDistance = ball.r + RIM_NODE_RADIUS;
    if (distance >= minDistance) continue;

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minDistance - distance;
    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      const tx = -ny;
      const ty = nx;
      const vt = ball.vx * tx + ball.vy * ty;
      const vnAfter = -vn * 0.68;
      const vtAfter = vt * 0.96;
      ball.vx = vnAfter * nx + vtAfter * tx;
      ball.vy = vnAfter * ny + vtAfter * ty;
    }
    hit = true;
  }

  return hit;
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

  coordNote.textContent =
    "Vacuum mode only: horizontal acceleration is zero and vertical acceleration is gravity. Upward launch starts with negative vy in canvas coordinates.";
}

function getMissFeedback(finalX) {
  if (ball.scored) return "Swish. Great projectile setup.";
  if (game.maxHeight > rim.y + 24) return "Arc stayed too low. Increase angle or launch speed.";
  if (finalX > rim.right + 30) return "Overshot. Reduce power or adjust angle.";
  return "Close. Adjust angle and compare vx/vy before shooting again.";
}

function registerSpotMake() {
  const cfg = levels[game.level];
  const required = cfg.distanceMode.makesPerSpot;
  const current = game.spotMakes[game.currentSpotIndex] ?? 0;
  const next = Math.min(required, current + 1);
  game.spotMakes[game.currentSpotIndex] = next;

  const completedBefore = current >= required;
  const completedNow = next >= required;
  const totalNeeded = cfg.distanceMode.spots.length * required;
  const totalMade = game.spotMakes.reduce((sum, v) => sum + Math.min(v, required), 0);
  updateSpotInfo();
  return {
    newlyCompleted: !completedBefore && completedNow,
    allDone: totalMade >= totalNeeded,
    current: next,
    required
  };
}

function shoot() {
  if (ball.flying || game.shotResolved) return;
  clampNumericInputs();

  const physics = getPhysicsFromControls();
  activeShotPhysics = { ...physics };

  ball.x0 = ball.x;
  ball.y0 = ball.y;
  ball.vx0 = physics.vx0;
  ball.vy0 = physics.vy0;
  ball.vx = physics.vx0;
  ball.vy = physics.vy0;
  ball.t = 0;
  ball.path = [{ x: ball.x, y: ball.y }];
  ball.flying = true;
  ball.scored = false;
  game.shotResolved = false;

  game.shots += 1;
  game.maxHeight = ball.y;
  updateStats();
  feedbackMessage.textContent = "Shot launched. Watch vx, vy, and g vectors in flight.";

  let previousY = ball.y;
  let previousX = ball.x;

  function animate() {
    if (!ball.flying || !activeShotPhysics) return;
    const dt = 1 / 60;
    physicsStep(ball, activeShotPhysics, dt);
    const hitBackboard = resolveBackboardCollision();
    const hitRim = resolveRimCollision();
    ball.path.push({ x: ball.x, y: ball.y });
    if (ball.path.length > 420) ball.path.shift();
    game.maxHeight = Math.min(game.maxHeight, ball.y);
    updateReadout();

    if ((hitBackboard || hitRim) && !ball.scored) {
      feedbackMessage.textContent = "Rim/backboard contact: tune angle and power for a clean make.";
    }

    const crossedPlane = previousY < rim.y && ball.y >= rim.y && ball.vy > 0;
    let crossedRim = false;
    if (crossedPlane) {
      const dy = ball.y - previousY;
      const alpha = Math.abs(dy) < 0.0001 ? 1 : (rim.y - previousY) / dy;
      const xAtPlane = previousX + (ball.x - previousX) * Math.max(0, Math.min(1, alpha));
      const hoopClearance = ball.r + 1;
      crossedRim = xAtPlane > rim.left + hoopClearance && xAtPlane < rim.right - hoopClearance;
    }

    if (crossedRim && !ball.scored) {
      ball.scored = true;
      game.score += 2;
      game.streak += 1;
      const spotProgress = registerSpotMake();
      if (game.score > game.best) {
        game.best = game.score;
        saveCurrentHighScore(game.best);
      }
      if (spotProgress.newlyCompleted && spotProgress.allDone) {
        feedbackMessage.textContent = "Bucket! Level challenge completed.";
      } else if (spotProgress.newlyCompleted) {
        feedbackMessage.textContent = `Bucket! Spot progress ${spotProgress.current}/${spotProgress.required}.`;
      } else {
        feedbackMessage.textContent = "Bucket! Keep going on this spot challenge.";
      }
      updateStats();
      ball.flying = false;
      game.shotResolved = true;
      showShotNotice(
        spotProgress.allDone ? "Level Complete!" : "Nice Shot!",
        spotProgress.allDone
          ? "Challenge complete. You can still review calculations and keep shooting."
          : "Made it through the hoop. Review the graph, then try again."
      );
      return;
    }

    previousY = ball.y;
    previousX = ball.x;

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
      game.shotResolved = true;
      showShotNotice("Shot Ended", "Missed this one. Check the graph and try again.");
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
  for (let i = 0; i < canvas.width; i += 56) ctx.fillRect(i, 0, 1, canvas.height);
  for (let j = 0; j < canvas.height; j += 56) ctx.fillRect(0, j, canvas.width, 1);

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

  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 1.2;
  ctx.font = "700 12px Inter, sans-serif";
  DISTANCE_LINES.forEach((line) => {
    ctx.strokeStyle = "rgba(185, 221, 255, 0.45)";
    ctx.beginPath();
    ctx.moveTo(line.x, floorY - 170);
    ctx.lineTo(line.x, floorY);
    ctx.stroke();
    ctx.fillStyle = "rgba(208, 232, 255, 0.86)";
    ctx.fillText(line.label, line.x + 8, floorY - 144);
  });
  ctx.setLineDash([]);

  ctx.fillStyle = "#f4ede7";
  ctx.fillRect(backboard.x, backboard.y, backboard.w, backboard.h);

  ctx.strokeStyle = "#ff6f47";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(rim.left, rim.y);
  ctx.lineTo(rim.right, rim.y);
  ctx.stroke();

  ctx.fillStyle = "#ff6f47";
  ctx.beginPath();
  ctx.arc(rim.left, rim.y, RIM_NODE_RADIUS, 0, Math.PI * 2);
  ctx.arc(rim.right, rim.y, RIM_NODE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

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

function drawShotPath() {
  if (ball.path.length < 2) return;
  ctx.strokeStyle = "rgba(122, 233, 193, 0.95)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ball.path[0].x, ball.path[0].y);
  for (let i = 1; i < ball.path.length; i += 1) ctx.lineTo(ball.path[i].x, ball.path[i].y);
  ctx.stroke();
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

  ctx.strokeStyle = "rgba(122, 233, 193, 0.75)";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(preview.x, preview.y);
  for (let i = 0; i < 180; i += 1) {
    physicsStep(preview, physics, 1 / 60);
    ctx.lineTo(preview.x, preview.y);
    if (preview.y > canvas.height || preview.x > canvas.width || preview.x < 0) break;
  }
  ctx.stroke();
}

function render() {
  drawCourt();
  drawTrajectoryPreview();
  drawAngleGuide();
  drawLauncher();
  drawShotPath();
  drawBall();
  drawPhysicsVectors();
  updateReadout();
  drawShotGraph();
  requestAnimationFrame(render);
}

function showAuthMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.style.color = isError ? "var(--danger)" : "#cce7ff";
}

function setGuestUser() {
  game.userKey = null;
  game.playerName = "Guest";
  game.isGuest = true;
  game.best = getCurrentHighScore();
  welcomeName.textContent = "Guest";
  hudName.textContent = "Guest";
}

function showLandingWelcome() {
  showAuthMessage("Guest mode only. Tap continue to play.");
}

guestBtn.addEventListener("click", () => {
  setGuestUser();
  showAuthMessage("Continuing as guest. Scores will stay only for this session.");
  showScreen("level");
});

levelOptions.forEach((btn) => {
  btn.addEventListener("click", () => setLevel(btn.dataset.level));
});

startGameBtn.addEventListener("click", () => {
  game.score = 0;
  game.shots = 0;
  game.streak = 0;
  game.best = getCurrentHighScore();
  game.shotResolved = false;

  hudName.textContent = game.playerName;
  hudLevel.textContent = levels[game.level].label;
  applyLevelRules();
  updateStats();
  resetBall();
  hideShotNotice();
  updateGraphVisibility();
  feedbackMessage.textContent = "Tune controls and launch to explore projectile motion.";
  showScreen("game");
});

changeNameBtn.addEventListener("click", () => {
  hideShotNotice();
  setGuestUser();
  showLandingWelcome();
  showScreen("name");
});

shootBtn.addEventListener("click", shoot);
resetBtn.addEventListener("click", () => {
  hideShotNotice();
  resetBall();
  updateReadout();
  feedbackMessage.textContent = "Shot reset.";
});
backBtn.addEventListener("click", () => {
  hideShotNotice();
  showScreen("level");
});
tryAgainBtn.addEventListener("click", () => {
  hideShotNotice();
  resetBall();
  updateReadout();
  feedbackMessage.textContent = "Try another shot.";
});
viewCalcBtn.addEventListener("click", () => {
  graphToggle.checked = true;
  updateGraphVisibility();
  hideShotNotice();
  feedbackMessage.textContent = "Graph enabled. Review the trajectory and equations.";
});
distanceInput.addEventListener("input", () => {
  if (ball.flying || game.shotResolved) return;
  setLauncherX(Number(distanceInput.value));
});
nextSpotBtn.addEventListener("click", () => {
  const cfg = levels[game.level];
  if (cfg.distanceMode.type !== "spots" || ball.flying || game.shotResolved) return;
  game.currentSpotIndex = (game.currentSpotIndex + 1) % cfg.distanceMode.spots.length;
  setLauncherX(cfg.distanceMode.spots[game.currentSpotIndex]);
  updateSpotInfo();
});
graphToggle.addEventListener("input", updateGraphVisibility);

[angleInput, powerInput, gravityInput, distanceInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateLabels();
    updateReadout();
  });
});
[angleInput, powerInput, gravityInput].forEach((input) => {
  input.addEventListener("change", () => {
    clampNumericInputs();
    updateLabels();
    updateReadout();
  });
});

updateLabels();
setLevel("easy");
setGuestUser();
showLandingWelcome();
showScreen("name");
hideShotNotice();
updateGraphVisibility();
updateReadout();
render();
