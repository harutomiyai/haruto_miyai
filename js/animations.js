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

    // ヒーローのスクロールキュー: スクロール開始でフェードアウト
    const cue = document.querySelector(".scroll-cue");
    if (cue) {
      gsap.to(cue, {
        opacity: 0,
        immediateRender: false,
        scrollTrigger: {
          trigger: cue.closest("section"),
          scrub,
          start: "top top",
          end: "10% top",
        },
      });
    }

    // HISTORY セクション: 各項目をフェード＆スライドイン
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".history-item").forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 24,
          scrollTrigger: {
            trigger: item,
            scrub,
            start: "top 92%",
            end: "top 62%",
          },
        });
      });
    }
  } catch (error) {
    console.warn("Scroll animation fallback could not be loaded.", error);
  }
}

initScrollAnimationFallback();

// ===================================
// WORK セクション — 縦スクロールで横に流れるギャラリー
// sticky コンテナを画面に固定し、セクション内の縦スクロール量を
// トラックの translateX に変換する。横移動が終わると通常の縦スクロールに戻る。
// ===================================
const worksSection = document.querySelector('.works-section');
const worksTrack   = document.querySelector('.works-track');

if (worksSection && worksTrack) {
  // JS有効時のみ transform 方式に切り替え（無効時は overflow-x: auto のまま）
  worksSection.classList.add('works-horizontal');

  let worksMaxX = 0;

  function scrollWorks() {
    if (worksMaxX <= 0) {
      worksTrack.style.transform = '';
      return;
    }
    const top = worksSection.getBoundingClientRect().top;
    const progress = Math.min(Math.max(-top / worksMaxX, 0), 1);
    worksTrack.style.transform = `translate3d(${-progress * worksMaxX}px, 0, 0)`;
  }

  function layoutWorks() {
    worksMaxX = Math.max(worksTrack.scrollWidth - window.innerWidth, 0);
    // セクション高さ = 画面1枚分 + 横移動量（＝sticky が張り付く縦スクロール距離）
    worksSection.style.height = `${window.innerHeight + worksMaxX}px`;
    scrollWorks();
  }

  window.addEventListener('scroll', scrollWorks, { passive: true });
  window.addEventListener('resize', layoutWorks);
  window.addEventListener('load', layoutWorks);
  layoutWorks();
}
