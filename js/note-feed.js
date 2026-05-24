// ===================================
// NOTE セクション — note RSS フィード読み込み
//
// rss2json.com を利用して note RSS を JSON 変換。
// CORS プロキシ不要で安定して取得できる。
//
// ▼ カスタマイズ箇所
//   NOTE_USER : note のユーザー名
//   MAX_ITEMS : 表示する最大記事数
// ===================================

(async function loadNoteRSS() {
  const NOTE_USER = 'haruto_miyai'; // ← note ユーザー名
  const MAX_ITEMS = 5;              // ← 表示件数

  const feedUrl  = `https://note.com/${NOTE_USER}/rss`;
  const apiUrl   = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const container = document.getElementById('rss-container');

  /** HTML 特殊文字をエスケープ */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /** 日付フォーマット（YYYY/MM/DD） */
  function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  /** HTML タグを除去してプレーンテキストを返す */
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  try {
    const res  = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) {
      throw new Error('invalid response');
    }

    const items = data.items.slice(0, MAX_ITEMS);
    let html = `<div class="note-scroll-container">`;

    for (const item of items) {
      const title     = item.title || '';
      const link      = item.link  || `https://note.com/${NOTE_USER}`;
      const date      = fmtDate(item.pubDate);
      const thumbnail = item.thumbnail || item.enclosure?.link || '';

      // 概要（「続きをみる」以降・HTML タグを除去）
      let description = '';
      if (item.description) {
        description = stripHtml(item.description)
          .replace(/続きをみる[\s\S]*/g, '')
          .trim();
      }

      // サムネイルがある場合のみ thumb 領域を描画（ない場合はグレー枠を出さない）
      const thumbHtml = thumbnail
        ? `<div class="activity-thumb">
             <img src="${escHtml(thumbnail)}" alt="${escHtml(title)}" loading="lazy"
                  onerror="this.parentElement.remove()">
           </div>`
        : '';

      html += `
        <a href="${escHtml(link)}" target="_blank" rel="noopener" class="activity-card note-card">
          ${thumbHtml}
          <div class="activity-body">
            <span class="activity-platform">${escHtml(date)}</span>
            <h3>${escHtml(title)}</h3>
            ${description ? `<p>${escHtml(description)}</p>` : ''}
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
      <p class="rss-loading">
        <a href="https://note.com/${NOTE_USER}" target="_blank" rel="noopener"
           style="color: var(--color-muted);">
          noteで記事を読む →
        </a>
      </p>`;
  }
})();
