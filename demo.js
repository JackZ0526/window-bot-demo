(() => {
  const hero = document.querySelector('[data-window-bot]');
  const replay = document.querySelector('#replay');
  if (!window.WindowBotEntrance || !hero) return;
  const entrance = new WindowBotEntrance(hero, { onState(message, active) {
    document.querySelector('#animation-status').textContent = message;
    replay.disabled = active;
  }});
  window.windowBotDemo = entrance;
  replay.addEventListener('click', () => {
    entrance.play({ force: true });
  });
  const record = new URLSearchParams(location.search).has('record');
  if (record) {
    document.documentElement.classList.add('record-mode');
    try { sessionStorage.clear(); } catch {}
    const loop = () => entrance.play({ force: true });
    loop();
    setInterval(loop, 4500);
    return;
  }
  entrance.play();
})();
