document.querySelectorAll('[data-comparison]').forEach((stage) => {
  const slider = stage.querySelector('.comparison-range');
  let activePointer = null;
  const update = (value) => {
    const revealed = Math.max(0, Math.min(100, Math.round(Number(value))));
    slider.value = String(revealed);
    stage.style.setProperty('--split', `${100 - revealed}%`);
    slider.setAttribute('aria-valuetext', `${revealed}% after photo revealed`);
    stage.querySelector('.comparison-badge-before').hidden = revealed > 95;
    stage.querySelector('.comparison-badge-after').hidden = revealed < 5;
  };
  const move = (event) => {
    const bounds = stage.getBoundingClientRect();
    update(100 - (event.clientX - bounds.left) / bounds.width * 100);
  };
  // Keep the native range for focus and assistive technology, while mapping
  // pointer coordinates to the full image, including both exact endpoints.
  slider.addEventListener('input', () => update(slider.value));
  slider.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    slider.focus({ preventScroll: true });
    activePointer = event.pointerId;
    slider.setPointerCapture(event.pointerId);
    move(event);
  });
  slider.addEventListener('pointermove', (event) => {
    if (event.pointerId === activePointer) move(event);
  });
  const end = (event) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
  };
  slider.addEventListener('pointerup', end);
  slider.addEventListener('pointercancel', end);
  slider.addEventListener('lostpointercapture', () => { activePointer = null; });
  slider.addEventListener('keydown', (event) => {
    const value = Number(slider.value);
    const step = event.shiftKey ? 10 : 2;
    const keys = { ArrowLeft: value + step, ArrowRight: value - step,
      ArrowUp: value + step, ArrowDown: value - step,
      Home: 0, End: 100, PageUp: value + 10, PageDown: value - 10 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    update(keys[event.key]);
  });
  update(slider.value);
  stage.classList.add('comparison-ready');
});
