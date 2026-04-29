const authScreen = document.getElementById("authScreen");
const homeScreen = document.getElementById("homeScreen");
const simScreen = document.getElementById("simScreen");

const guestSignInBtn = document.getElementById("guestSignInBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const startSimBtn = document.getElementById("startSimBtn");
const backHomeBtn = document.getElementById("backHomeBtn");
const authHintText = document.getElementById("authHintText");

const userNameText = document.getElementById("userNameText");
const providerText = document.getElementById("providerText");
const hudUserName = document.getElementById("hudUserName");
const hudModeText = document.getElementById("hudModeText");

const modeCards = Array.from(document.querySelectorAll(".mode-card"));
const restrictionText = document.getElementById("restrictionText");
const shotGuideText = document.getElementById("shotGuideText");
const lessonText = document.getElementById("lessonText");
const externalText = document.getElementById("externalText");
const statusText = document.getElementById("statusText");

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

const shootBtn = document.getElementById("shootBtn");
const resetBtn = document.getElementById("resetBtn");

const scoreValue = document.getElementById("scoreValue");
const shotsValue = document.getElementById("shotsValue");
const streakValue = document.getElementById("streakValue");
const bestStreakValue = document.getElementById("bestStreakValue");

const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const rim = { x: 814, y: 228, radius: 11 };
const rim2 = { x: 862, y: 228, radius: 11 };
const backboard = { x: 884, y: 145, w: 10, h: 120 };
const floorY = 490;
const hoopY = rim.y;
const hoopX = (rim.x + rim2.x) / 2;

const player = { x: 132, y: floorY - 145 };

const ball = {
  x: player.x + 26,
  y: player.y - 13,
  vx: 0,
  vy: 0,
  radius: 12,
  spin: 0,
  inFlight: false,
  scored: false,
  processed: false,
  out: false
};

const game = {
  userName: "Guest",
  provider: "Guest",
  selectedMode: "easy",
  score: 0,
  shots: 0,
  streak: 0,
  bestStreak: 0,
  time: 0,
  stage: "auth"
};

const forceState = {
  wind: 0,
  gravity: 9.8,
  dragX: 0,
  dragY: 0,
  launchAngle: 50,
  launchPower: 58,
  banked: false
};

const lessons = {
  easy: "Easy: higher angle gives more arc, while higher power gives more range. Gravity constantly pulls down.",
  medium: "Medium: wind can push left or right. Counter wind by adjusting launch angle and power slightly.",
  hard: "Hard: drag slows the ball over time, so low-power shots lose speed before reaching the rim."
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
      generate: () => {
        const min = Math.round(40 + Math.random() * 10);
        return { min, max: min + 16 };
      },
      text: (r) => `Restriction: launch angle must be ${r.min}°-${r.max}°.`,
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
      generate: () => {
        const min = Math.round(46 + Math.random() * 8);
        return { min, max: min + 10 };
      },
      text: (r) => `Restriction: launch power must be ${r.min}-${r.max}.`,
      pass: (shot, r) => shot.power >= r.min && shot.power <= r.max
    }
  }
};

let activeRestriction = modes.easy.restriction.generate();
let googleReady = false;

// Add your Google OAuth Client ID here to enable real Google account sign-in.
const GOOGLE_CLIENT_ID = "";

function showOnly(screen) {
  authScreen.classList.toggle("hidden", screen !== "auth");
  homeScreen.classList.toggle("hidden", screen !== "home");
  simScreen.classList.toggle("hidden", screen !== "sim");
  game.stage = screen;
}

function updateUrlState(stage, extras = {}) {
  const params = new URLSearchParams({ stage, auth: game.provider.toLowerCase(), user: game.userName, mode: game.selectedMode, ...extras });
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function openNewStep(stage, extras = {}) {
  const params = new URLSearchParams({ stage, auth: game.provider.toLowerCase(), user: game.userName, mode: game.selectedMode, ...extras });
  window.open(`${window.location.pathname}?${params.toString()}`, "_blank");
}

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

function updateControlLabels() {
  labels.angle.textContent = `${controls.angle.value}°`;
  labels.power.textContent = controls.power.value;
  labels.gravity.textContent = `${Number(controls.gravity.value).toFixed(1)} m/s²`;
  labels.wind.textContent = Number(controls.wind.value).toFixed(1);
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
  forceState.banked = false;
}

function chooseMode(mode) {
  game.selectedMode = mode;
  modeCards.forEach((card) => card.classList.toggle("selected", card.dataset.mode === mode));
}

function refreshRestriction() {
  activeRestriction = modes[game.selectedMode].restriction.generate();
  restrictionText.textContent = modes[game.selectedMode].restriction.text(activeRestriction);
}

function updateLesson() {
  const angle = Number(controls.angle.value);
  const power = Number(controls.power.value);
  lessonText.textContent = `${lessons[game.selectedMode]} Current setup: angle ${angle}°, power ${power}.`;
  shotGuideText.textContent = `Shot guide: start around ${Math.round(angle)}° and power ${Math.round(power)}.`;
}

function applyUser(userName, provider) {
  game.userName = userName;
  game.provider = provider;
  if (provider === "Guest") {
    userNameText.textContent = "No account";
    providerText.textContent = "Guest mode: no linked account.";
    hudUserName.textContent = "Guest";
  } else {
    userNameText.textContent = userName;
    providerText.textContent = `Signed in with ${provider}.`;
    hudUserName.textContent = userName;
  }
}

function startGameSession() {
  game.score = 0;
  game.shots = 0;
  game.streak = 0;
  game.bestStreak = 0;
  hudModeText.textContent = modes[game.selectedMode].label;
  refreshRestriction();
  updateLesson();
  updateScoreboard();
  setStatus("Simulation loaded. Follow the highlighted launch guide and mode restriction.");
  resetBall();
}

function launchShot() {
  if (ball.inFlight) return;
  const profile = modes[game.selectedMode];
  const angle = Number(controls.angle.value);
  const power = Number(controls.power.value);

  forceState.launchAngle = angle;
  forceState.launchPower = power;
  forceState.wind = Number(controls.wind.value) + randomBetween(-profile.windJitter, profile.windJitter);
  forceState.gravity = Number(controls.gravity.value) + randomBetween(-profile.gravityJitter, profile.gravityJitter);
  forceState.banked = false;

  const launchAngle = (angle + randomBetween(-profile.angleJitter, profile.angleJitter)) * (Math.PI / 180);
  const speed = Math.max(25, power) * 4.05;
  ball.vx = Math.cos(launchAngle) * speed;
  ball.vy = -Math.sin(launchAngle) * speed;
  ball.spin = randomBetween(-0.2, 0.2);
  ball.inFlight = true;
  ball.scored = false;
  ball.processed = false;
  ball.out = false;

  const targetVx = (hoopX - ball.x) / 2.25;
  ball.vx = ball.vx * (1 - profile.assist) + targetVx * profile.assist;

  game.shots += 1;
  setStatus("Shot released. Watch angle, basket target, and force arrows.");
}

function resolveShot(made) {
  if (ball.processed) return;
  ball.processed = true;

  const profile = modes[game.selectedMode];
  const obeyed = profile.restriction.pass(
    { angle: forceState.launchAngle, power: forceState.launchPower, banked: forceState.banked },
    activeRestriction
  );

  if (!made) {
    game.streak = 0;
    setStatus("Missed. Try adjusting angle and power against wind and gravity.", "bad");
    refreshRestriction();
    return;
  }

  if (!obeyed) {
    game.streak = 0;
    setStatus("Basket made, but restriction failed. No score this shot.", "bad");
    refreshRestriction();
    return;
  }

  const points = forceState.banked ? 80 : 60;
  game.score += points;
  game.streak += 1;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  if (game.streak >= 3) game.score += 20;
  setStatus(`Nice shot! +${points} points.`, "good");
  refreshRestriction();
}

function collideRim(r) {
  const dx = ball.x - r.x;
  const dy = ball.y - r.y;
  const dist = Math.hypot(dx, dy);
  const minDist = ball.radius + r.radius;
  if (dist >= minDist) return;

  const nx = dx / (dist || 1);
  const ny = dy / (dist || 1);
  const overlap = minDist - dist;
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

  const profile = modes[game.selectedMode];
  const wind = forceState.wind * 8;
  const gravity = forceState.gravity * 75;
  const dragC = game.selectedMode === "hard" ? 0.014 : game.selectedMode === "medium" ? 0.012 : 0.01;
  const speed = Math.hypot(ball.vx, ball.vy);
  forceState.dragX = -dragC * ball.vx * speed;
  forceState.dragY = -dragC * ball.vy * speed;

  const ax = wind + forceState.dragX;
  const ay = gravity + forceState.dragY;

  ball.vx += ax * dt;
  ball.vy += ay * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  externalText.textContent = `Forces now: wind ${forceState.wind.toFixed(1)}, gravity ${forceState.gravity.toFixed(1)} m/s², drag ${Math.hypot(forceState.dragX, forceState.dragY).toFixed(1)}`;

  if (ball.y + ball.radius > floorY) {
    ball.y = floorY - ball.radius;
    if (Math.abs(ball.vy) > 23) {
      ball.vy *= -0.62;
      ball.vx *= 0.85;
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
    forceState.banked = true;
  }

  collideRim(rim);
  collideRim(rim2);

  const tol = profile.rimTolerance;
  const made =
    !ball.scored &&
    ball.vy > 16 &&
    ball.x > rim.x - tolerance &&
    ball.x < rim2.x + tolerance &&
    ball.y > hoopY - 14 &&
    ball.y < hoopY + 21;

  if (made) {
    ball.scored = true;
    resolveShot(true);
  }

  const out = ball.x > canvas.width + 70 || ball.x < -70 || ball.y > canvas.height + 90;
  if (out && !ball.out) {
    ball.out = true;
    resolveShot(false);
  }

  if (ball.out || (Math.abs(ball.vx) < 1 && Math.abs(ball.vy) < 1 && ball.y >= floorY - ball.radius)) {
    if (!ball.scored) resolveShot(false);
    resetBall();
  }
}

function drawArrow(x, y, dx, dy, color, label) {
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const nx = dx / len;
  const ny = dy / len;
  const endX = x + dx;
  const endY = y + dy;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - nx * 9 - ny * 5, endY - ny * 9 + nx * 5);
  ctx.lineTo(endX - nx * 9 + ny * 5, endY - ny * 9 - nx * 5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = "12px sans-serif";
  ctx.fillText(label, endX + 6, endY - 2);
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
  ctx.strokeStyle = "#8ab0ea";
  ctx.lineWidth = 2;
  ctx.strokeRect(backboard.x - 1, backboard.y - 1, backboard.w + 2, backboard.h + 2);

  // Target box on the board for visual aim
  ctx.strokeStyle = "#ef6767";
  ctx.lineWidth = 3;
  ctx.strokeRect(backboard.x - 26, rim.y - 20, 24, 24);

  ctx.strokeStyle = "#ff7d61";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rim.x, rim.y);
  ctx.lineTo(rim2.x, rim2.y);
  ctx.stroke();

  // Clear basket opening highlight
  ctx.fillStyle = "rgba(116, 203, 255, 0.2)";
  ctx.fillRect(rim.x + 1, rim.y - 4, rim2.x - rim.x - 2, 28);

  // Net lines
  ctx.strokeStyle = "rgba(101, 157, 255, 0.8)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i += 1) {
    const px = rim.x + (i / 5) * (rim2.x - rim.x);
    ctx.beginPath();
    ctx.moveTo(px, rim.y + 1);
    ctx.lineTo(px + Math.sin(game.time * 2 + i) * 3, rim.y + 24);
    ctx.stroke();
  }

  // Basket label
  ctx.fillStyle = "#355eae";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Target Hoop", rim.x - 8, rim.y - 16);
}

function drawPlayer() {
  ctx.fillStyle = "#2b3a63";
  ctx.fillRect(player.x - 42, floorY - 120, 56, 104);

  ctx.fillStyle = "#f4c8a1";
  ctx.beginPath();
  ctx.arc(player.x - 16, floorY - 138, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f4c8a1";
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
  const gravity = Number(controls.gravity.value) * 75;
  const dragC = 0.011;

  ctx.fillStyle = "rgba(128, 234, 196, 0.7)";
  for (let i = 0; i < 110; i += 1) {
    const speed = Math.hypot(vx, vy);
    vx += (wind - dragC * vx * speed) * 0.016;
    vy += (gravity - dragC * vy * speed) * 0.016;
    px += vx * 0.016;
    py += vy * 0.016;
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (py > floorY || px > canvas.width || px < 0) break;
  }
}

function drawLaunchAngleGuide() {
  if (ball.inFlight) return;
  const angleDeg = Number(controls.angle.value);
  const angle = angleDeg * (Math.PI / 180);
  const originX = player.x + 26;
  const originY = player.y - 13;
  const guideLen = 80;
  const endX = originX + Math.cos(angle) * guideLen;
  const endY = originY - Math.sin(angle) * guideLen;

  ctx.strokeStyle = "#2f8ab7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = "#2f8ab7";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`Launch Angle: ${angleDeg}°`, originX - 14, originY - 24);

  // Protractor-like arc for clearer angle reading
  ctx.strokeStyle = "rgba(47, 138, 183, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(originX, originY, 34, -angle, 0, false);
  ctx.stroke();
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
  ctx.arc(0, 0, ball.radius - 1.7, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius - 1.7, Math.PI + 0.2, Math.PI * 2 - 0.2);
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
  drawLaunchAngleGuide();
  drawPreview();
  drawBall();
  drawForceArrows();
}

function tick() {
  game.time += 0.016;
  if (game.stage === "sim") {
    physicsStep(0.016);
    updateScoreboard();
  }
  draw();
  requestAnimationFrame(tick);
}

function applyStageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage") || "auth";
  const auth = (params.get("auth") || "guest").toLowerCase();
  const user = params.get("user") || (auth === "google" ? "Google Player" : "Guest");
  const mode = params.get("mode") || "easy";

  applyUser(user, auth === "google" ? "Google" : "Guest");
  chooseMode(modes[mode] ? mode : "easy");
  refreshRestriction();
  updateLesson();

  if (stage === "home") {
    showOnly("home");
  } else if (stage === "sim") {
    showOnly("sim");
    startGameSession();
  } else {
    showOnly("auth");
  }

  updateUrlState(stage);
}

function decodeJwtPayload(token) {
  const base64Url = token.split(".")[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json);
}

function handleGoogleCredential(response) {
  if (!response?.credential) {
    authHintText.textContent = "Google sign-in was cancelled. Try again.";
    return;
  }
  const payload = decodeJwtPayload(response.credential);
  const name = payload?.name || "Google User";
  applyUser(name, "Google");
  openNewStep("home");
}

function initGoogleAuth() {
  if (!window.google || !window.google.accounts) {
    authHintText.textContent = "Google Sign-In library did not load. Try refreshing.";
    return;
  }
  if (!GOOGLE_CLIENT_ID) {
    authHintText.textContent = "Google sign-in demo is active. Add a Google Client ID in script.js for real account connection.";
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential
  });
  googleReady = true;
  authHintText.textContent = "Google sign-in is ready.";
}

guestSignInBtn.addEventListener("click", () => {
  applyUser("Guest", "Guest");
  openNewStep("home");
});

googleSignInBtn.addEventListener("click", () => {
  if (googleReady) {
    authHintText.textContent = "Opening Google sign-in...";
    window.google.accounts.id.prompt();
  } else {
    applyUser("Google Player", "Google");
    authHintText.textContent = "Using demo Google sign-in. Add a Client ID for real account linking.";
    openNewStep("home");
  }
});

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    chooseMode(card.dataset.mode);
    refreshRestriction();
    updateLesson();
  });
});

startSimBtn.addEventListener("click", () => {
  openNewStep("sim");
});

backHomeBtn.addEventListener("click", () => {
  openNewStep("home");
});

shootBtn.addEventListener("click", launchShot);

resetBtn.addEventListener("click", () => {
  resetBall();
  setStatus("Ball reset. Try a different combination.");
});

Object.values(controls).forEach((el) => {
  el.addEventListener("input", () => {
    updateControlLabels();
    updateLesson();
  });
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && game.stage === "sim") {
    event.preventDefault();
    launchShot();
  }
});

updateControlLabels();
applyStageFromUrl();
initGoogleAuth();
tick();
