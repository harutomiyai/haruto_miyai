// ===================================
// NOTE セクション — note RSS フィード読み込み
//
// GitHub Pages は静的ホスティングなので JavaScript で取得。
// note.com の CORS 制限を回避するため allorigins.win を経由。
//
// ▼ カスタマイズ箇所
//   NOTE_USER : note のユーザー名
//   MAX_ITEMS : 表示する最大記事数
// ===================================

(async function loadNoteRSS() {
  const NOTE_USER = 'haruto_miyai'; // ← note ユーザー名
  const MAX_ITEMS = 6;              // ← 表示件数（3カラム×2行）

  const feedUrl  = `https://note.com/${NOTE_USER}/rss`;
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(feedUrl);
  const container = document.getElementById('rss-container');

  /** HTML 特殊文字をエスケープ */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /**
   * サムネイルURLを取得（複数フォールバック）
   *   1. media:thumbnail — mrss 名前空間あり
   *   2. thumbnail        — 名前空間なし（パーサーによる差異を吸収）
   *   3. enclosure        — ポッドキャスト互換フォールバック
   *   4. description 内の <img> タグ
   */
  function getThumbnail(item) {
    // 1. media:thumbnail (with namespace)
    const mrss = 'http://search.yahoo.com/mrss/';
    const m1 = item.getElementsByTagNameNS(mrss, 'thumbnail')[0];
    if (m1?.getAttribute('url')) return m1.getAttribute('url');

    // 2. thumbnail without namespace
    const m2 = item.getElementsByTagName('thumbnail')[0];
    if (m2?.getAttribute('url')) return m2.getAttribute('url');

    // 3. enclosure
    const enc = item.querySelector('enclosure');
    if (enc?.getAttribute('url')) return enc.getAttribute('url');

    // 4. <img> in description HTML
    const descEl = item.querySelector('description');
    if (descEl) {
      const tmp = document.createElement('div');
      tmp.innerHTML = descEl.textContent;
      const src = tmp.querySelector('img')?.getAttribute('src');
      if (src) return src;
    }

    return null;
  }

  try {
    const res  = await fetch(proxyUrl);
    const data = await res.json();
    const xml  = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, MAX_ITEMS);

    // 3カラムグリッド
    let html = `<div class="note-grid">`;

    for (const item of items) {
      const title = item.querySelector('title')?.textContent?.trim() || '';

      // <link> 要素は XML のネームスペース問題があるため childNodes から取得
      let link = '#';
      for (const child of item.childNodes) {
        if (child.localName === 'link') {
          link = child.textContent?.trim() || '#';
          break;
        }
      }

      // 日付フォーマット（YYYY/MM/DD）
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      let date = '';
      if (pubDate) {
        const d = new Date(pubDate);
        date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      }

      // サムネイル取得
      const thumbnail = getThumbnail(item);
      const imgTag = thumbnail
        ? `<img src="${escHtml(thumbnail)}" alt="${escHtml(title)}" loading="lazy" onerror="this.style.display='none'">`
        : '';

      // 概要テキスト（「続きをみる」以降を除去、3行クランプは CSS で制御）
      const descEl = item.querySelector('description');
      let description = '';
      if (descEl) {
        const tmp = document.createElement('div');
        tmp.innerHTML = descEl.textContent;
        description = tmp.textContent.replace(/続きをみる[\s\S]*/g, '').trim();
      }

      html += `
          <a href="${escHtml(link)}" target="_blank" rel="noopener" class="note-card-item">
            <div class="activity-thumb">${imgTag}</div>
            <div class="activity-body">
              <p class="note-date">${escHtml(date)}</p>
              <h3>${escHtml(title)}</h3>
              ${description ? `<p class="note-excerpt">${escHtml(description)}</p>` : ''}
            </div>
          </a>`;
    }

    html += `</div>
      <div class="note-view-all">
        <a href="https://note.com/${NOTE_USER}" target="_blank" rel="noopener" class="note-view-all-link">
          ALL ARTICLES
        </a>
      </div>`;

    container.innerHTML = html;

  } catch (e) {
    container.innerHTML = `
      <p style="text-align:center; padding:40px">
        記事を読み込めませんでした。
        <a href="https://note.com/${NOTE_USER}" target="_blank">noteで確認する →</a>
      </p>`;
  }
})();
