(() => {
  const dialog = document.querySelector('#project-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const projects = JSON.parse(document.querySelector('#project-data').textContent);
  const stage = dialog.querySelector('.slideshow-stage');
  const layers = [...stage.querySelectorAll('.slide-image')];
  const thumbs = dialog.querySelector('.slideshow-thumbnails');
  const previous = dialog.querySelector('.slideshow-prev');
  const next = dialog.querySelector('.slideshow-next');
  const original = dialog.querySelector('.slideshow-original');
  const error = dialog.querySelector('.slideshow-error');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let project, requested = 0, displayed = -1, visibleLayer = 0, version = 0, returnFocus;
  let fading = false, fadeTimer;
  const findProject = id => projects.find(p => p.id === id || (p.aliases || []).includes(id));
  const controls = () => {
    const focused = document.activeElement;
    previous.disabled = requested === 0;
    next.disabled = requested === project.photos.length - 1;
    if ((focused === previous && previous.disabled) || (focused === next && next.disabled)) {
      const target = !next.disabled ? next : !previous.disabled ? previous : dialog.querySelector('.slideshow-close');
      target.focus({preventScroll: true});
    }
  };
  const caption = index => {
    const photo = project.photos[index];
    dialog.querySelector('#slideshow-phase').textContent = photo.phase;
    dialog.querySelector('#slideshow-count').textContent = `${index + 1} / ${project.photos.length}`;
    dialog.querySelector('#slideshow-caption').textContent = photo.caption;
    original.href = photo.full;
    [...thumbs.children].forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
    const selected = thumbs.children[index];
    if (selected) {
      const start = selected.offsetLeft - thumbs.offsetLeft;
      if (start < thumbs.scrollLeft || start + selected.offsetWidth > thumbs.scrollLeft + thumbs.clientWidth) {
        thumbs.scrollTo({ left: Math.max(0, start - thumbs.clientWidth / 2 + selected.offsetWidth / 2), behavior: 'auto' });
      }
    }
  };
  const render = async () => {
    if (fading || !dialog.open) return;
    const token = ++version, index = requested, currentProject = project;
    const photo = currentProject.photos[index];
    error.hidden = true;
    stage.setAttribute('aria-busy', 'true');
    try {
      const preload = new Image();
      preload.src = photo.full;
      await preload.decode();
      if (token !== version || !dialog.open || currentProject !== project) return;
      const layerIndex = displayed < 0 ? visibleLayer : 1 - visibleLayer;
      const incoming = layers[layerIndex];
      incoming.src = photo.full;
      incoming.alt = photo.caption;
      await incoming.decode();
      if (token !== version || !dialog.open || currentProject !== project) return;
      incoming.setAttribute('aria-hidden', 'false');
      incoming.classList.add('is-current');
      if (displayed >= 0) {
        layers[visibleLayer].classList.remove('is-current');
        layers[visibleLayer].setAttribute('aria-hidden', 'true');
      }
      visibleLayer = layerIndex;
      displayed = index;
      caption(index);
      stage.setAttribute('aria-busy', 'false');
      fading = !reducedMotion.matches;
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => { fading = false; if (requested !== displayed) render(); }, reducedMotion.matches ? 0 : 340);
      if (project.photos[index + 1]) { const warm = new Image(); warm.src = project.photos[index + 1].full; }
    } catch {
      if (token !== version || !dialog.open) return;
      stage.setAttribute('aria-busy', 'false');
      error.hidden = false;
      original.href = photo.full;
    }
  };
  const show = index => {
    requested = Math.max(0, Math.min(project.photos.length - 1, index));
    controls();
    if (!fading) { version++; stage.setAttribute('aria-busy', 'false'); }
    if (requested !== displayed) render();
  };
  const open = (selected, trigger) => {
    project = selected;
    returnFocus = trigger || document.querySelector(`[data-project="${project.id}"]`);
    version++;
    clearTimeout(fadeTimer);
    fading = false; displayed = -1; requested = 0; visibleLayer = 0;
    layers.forEach(img => { img.classList.remove('is-current'); img.removeAttribute('src'); img.alt = ''; img.setAttribute('aria-hidden','true'); });
    dialog.querySelector('#slideshow-title').textContent = project.title;
    dialog.querySelector('#slideshow-category').textContent = project.category;
    thumbs.replaceChildren();
    project.photos.forEach((photo, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Photo ${i+1}: ${photo.phase}. ${photo.caption}`);
      button.setAttribute('aria-current', String(i === 0));
      const img = document.createElement('img'); img.src = photo.thumb; img.alt = ''; img.loading = 'lazy';
      const count = document.createElement('span'); count.textContent = String(i+1); count.setAttribute('aria-hidden','true');
      button.append(img, count); button.addEventListener('click', () => show(i)); thumbs.append(button);
    });
    caption(0); controls(); error.hidden = true;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('viewer-open');
    dialog.scrollTop = 0; thumbs.scrollLeft = 0;
    history.replaceState(null, '', `#${project.id}`);
    render();
  };
  document.querySelectorAll('[data-project]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); open(findProject(link.dataset.project), link);
  }));
  previous.addEventListener('click', () => show(requested - 1));
  next.addEventListener('click', () => show(requested + 1));
  dialog.querySelector('.slideshow-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    const target = { ArrowLeft: requested - 1, ArrowRight: requested + 1, Home: 0, End: project.photos.length - 1 }[event.key];
    if (target !== undefined) { event.preventDefault(); show(target); }
  });
  let touchStart;
  stage.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') touchStart = {x:event.clientX,y:event.clientY}; });
  stage.addEventListener('pointerup', event => {
    if (!touchStart || event.pointerType !== 'touch') return;
    const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) show(requested + (dx < 0 ? 1 : -1));
    touchStart = null;
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    version++; clearTimeout(fadeTimer); fading = false; touchStart = null;
    document.body.classList.remove('viewer-open');
    history.replaceState(null, '', location.pathname + location.search);
    returnFocus?.focus({preventScroll:true});
  });
  const fromHash = () => { const selected = findProject(location.hash.slice(1)); if (selected) open(selected); };
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
