import gsap from "https://cdn.skypack.dev/gsap@3.12.0";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap@3.12.0/ScrollTrigger";

// ===================================
// GSAP スクロールアニメーション（フォールバック）
// animation-timeline: scroll() が使えないブラウザ向け
// ===================================
if (!CSS.supports("animation-timeline: scroll()")) {
  gsap.registerPlugin(ScrollTrigger);
  console.clear();

  const scrub = 0.2;

  const name = document.querySelector("section:nth-of-type(1) svg");
  gsap.timeline().to(name, {
    scrollTrigger: {
      invalidateOnRefresh: true,
      trigger: name.parentNode,
      scrub,
      start: "top top",
      end:   "bottom top-=25%",
    },
    opacity: 1,
  });

  const p = document.querySelector("section:nth-of-type(2) p");
  gsap.timeline()
    .to(p, {
      opacity: 1,
      immediateRender: false,
      scrollTrigger: {
        trigger: p.parentNode.parentNode,
        scrub,
        start: "top bottom",
        end:   "top 50%",
      },
    })
    .to(p, {
      opacity: 0,
      immediateRender: false,
      scrollTrigger: {
        trigger: p.parentNode.parentNode,
        scrub,
        start: "bottom bottom",
        end:   "bottom 50%",
      },
    });
}

// ===================================
// WORK セクション — 横スクロールボタン
// ===================================
const workContainer = document.querySelector('.section2 .grid-container');
const scrollRight   = document.querySelector('.scroll-right');
const scrollLeft    = document.querySelector('.scroll-left');

if (workContainer && scrollRight && scrollLeft) {
  function updateScrollButtons() {
    const max = workContainer.scrollWidth - workContainer.clientWidth;
    scrollRight.style.transform = workContainer.scrollLeft >= max - 1 ? 'scale(0)' : 'scale(1)';
    scrollLeft.style.transform  = workContainer.scrollLeft <= 0       ? 'scale(0)' : 'scale(1)';
  }

  scrollRight.addEventListener('click', () =>
    workContainer.scrollBy({ left:  400, behavior: 'smooth' })
  );
  scrollLeft.addEventListener('click', () =>
    workContainer.scrollBy({ left: -400, behavior: 'smooth' })
  );
  workContainer.addEventListener('scroll', updateScrollButtons);

  updateScrollButtons();
}

// ===================================
// Magazine Modal
// ===================================
const magazineBtn = document.querySelector('[data-modal="magazine"]');
const magazineModal = document.getElementById('magazine-modal');
const podcastBtn = document.querySelector('[data-modal="podcast"]');
const podcastModal = document.getElementById('podcast-modal');
const modalClose = document.querySelectorAll('.modal-close');

function setupModal(btn, modal) {
  if (!btn || !modal) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
}

function setupModalClose(modal) {
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

setupModal(magazineBtn, magazineModal);
setupModal(podcastBtn, podcastModal);
setupModalClose(magazineModal);
setupModalClose(podcastModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (magazineModal?.style.display === 'flex') {
      magazineModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    if (podcastModal?.style.display === 'flex') {
      podcastModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
});
