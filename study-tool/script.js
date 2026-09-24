const STORAGE_KEY = 'focus-flow-tasks';
const TASK_GOAL = 2;

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const sessionLabel = document.getElementById('sessionLabel');
const taskListEl = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskDuration = document.getElementById('taskDuration');
const taskCounter = document.getElementById('taskCounter');
const completedCountEl = document.getElementById('completedCount');
const focusMinutesEl = document.getElementById('focusMinutes');
const goalTextEl = document.getElementById('goalText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const quickButtons = document.querySelectorAll('.quick-btn');

let tasks = loadTasks();
let timerDuration = 25 * 60;
let timeLeft = timerDuration;
let timerInterval = null;
let isRunning = false;

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [
      { id: 1, text: 'Review chemistry notes', duration: 25, completed: false },
      { id: 2, text: 'Finish math practice set', duration: 25, completed: false }
    ];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  taskListEl.innerHTML = '';

  if (!tasks.length) {
    const empty = document.createElement('li');
    empty.className = 'task-item';
    empty.innerHTML = '<div class="task-main"><div class="task-copy"><span class="task-name">No tasks yet</span><span class="task-meta">Add your first focus block.</span></div></div>';
    taskListEl.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;

    const main = document.createElement('div');
    main.className = 'task-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} complete`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const copy = document.createElement('div');
    copy.className = 'task-copy';
    copy.innerHTML = `
      <span class="task-name">${task.text}</span>
      <span class="task-meta">${task.duration} min</span>
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${task.text}`);
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    main.appendChild(checkbox);
    main.appendChild(copy);
    item.appendChild(main);
    item.appendChild(deleteBtn);
    taskListEl.appendChild(item);
  });

  updateSummary();
  saveTasks();
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.completed ? Number(task.duration) : 0), 0);

  taskCounter.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
  completedCountEl.textContent = `${completed}`;
  focusMinutesEl.textContent = `${totalMinutes} min`;
  goalTextEl.textContent = `${TASK_GOAL} tasks`;
}

function addTask(event) {
  event.preventDefault();
  const text = taskInput.value.trim();
  const duration = Number(taskDuration.value);

  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text,
    duration,
    completed: false
  });

  taskInput.value = '';
  taskDuration.value = '25';
  renderTasks();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  renderTasks();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

function setTimer(minutes) {
  timerDuration = minutes * 60;
  timeLeft = timerDuration;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  updateTimerDisplay();
  sessionLabel.textContent = `${minutes} minute focus`;
  quickButtons.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.minutes) === minutes);
  });
}

function tick() {
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    sessionLabel.textContent = 'Session complete';
    startBtn.textContent = 'Start';

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus session complete!');
    }

    return;
  }

  timeLeft -= 1;
  updateTimerDisplay();
}

function startTimer() {
  if (isRunning) {
    return;
  }

  if (!('Notification' in window)) {
    console.log('Notifications unsupported in this browser.');
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }

  isRunning = true;
  startBtn.textContent = 'Running';
  timerInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.textContent = 'Resume';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  timeLeft = timerDuration;
  startBtn.textContent = 'Start';
  updateTimerDisplay();
}

quickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const minutes = Number(button.dataset.minutes);
    setTimer(minutes);
  });
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
taskForm.addEventListener('submit', addTask);

setTimer(25);
renderTasks();
