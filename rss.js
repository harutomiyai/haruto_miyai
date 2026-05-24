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
  const MAX_ITEMS = 10;             // ← 表示件数

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

  try {
    const res  = await fetch(proxyUrl);
    const data = await res.json();
    const xml  = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, MAX_ITEMS);

    let html = '<div class="grid-container">';

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

      // サムネイル（media:thumbnail）が無い場合はデフォルト画像
      let thumbnail = '';
      const mediaThumb = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
      if (mediaThumb) thumbnail = mediaThumb.getAttribute('url') || '';
      if (!thumbnail) thumbnail = 'nophotos.jpg';

      // 概要テキスト（「続きをみる」以降の文字列を除去）
      const descEl = item.querySelector('description');
      let description = '';
      if (descEl) {
        const tmp = document.createElement('div');
        tmp.innerHTML = descEl.textContent;
        description = tmp.textContent.replace(/続きをみる[\s\S]*/g, '').trim();
      }

      html += `
        <a href="${escHtml(link)}" target="_blank" class="grid-item">
          <img src="${escHtml(thumbnail)}" alt="${escHtml(title)}">
          <p class="rss-date">${escHtml(date)}</p>
          <h3>${escHtml(title)}</h3>
          <p class="rss-description">${escHtml(description)}</p>
        </a>`;
    }

    html += `
      <a href="https://note.com/${NOTE_USER}" target="_blank" class="grid-item-1">
        <h3>全ての記事を見る</h3>
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
