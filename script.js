(() => {
  const viewport = document.querySelector('.slider-window');
  const track = document.querySelector('.swiper-wrapper');
  const previousButton = document.querySelector('.previous-slide');
  const nextButton = document.querySelector('.next-slide');
  const counterCurrent = document.querySelector('.slide-counter strong');
  const counterTotal = document.querySelector('.slide-counter span');
  const dots = [...document.querySelectorAll('.slide-indicators [data-slide-to]')];
  const navButtons = [...document.querySelectorAll('.nav-slide[data-slide-to]')];
  const directButtons = [...document.querySelectorAll('.header-cta[data-slide-to]')];

  if (!viewport || !track) return;

  const originalSlides = [...track.querySelectorAll('.swiper-slide')];
  const slideCount = originalSlides.length;
  if (slideCount < 2) return;

  const firstClone = originalSlides[0].cloneNode(true);
  const lastClone = originalSlides[slideCount - 1].cloneNode(true);
  firstClone.dataset.clone = 'true';
  lastClone.dataset.clone = 'true';
  firstClone.setAttribute('aria-label', `${originalSlides[0].getAttribute('aria-label')} — repetição`);
  lastClone.setAttribute('aria-label', `${originalSlides[slideCount - 1].getAttribute('aria-label')} — repetição`);
  track.prepend(lastClone);
  track.append(firstClone);

  const slides = [...track.querySelectorAll('.swiper-slide')];
  const speedMs = 720;
  let currentIndex = 1;
  let isAnimating = false;
  let wheelLocked = false;
  let pointerStartX = null;
  let pointerStartY = null;
  let animationTimer;

  function getRealIndex(trackIndex = currentIndex) {
    return ((trackIndex - 1) % slideCount + slideCount) % slideCount;
  }

  function centerSlide(index, animate = true) {
    currentIndex = index;
    track.classList.toggle('is-jumping', !animate);
    const slide = slides[currentIndex];
    const offset = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
    track.style.transform = `translate3d(${offset}px, -50%, 0)`;
    slides.forEach((item, itemIndex) => {
      const active = itemIndex === currentIndex;
      item.classList.toggle('swiper-slide-active', active);
      item.classList.toggle('swiper-slide-prev', itemIndex === currentIndex - 1);
      item.classList.toggle('swiper-slide-next', itemIndex === currentIndex + 1);
      item.setAttribute('aria-hidden', String(!active));
      item.inert = !active;
    });
    updateControls();
    if (!animate) requestAnimationFrame(() => track.classList.remove('is-jumping'));
  }

  function updateControls() {
    const realIndex = getRealIndex();
    dots.forEach((button, index) => {
      const active = index === realIndex;
      button.classList.toggle('is-current', active);
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    navButtons.forEach((button, index) => {
      const active = index === realIndex;
      button.classList.toggle('is-current', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (counterCurrent) counterCurrent.textContent = String(realIndex + 1).padStart(2, '0');
    if (counterTotal) counterTotal.textContent = String(slideCount).padStart(2, '0');
  }

  function goTo(index) {
    if (isAnimating) return;
    isAnimating = true;
    centerSlide(index, true);
    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(() => { isAnimating = false; }, speedMs + 100);
  }

  function next() { goTo(currentIndex + 1); }
  function previous() { goTo(currentIndex - 1); }

  track.addEventListener('transitionend', (event) => {
    if (event.target !== track || event.propertyName !== 'transform') return;
    if (currentIndex === 0) centerSlide(slideCount, false);
    else if (currentIndex === slideCount + 1) centerSlide(1, false);
    isAnimating = false;
    window.clearTimeout(animationTimer);
  });

  previousButton?.addEventListener('click', previous);
  nextButton?.addEventListener('click', next);
  dots.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.slideTo) + 1)));
  navButtons.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.slideTo) + 1)));
  directButtons.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.slideTo) + 1)));
  track.querySelectorAll('[data-next-slide]').forEach((button) => button.addEventListener('click', next));

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) {
      if (event.target.matches('button') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        event.key === 'ArrowRight' ? next() : previous();
      }
      return;
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
  });

  viewport.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 18 || wheelLocked) return;
    event.preventDefault();
    wheelLocked = true;
    delta > 0 ? next() : previous();
    window.setTimeout(() => { wheelLocked = false; }, speedMs + 120);
  }, { passive: false });

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  viewport.addEventListener('pointerup', (event) => {
    if (pointerStartX === null || pointerStartY === null) return;
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    pointerStartX = null;
    pointerStartY = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) dx < 0 ? next() : previous();
  });
  viewport.addEventListener('pointercancel', () => { pointerStartX = null; pointerStartY = null; });

  window.addEventListener('resize', () => centerSlide(currentIndex, false));
  centerSlide(currentIndex, false);
})();

