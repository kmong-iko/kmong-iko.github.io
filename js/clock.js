// Live Philippine Time (PHT, Asia/Manila) for the glass pill in the header.

const format = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function initClock(element) {
  let timer = 0;
  const tick = () => {
    element.textContent = format.format(new Date());
    timer = setTimeout(tick, 1000 - (Date.now() % 1000)); // stay aligned to whole seconds
  };
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden) tick();
  });
  tick();
}
