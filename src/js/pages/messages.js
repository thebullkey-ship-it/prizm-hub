/* =====================================================
   PRIZM Hub — On-Chain Messages Page
   Module 7: messages feed, pagination, message reader
   ===================================================== */

const PageMessages = (() => {
  let currentPage = 0;
  const PAGE_SIZE = 20;
  let accountFilter = '';

  // ---- Message Bubbles ----
  function renderMessages(messages) {
    const t = I18n.t.bind(I18n);
    if (!messages || !messages.length) {
      return `<div class="empty-state">
        <div class="empty-state__icon">💬</div>
        <div class="empty-state__title">${Utils.esc(t('messages.empty'))}</div>
        <div class="empty-state__sub">${Utils.esc(t('messages.emptySub'))}</div>
      </div>`;
    }

    return messages.map(msg => {
      const sender   = msg.senderRS || msg.sender || '—';
      const receiver = msg.recipientRS || msg.recipient || '—';
      const time     = Utils.formatBcTime(msg.timestamp, { relative: true });
      const fullTime = Utils.formatBcTime(msg.timestamp);
      const msgText  = msg.message || msg.decryptedMessage || t('messages.encrypted');
      const isEncrypted = !msg.message && !!msg.encryptedMessage;

      return `<div class="msg-bubble">
        <div class="msg-bubble__header">
          <div class="flex gap-2" style="align-items:center;flex:1;min-width:0">
            <div style="width:28px;height:28px;border-radius:8px;background:var(--color-primary-dim);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">💬</div>
            <div style="min-width:0">
              <div class="flex gap-2" style="align-items:center;flex-wrap:wrap">
                <span class="addr" style="font-size:12px" onclick="Router.navigate('/accounts?account=${Utils.esc(sender)}')">${Utils.esc(Utils.shortenRS(sender))}</span>
                <span class="text-faint" style="font-size:11px">→</span>
                <span class="addr" style="font-size:12px" onclick="Router.navigate('/accounts?account=${Utils.esc(receiver)}')">${Utils.esc(Utils.shortenRS(receiver))}</span>
              </div>
              <div style="font-size:10px;color:var(--text-faint);margin-top:2px">TX: <span class="text-mono">${Utils.shorten(msg.transaction)}</span></div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="msg-bubble__time" title="${Utils.esc(fullTime)}">${Utils.esc(time)}</div>
            ${isEncrypted ? '<span class="badge badge--warning" style="margin-top:4px">' + Utils.esc(t('messages.encryptedBadge')) + '</span>' : ''}
          </div>
        </div>
        <div class="msg-bubble__text">
          ${isEncrypted
            ? `<em style="color:var(--text-faint)">${Utils.esc(t('messages.encryptedHint'))}</em>`
            : Utils.esc(msgText)}
        </div>
      </div>`;
    }).join('');
  }

  // ---- Load messages ----
  async function loadMessages(page = 0) {
    currentPage = page;
    const firstIndex = page * PAGE_SIZE;
    const lastIndex  = firstIndex + PAGE_SIZE - 1;
    const feedEl = document.getElementById('messages-feed');
    if (!feedEl) return;
    feedEl.innerHTML = `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`;

    try {
      let data;
      if (accountFilter) {
        data = await API.getPrunableMessages({ account: accountFilter, firstIndex, lastIndex });
      } else {
        data = await API.getAllPrunableMessages({ firstIndex, lastIndex });
      }

      const messages = data.prunableMessages || [];
      feedEl.innerHTML = renderMessages(messages);

      // Update pagination
      const prevBtn = document.getElementById('msg-prev-btn');
      const nextBtn = document.getElementById('msg-next-btn');
      const info    = document.getElementById('msg-page-info');
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = messages.length < PAGE_SIZE;
      if (info)    info.textContent = I18n.t('pagination.pageOnly', { n: page + 1 });
    } catch(err) {
      feedEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  function prevPage() { if (currentPage > 0) loadMessages(currentPage - 1); }
  function nextPage() { loadMessages(currentPage + 1); }

  function applyAccountFilter() {
    const val = document.getElementById('msg-account-filter').value.trim();
    accountFilter = val;
    currentPage = 0;
    loadMessages(0);
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');
    const accountParam = params && params.account;
    if (accountParam) accountFilter = accountParam;

    const tr = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(tr('messages.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(tr('messages.subtitle'))}</p>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">${Utils.esc(tr('messages.filterTitle'))}</span>
          <button class="btn btn--ghost btn--sm" onclick="PageMessages.clearFilter()">${Utils.esc(tr('messages.clearFilter'))}</button>
        </div>
        <div class="search-bar">
          <input class="input" id="msg-account-filter"
            placeholder="${Utils.esc(tr('messages.placeholder'))}"
            value="${Utils.esc(accountFilter)}"
            onkeydown="if(event.key==='Enter')PageMessages.applyAccountFilter()" />
          <button class="btn btn--primary" onclick="PageMessages.applyAccountFilter()">${Utils.esc(tr('messages.filterBtn'))}</button>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <span class="card__title">${Utils.esc(tr('messages.feedTitle'))}</span>
          <div class="flex gap-2" style="align-items:center">
            <button class="btn btn--ghost btn--sm" id="msg-prev-btn" onclick="PageMessages.prevPage()" disabled>${Utils.esc(tr('explorer.prev'))}</button>
            <span class="pagination__info" id="msg-page-info">${Utils.esc(tr('pagination.pageOnly', { n: 1 }))}</span>
            <button class="btn btn--ghost btn--sm" id="msg-next-btn" onclick="PageMessages.nextPage()">${Utils.esc(tr('explorer.next'))}</button>
          </div>
        </div>
        <div id="messages-feed">
          <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
        </div>
      </div>

      <div class="card mt-6">
        <div class="card__header">
          <span class="card__title">${Utils.esc(tr('messages.aboutTitle'))}</span>
        </div>
        <div class="grid-3">
          <div class="info-card">
            <div class="info-card__icon">📢</div>
            <div class="info-card__content">
              <h3>${Utils.esc(tr('messages.info1h'))}</h3>
              <p>${Utils.esc(tr('messages.info1p'))}</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-card__icon">🔒</div>
            <div class="info-card__content">
              <h3>${Utils.esc(tr('messages.info2h'))}</h3>
              <p>${Utils.esc(tr('messages.info2p'))}</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-card__icon">✂️</div>
            <div class="info-card__content">
              <h3>${Utils.esc(tr('messages.info3h'))}</h3>
              <p>${Utils.esc(tr('messages.info3p'))}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await loadMessages(0);
  }

  function clearFilter() {
    accountFilter = '';
    const input = document.getElementById('msg-account-filter');
    if (input) input.value = '';
    loadMessages(0);
  }

  return { render, prevPage, nextPage, applyAccountFilter, clearFilter };
})();
