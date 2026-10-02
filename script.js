// Page behaviour. Day-to-day settings (banner, carousel photos) live in config.js.

document.addEventListener('DOMContentLoaded', () => {
  if (typeof SITE_CONFIG === 'undefined') {
    console.error('config.js was not loaded: upload it next to index.html.');
    return;
  }
  initBanner(SITE_CONFIG.banner);
  initFooterYear();
  initCarousel(SITE_CONFIG.carouselImages);
});

/* ---------- Vacation banner ---------- */
function initBanner({ visible, message, image }) {
  const banner = document.getElementById('vacances-banner');
  const text = document.getElementById('vacances-t');
  if (!banner || !text || !visible) return; // hidden by default in CSS

  banner.style.backgroundImage = `url('${image}')`;
  text.innerHTML = message;
  banner.classList.add('is-visible');
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

/* ---------- Infinite image carousel ---------- */
function initCarousel(imageList) {
  const track = document.querySelector('.carousel-track');
  if (!track || !imageList.length) return;

  let images = []; // photos that loaded successfully (filled in below)

  const container = track.parentElement;
  const SLIDE_INTERVAL_MS = 4000;
  const TRANSITION = 'transform 1.2s ease-in-out';

  let currentIndex = 0;
  let timer = null;
  let isAnimating = false;

  // Maps any integer (including negatives) to a valid index in `images`.
  const wrap = (i) => ((i % images.length) + images.length) % images.length;

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(src);
      img.src = src;
    });
  }

  function createImage(index) {
    const img = document.createElement('img');
    img.src = images[wrap(index)];
    img.alt = '';
    if (index === currentIndex) img.classList.add('active-carousel-image');
    return img;
  }

  // Fills the track with enough images on both sides of the active one.
  function fillTrack() {
    track.innerHTML = '';
    const containerWidth = container.offsetWidth;

    let right = currentIndex;
    let trackWidth = 0;
    while (trackWidth < containerWidth) {
      const img = createImage(right++);
      track.appendChild(img);
      trackWidth += img.offsetWidth;
    }
    track.appendChild(createImage(right)); // one extra (mobile bug)

    let left = currentIndex - 1;
    while (track.scrollWidth < containerWidth * 2) {
      track.prepend(createImage(left--));
    }
    track.prepend(createImage(left)); // one extra (mobile bug)
  }

  // Centers the active image in the container, without animating.
  function centerTrack() {
    const active = track.querySelector('.active-carousel-image');
    if (!active) return;

    const activeCenter = active.offsetLeft + active.offsetWidth / 2;
    const offset = container.offsetWidth / 2 - activeCenter;

    track.style.transition = 'none';
    track.style.transform = `translateX(${offset}px)`;
    void track.offsetWidth; // force reflow so the next transition animates
    track.style.transition = TRANSITION;
  }

  function nextImage() {
    if (isAnimating) return;

    const active = track.querySelector('.active-carousel-image');
    const next = active && active.nextElementSibling;
    if (!next) return;

    isAnimating = true;

    // Distance from the center of the current image to the center of the next one
    const shift =
      next.offsetLeft + next.offsetWidth / 2 -
      (active.offsetLeft + active.offsetWidth / 2);
    const current = new DOMMatrix(getComputedStyle(track).transform).e;

    track.style.transition = TRANSITION;
    track.style.transform = `translateX(${current - shift}px)`;

    track.addEventListener('transitionend', () => {
      currentIndex = wrap(currentIndex + 1);
      fillTrack();
      centerTrack();
      isAnimating = false;
    }, { once: true });
  }

  function start() {
    fillTrack();
    centerTrack();
    timer = setInterval(nextImage, SLIDE_INTERVAL_MS);
  }

  function stop() {
    clearInterval(timer);
  }

  function handleResize() {
    if (isAnimating) return;
    stop();
    start();
  }

  // Wait for every image so widths are known before laying out the track.
  // Photos that fail to load are reported by name and skipped.
  Promise.allSettled(imageList.map(preloadImage)).then((results) => {
    results.forEach((result) => {
      if (result.status === 'rejected') console.error('Could not load image:', result.reason);
    });
    images = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.src);
    if (!images.length) return;

    start();
    window.addEventListener('resize', handleResize);
  });
}
