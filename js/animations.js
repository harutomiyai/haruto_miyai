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

// ===================================
// NOTE FEED セクション — note RSS フィード読み込み
//
// note の RSS は全記事に <media:thumbnail> でアイキャッチ画像を持つが、
// rss2json.com はこのタグを認識せず thumbnail が常に空になる。
// そのため優先順位は次の通り：
//   1. CORS プロキシ経由で RSS の生 XML を取得し media:thumbnail を直接読む
//   2. 失敗したら rss2json.com 経由で取得し、本文中の最初の <img> で代替
//   3. どちらも失敗したら note トップへのリンクのみ表示
// ===================================
(async function loadNoteFeed() {
  const NOTE_USER = 'haruto_miyai';
  const MAX_ITEMS = 3;
  const FEED_URL = `https://note.com/${NOTE_USER}/rss`;

  const list = document.getElementById('note-feed-list');
  if (!list) return;

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function firstImageFrom(html) {
    if (!html) return '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : '';
  }

  function renderCards(articles) {
    list.innerHTML = articles.slice(0, MAX_ITEMS).map(({ title, link, date, thumbnail }) => {
      const thumbHtml = thumbnail
        ? `<img class="note-feed-card__thumb" src="${escHtml(thumbnail)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;note-feed-card__thumb-fallback&quot;>note</span>'">`
        : `<span class="note-feed-card__thumb-fallback">note</span>`;

      return `
        <a href="${escHtml(link)}" target="_blank" rel="noopener" class="note-feed-card">
          <div class="note-feed-card__thumb-wrap">${thumbHtml}</div>
          <div class="note-feed-card__body">
            <span class="note-feed-card__date">${escHtml(date)}</span>
            <h3 class="note-feed-card__title">${escHtml(title)}</h3>
          </div>
        </a>`;
    }).join('');
  }

  // 方式1: CORS プロキシ経由で RSS 生 XML を取得し media:thumbnail を直接読む
  async function loadViaRawXml() {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(FEED_URL)}`;
    const res = await fetch(proxyUrl);
    const xmlText = await res.text();
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

    if (doc.querySelector('parsererror')) throw new Error('xml parse error');

    const items = Array.from(doc.querySelectorAll('item'));
    if (!items.length) throw new Error('no items in feed');

    return items.map((item) => {
      const thumbnail = item.getElementsByTagNameNS('*', 'thumbnail')[0]?.textContent.trim() || '';
      return {
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || FEED_URL,
        date: fmtDate(item.querySelector('pubDate')?.textContent),
        thumbnail: thumbnail || firstImageFrom(item.querySelector('description')?.textContent),
      };
    });
  }

  // 方式2: rss2json.com 経由（media:thumbnail は拾えないため本文中の <img> で代替）
  async function loadViaRss2Json() {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) {
      throw new Error('invalid response');
    }

    return data.items.map((item) => ({
      title: item.title || '',
      link: item.link || FEED_URL,
      date: fmtDate(item.pubDate),
      thumbnail: item.thumbnail || (item.enclosure && item.enclosure.link) || firstImageFrom(item.description),
    }));
  }

  try {
    let articles;
    try {
      articles = await loadViaRawXml();
    } catch (error) {
      console.warn('note feed: raw XML fetch failed, falling back to rss2json.', error);
      articles = await loadViaRss2Json();
    }
    renderCards(articles);
  } catch (error) {
    console.warn('note feed could not be loaded.', error);
    list.innerHTML = `
      <p class="note-feed-loading">
        <a href="https://note.com/${NOTE_USER}" target="_blank" rel="noopener">noteで記事を読む</a>
      </p>`;
  }
})();
