const statusText = document.getElementById('statusText');
const goBtn = document.getElementById('goBtn');
const surpriseBtn = document.getElementById('surpriseBtn');

const nonsensePhrases = [
  'launching into a tiny, meaningless adventure...',
  'sending you to a site that definitely has no purpose...',
  'redirecting to something delightfully pointless...',
  'the internet has spoken. you are now off-task...',
  'we are absolutely not doing anything productive right now...',
  'engaging in maximum nonsense energy...',
  'a very dramatic waste of 3 seconds...'
];

const weirdWebsites = [
  'https://theuselessweb.com/',
  'https://pointerpointer.com/',
  'https://www.bouncingdvdlogo.com/',
  'https://www.koalastothemax.com/',
  'https://cat-bounce.com/',
  'http://heeeeeeeey.com/',
  'https://www.dadlaugh.com/',
  'https://www.theworldsworstwebsiteever.com/'
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function triggerChaos(mode) {
  const body = document.body;
  body.classList.remove('spin', 'wobble', 'flash');
  void body.offsetWidth;

  if (mode === 'spin') {
    body.classList.add('spin');
  } else if (mode === 'wobble') {
    body.classList.add('wobble');
  } else {
    body.classList.add('flash');
  }
}

function openUselessThing() {
  const target = pickRandom(weirdWebsites);
  const phrase = pickRandom(nonsensePhrases);
  statusText.textContent = phrase;

  triggerChaos(pickRandom(['spin', 'wobble', 'flash']));

  window.open(target, '_blank', 'noopener,noreferrer');
}

goBtn.addEventListener('click', openUselessThing);

surpriseBtn.addEventListener('click', () => {
  document.body.classList.remove('spin', 'wobble', 'flash');
  void document.body.offsetWidth;

  const randomMode = pickRandom(['spin', 'wobble', 'flash']);
  statusText.textContent = `surprise mode activated: ${randomMode}...`;
  triggerChaos(randomMode);
});
