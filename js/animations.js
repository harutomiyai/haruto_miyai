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
const modalCloseTimers = new WeakMap();

function resetModalScroll(modal) {
  modal.scrollTop = 0;
  const scrollArea = modal.querySelector('.modal-scroll');
  if (scrollArea) {
    scrollArea.scrollTop = 0;
  }
}

function clearModalCloseTimer(modal) {
  const timer = modalCloseTimers.get(modal);
  if (timer) {
    window.clearTimeout(timer);
    modalCloseTimers.delete(modal);
  }
}

function releaseBodyScrollIfReady() {
  const visibleModal = document.querySelector('.modal.modal--active, .modal.modal--closing');
  if (!visibleModal) {
    document.body.style.overflow = '';
  }
}

function openModal(modal) {
  if (!modal) {
    return;
  }

  clearModalCloseTimer(modal);
  modal.classList.remove('modal--closing');
  resetModalScroll(modal);
  modal.classList.add('modal--active');
  resetModalScroll(modal);
  window.requestAnimationFrame(() => resetModalScroll(modal));
  window.setTimeout(() => resetModalScroll(modal), 80);
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal || !modal.classList.contains('modal--active') || modal.classList.contains('modal--closing')) {
    return;
  }

  const modalContent = modal.querySelector('.modal-content');

  function finishClose() {
    clearModalCloseTimer(modal);
    modal.classList.remove('modal--active', 'modal--closing');
    resetModalScroll(modal);
    releaseBodyScrollIfReady();
  }

  modal.classList.add('modal--closing');

  if (!modalContent) {
    finishClose();
    return;
  }

  const fallbackTimer = window.setTimeout(finishClose, 520);
  modalCloseTimers.set(modal, fallbackTimer);

  modalContent.addEventListener('animationend', (event) => {
    if (event.target === modalContent) {
      finishClose();
    }
  }, { once: true });
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
// 初回訪問 YouTube ポップアップ
// localStorage に 'introVideoShown' がなければ表示し、
// 閉じたタイミングで localStorage に保存して以降は非表示にする。
// ===================================
(function () {
  const STORAGE_KEY = 'introVideoShown';
  const popup = document.getElementById('intro-video-popup');

  if (!popup) return;

  // すでに訪問済みなら DOM ごと削除して何もしない
  if (localStorage.getItem(STORAGE_KEY)) {
    popup.remove();
    return;
  }

  // ページが落ち着いてからフェードイン（400ms 待機）
  document.body.style.overflow = 'hidden';
  setTimeout(() => popup.classList.add('intro-popup--active'), 400);

  let dismissed = false;
  function dismissPopup() {
    if (dismissed) return;
    dismissed = true;

    popup.classList.remove('intro-popup--active');
    localStorage.setItem(STORAGE_KEY, '1');

    // CSS トランジション完了後にクリーンアップ（backdrop 0.5s + inner 0.65s = 最長 0.65s）
    setTimeout(() => {
      const iframe = popup.querySelector('iframe');
      if (iframe) iframe.src = '';
      popup.remove();
      document.body.style.overflow = '';
    }, 700);
  }

  // 閉じるボタン
  const closeBtn = popup.querySelector('.intro-popup__close');
  if (closeBtn) closeBtn.addEventListener('click', dismissPopup);

  // バックドロップクリック
  const backdrop = popup.querySelector('.intro-popup__backdrop');
  if (backdrop) backdrop.addEventListener('click', dismissPopup);

  // ESC キー
  function onKeyDown(e) {
    if (e.key === 'Escape' && popup.isConnected) {
      dismissPopup();
      document.removeEventListener('keydown', onKeyDown);
    }
  }
  document.addEventListener('keydown', onKeyDown);
})();

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
