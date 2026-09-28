const viewer = document.querySelector('#photo-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerCaption = document.querySelector('#viewer-caption');
const viewerPhase = document.querySelector('#viewer-phase');
const viewerCount = document.querySelector('#viewer-count');
const viewerSource = document.querySelector('#viewer-source');
const previousPhoto = document.querySelector('#viewer-prev');
const nextPhoto = document.querySelector('#viewer-next');
let activePhotos = [];
let activeIndex = 0;
function showPhoto(index) {
  activeIndex = index;
  const photo = activePhotos[index];
  viewerImage.src = photo.href;
  viewerImage.alt = photo.dataset.caption;
  viewerCaption.textContent = photo.dataset.caption;
  viewerPhase.textContent = photo.dataset.phase;
  viewerCount.textContent = `Photo ${index + 1} of ${activePhotos.length}`;
  if (viewerSource) {
    viewerSource.hidden = !photo.dataset.source;
    if (photo.dataset.source) viewerSource.href = photo.dataset.source;
  }
  previousPhoto.disabled = index === 0;
  nextPhoto.disabled = index === activePhotos.length - 1;
}
if (typeof viewer.showModal === 'function') {
  document.querySelectorAll('.photo-link').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      activePhotos = [...document.querySelectorAll('.photo-link')].filter(photo => photo.dataset.gallery === link.dataset.gallery);
      showPhoto(activePhotos.indexOf(link));
      viewer.showModal();
      document.body.classList.add('viewer-open');
    });
  });
  document.querySelector('#viewer-close').addEventListener('click', () => viewer.close());
  previousPhoto.addEventListener('click', () => { if (activeIndex > 0) showPhoto(activeIndex - 1); });
  nextPhoto.addEventListener('click', () => { if (activeIndex < activePhotos.length - 1) showPhoto(activeIndex + 1); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && activeIndex > 0) { event.preventDefault(); showPhoto(activeIndex - 1); }
    if (event.key === 'ArrowRight' && activeIndex < activePhotos.length - 1) { event.preventDefault(); showPhoto(activeIndex + 1); }
  });
  viewer.addEventListener('close', () => document.body.classList.remove('viewer-open'));
  viewer.addEventListener('click', event => {
    const box = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) viewer.close();
  });
}
