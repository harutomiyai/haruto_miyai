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
// モーダル制御
// ===================================
const magazineBtn = document.querySelector('[data-modal="magazine"]');
const podcastBtn = document.querySelector('[data-modal="podcast"]');
const magazineModal = document.getElementById('magazine-modal');
const podcastModal = document.getElementById('podcast-modal');

function openModal(modal) {
  if (modal) {
    modal.classList.add('modal--active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('modal--active');
    document.body.style.overflow = '';
  }
}

// マガジンボタンクリック
if (magazineBtn) {
  magazineBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(magazineModal);
  });
}

// ポッドキャストボタンクリック
if (podcastBtn) {
  podcastBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(podcastModal);
  });
}

// 閉じるボタン
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const modal = btn.closest('.modal');
    closeModal(modal);
  });
});

// モーダル背景クリック
[magazineModal, podcastModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  }
});

// ESCキー
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal(magazineModal);
    closeModal(podcastModal);
  }
});

// ===================================
// GSAP スクロールアニメーション（フォールバック）
// animation-timeline: scroll() が使えないブラウザ向け
// ===================================
async function initScrollAnimationFallback() {
  if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()")) {
    return;
  }

  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/gsap@3.12.0/+esm"),
      import("https://cdn.jsdelivr.net/npm/gsap@3.12.0/ScrollTrigger.js/+esm"),
    ]);

    gsap.registerPlugin(ScrollTrigger);

    const scrub = 0.2;

    const name = document.querySelector("body > section:nth-of-type(1) svg");
    if (name) {
      gsap.timeline().to(name, {
        scrollTrigger: {
          invalidateOnRefresh: true,
          trigger: name.parentNode,
          scrub,
          start: "top top",
          end: "bottom top-=25%",
        },
        opacity: 1,
      });
    }

    const p = document.querySelector("body > section:nth-of-type(2) p");
    if (p) {
      gsap.timeline()
        .to(p, {
          opacity: 1,
          immediateRender: false,
          scrollTrigger: {
            trigger: p.parentNode.parentNode,
            scrub,
            start: "top bottom",
            end: "top 50%",
          },
        })
        .to(p, {
          opacity: 0,
          immediateRender: false,
          scrollTrigger: {
            trigger: p.parentNode.parentNode,
            scrub,
            start: "bottom bottom",
            end: "bottom 50%",
          },
        });
    }
  } catch (error) {
    console.warn("Scroll animation fallback could not be loaded.", error);
  }
}

initScrollAnimationFallback();
