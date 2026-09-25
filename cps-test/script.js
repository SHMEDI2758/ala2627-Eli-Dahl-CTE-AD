const durationButtons = document.querySelectorAll(".duration-button");
const keyButtons = document.querySelectorAll(".key-bind");
const clickTarget = document.querySelector("#clickTarget");
const targetLabel = document.querySelector("#targetLabel");
const targetHint = document.querySelector("#targetHint");
const testStatus = document.querySelector("#testStatus");
const roundLength = document.querySelector("#roundLength");
const timeLeft = document.querySelector("#timeLeft");
const timeProgress = document.querySelector("#timeProgress");
const clickCount = document.querySelector("#clickCount");
const liveCps = document.querySelector("#liveCps");
const lastResult = document.querySelector("#lastResult");
const bestResult = document.querySelector("#bestResult");
const bestDuration = document.querySelector("#bestDuration");
const resultMessage = document.querySelector("#resultMessage");
const keyStatus = document.querySelector("#keyStatus");

let selectedDuration = 10;
let clicks = 0;
let startedAt = 0;
let timerId;
let isRunning = false;
let assigningSlot = null;
let keyBindings = loadKeyBindings();

function loadKeyBindings() {
  try {
    const savedBindings = JSON.parse(localStorage.getItem("cps-test-keys"));
    if (Array.isArray(savedBindings) && savedBindings.length === 2
      && savedBindings.every((binding) => typeof binding === "string" && binding)) {
      return savedBindings;
    }
  } catch {
    return ["KeyA", "KeyD"];
  }
  return ["KeyA", "KeyD"];
}

function formatKey(code) {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const labels = {
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    Enter: "ENTER",
    NumpadEnter: "NUM ENTER",
    Space: "SPACE",
  };
  return labels[code] || code.toUpperCase();
}

function updateKeyControls() {
  keyButtons.forEach((button, index) => {
    const isAssigning = assigningSlot === index;
    const label = formatKey(keyBindings[index]);
    button.textContent = isAssigning ? "..." : label;
    button.disabled = isRunning;
    button.classList.toggle("is-assigning", isAssigning);
    button.setAttribute("aria-label", isAssigning
      ? `Press a key for key ${index + 1}`
      : `Change key ${index + 1}, currently ${label}`);
  });
}

function assignKey(code) {
  const currentBinding = keyBindings[assigningSlot];
  const duplicateSlot = keyBindings.indexOf(code);
  if (duplicateSlot !== -1 && duplicateSlot !== assigningSlot) {
    keyBindings[duplicateSlot] = currentBinding;
  }
  keyBindings[assigningSlot] = code;
  localStorage.setItem("cps-test-keys", JSON.stringify(keyBindings));
  assigningSlot = null;
  keyStatus.textContent = `Use ${formatKey(keyBindings[0])} or ${formatKey(keyBindings[1])} during a round.`;
  updateKeyControls();
}

function getBestKey() {
  return `cps-test-best-${selectedDuration}`;
}

function formatCps(value) {
  return value.toFixed(2);
}

function updateBest() {
  bestDuration.textContent = `${selectedDuration} SEC`;
  bestResult.textContent = localStorage.getItem(getBestKey()) || "--";
}

function selectDuration(button) {
  if (isRunning) return;
  selectedDuration = Number(button.dataset.seconds);
  durationButtons.forEach((option) => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  roundLength.textContent = String(selectedDuration);
  timeLeft.textContent = `${selectedDuration}.0`;
  timeProgress.style.transform = "scaleX(1)";
  clickCount.textContent = "0";
  liveCps.textContent = "0.00";
  lastResult.textContent = "--";
  testStatus.textContent = "READY WHEN YOU ARE";
  targetLabel.textContent = "Click here to start";
  targetHint.textContent = "FIRST CLICK STARTS THE TIMER";
  updateBest();
}

function startTest() {
  clearInterval(timerId);
  clicks = 0;
  startedAt = performance.now();
  isRunning = true;
  clickTarget.classList.add("is-active");
  durationButtons.forEach((button) => { button.disabled = true; });
  updateKeyControls();
  clickCount.textContent = "0";
  liveCps.textContent = "0.00";
  lastResult.textContent = "--";
  testStatus.textContent = "TEST IN PROGRESS";
  targetLabel.textContent = "CLICK!";
  targetHint.textContent = "CLICK AS FAST AS YOU CAN";
  clickTarget.focus();
  updateTimer();
  timerId = window.setInterval(updateTimer, 40);
}

function updateTimer() {
  const elapsed = performance.now() - startedAt;
  const durationMs = selectedDuration * 1000;
  const remaining = Math.max(0, durationMs - elapsed);
  const secondsLeft = remaining / 1000;
  timeLeft.textContent = secondsLeft.toFixed(1);
  timeProgress.style.transform = `scaleX(${remaining / durationMs})`;
  liveCps.textContent = formatCps(clicks / Math.max(elapsed / 1000, 0.001));
  if (remaining <= 0) finishTest();
}

function finishTest() {
  clearInterval(timerId);
  isRunning = false;
  clickTarget.classList.remove("is-active");
  durationButtons.forEach((button) => { button.disabled = false; });
  updateKeyControls();
  testStatus.textContent = "ROUND COMPLETE";
  targetLabel.textContent = "Click here to go again";
  targetHint.textContent = "FIRST CLICK STARTS THE TIMER";
  timeLeft.textContent = "0.0";
  timeProgress.style.transform = "scaleX(0)";

  const score = formatCps(clicks / selectedDuration);
  const previousBest = Number(localStorage.getItem(getBestKey()) || 0);
  lastResult.textContent = `${score} CPS`;
  if (Number(score) > previousBest) {
    localStorage.setItem(getBestKey(), score);
    resultMessage.textContent = "New personal best. One more round?";
  } else {
    resultMessage.textContent = "Score saved. Ready for another round?";
  }
  updateBest();
}

durationButtons.forEach((button) => {
  button.addEventListener("click", () => selectDuration(button));
});

keyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isRunning) return;
    assigningSlot = Number(button.dataset.keySlot);
    keyStatus.textContent = `Press a key for key ${assigningSlot + 1}, or Escape to cancel.`;
    updateKeyControls();
  });
});

function countClick() {
  clicks += 1;
  clickCount.textContent = String(clicks);
  liveCps.textContent = formatCps(clicks / Math.max((performance.now() - startedAt) / 1000, 0.001));
}

clickTarget.addEventListener("click", () => {
  if (!isRunning) startTest();
  countClick();
});

document.addEventListener("keydown", (event) => {
  if (assigningSlot !== null) {
    if (event.code === "Escape") {
      event.preventDefault();
      assigningSlot = null;
      keyStatus.textContent = `Use ${formatKey(keyBindings[0])} or ${formatKey(keyBindings[1])} during a round.`;
      updateKeyControls();
      return;
    }
    if (event.repeat || event.code === "Unidentified"
      || ["Alt", "Control", "Meta", "Shift", "Tab"].includes(event.key)) return;
    event.preventDefault();
    assignKey(event.code);
    return;
  }

  if (!keyBindings.includes(event.code)) return;
  event.preventDefault();
  if (event.repeat) return;
  if (!isRunning) startTest();
  countClick();
});

roundLength.textContent = String(selectedDuration);
timeLeft.textContent = `${selectedDuration}.0`;
updateKeyControls();
keyStatus.textContent = `Use ${formatKey(keyBindings[0])} or ${formatKey(keyBindings[1])} during a round.`;
updateBest();
