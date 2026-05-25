/* =====================================================
   PRIZM Hub — About PRIZM Page
   Module 8: static informational content from analysis PDF
   ===================================================== */

const PageAbout = (() => {

  async function render(params) {
    const outlet = document.getElementById('router-outlet');
    if (I18n.getBundleKey() === 'en' && typeof PRIZM_PAGE_ABOUT_EN === 'string') {
      outlet.innerHTML = PRIZM_PAGE_ABOUT_EN;
      return;
    }

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">О криптовалюте PRIZM</h1>
        <p class="page-header__subtitle">Аналитический обзор технологий, применений и перспектив PZM</p>
      </div>

      <!-- Hero block -->
      <div class="card card--glow section-gap" style="background:linear-gradient(135deg,rgba(147,51,234,0.15),rgba(59,130,246,0.08));border-color:rgba(147,51,234,0.4)">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:240px">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--color-primary-light);margin-bottom:8px">Криптовалюта нового поколения</div>
            <h2 style="font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:12px">PRIZM (PZM)</h2>
            <p style="color:var(--text-muted);font-size:15px;line-height:1.7;max-width:540px">
              100% Proof-of-Stake блокчейн-платформа, функционирующая с 2016 года без вмешательства разработчиков.
              Уникальный механизм парамайнинга, подтверждённая правовая чистота, нулевая инфляция.
            </p>
            <div class="flex gap-2 mt-4" style="flex-wrap:wrap">
              <span class="badge badge--success">✓ VFA (Мальта)</span>
              <span class="badge badge--info">✓ Не ценная бумага (США)</span>
              <span class="badge badge--primary">✓ ~9 лет работы</span>
              <span class="badge badge--neutral">✓ Open Source</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;min-width:280px">
            ${[
              ['⛓️', 'Алгоритм', '100% PoS'],
              ['⚡', 'Блок', '~60 сек.'],
              ['💸', 'Комиссия', '0.5% (макс. 10 PZM)'],
              ['🌍', 'Старт', '2016 год'],
              ['💎', 'Эмиссия', '10 млн. PZM'],
              ['📊', 'TX/день', 'до 367 200'],
            ].map(([icon, label, val]) => `
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                <div style="font-size:20px;margin-bottom:4px">${icon}</div>
                <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">${label}</div>
                <div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">${val}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Paramining -->
      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">Парамайнинг — уникальный механизм</span>
          <span class="badge badge--primary">Запатентовано</span>
        </div>
        <div class="grid-2">
          <div>
            <p style="color:var(--text-muted);line-height:1.8;margin-bottom:16px">
              Ключевое отличие PRIZM от всех существующих криптовалют — запатентованный механизм <strong style="color:var(--text)">парамайнинга</strong>.
              Это линейно-ретроградная система начисления вознаграждения за хранение средств, которая
              <strong style="color:var(--text)">не создаёт новых монет</strong>, а перераспределяет уже существующие через комиссии.
            </p>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${[
                ['🛡️', 'Защита от инфляции', 'Не увеличивает общее количество монет — нулевая инфляция'],
                ['📈', 'Мотивация держать', 'Каждая монета — мини-майнинговая ферма. Больше монет = выше доходность'],
                ['⚖️', 'Экономическая справедливость', 'Постепенное перераспределение активов между участниками'],
                ['📱', 'Доступность', 'Не требует GPU или специального оборудования. Работает на смартфоне'],
              ].map(([icon, title, desc]) => `
                <div class="flex gap-3">
                  <div style="width:36px;height:36px;border-radius:8px;background:var(--color-primary-dim);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${icon}</div>
                  <div>
                    <div style="font-weight:600;font-size:13px;margin-bottom:2px">${title}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${desc}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
          <div>
            <div style="background:var(--surface-2);border:1px solid var(--border-light);border-radius:12px;padding:20px">
              <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-faint);margin-bottom:16px">Экономический цикл</div>
              <div style="display:flex;flex-direction:column;gap:0">
                ${[
                  { step: '01', label: 'Пользователи проводят транзакции', sub: 'Комиссия 0.5% (не более 10 PZM)', color: '#9333ea' },
                  { step: '02', label: 'Форжеры проверяют транзакции', sub: 'PoS: вес пропорционален балансу', color: '#a855f7' },
                  { step: '03', label: 'Форжеры получают комиссии', sub: 'Вознаграждение без новой эмиссии', color: '#3b82f6' },
                  { step: '04', label: 'Сеть продолжает работу', sub: 'Замкнутая самодостаточная экономика', color: '#10b981' },
                ].map((s, i, arr) => `
                  <div style="display:flex;gap:12px;align-items:flex-start;${i < arr.length - 1 ? 'padding-bottom:16px;border-left:2px solid rgba(147,51,234,0.3);margin-left:16px;padding-left:20px;' : 'padding-left:34px;'}">
                    ${i === 0 ? `<div style="width:32px;height:32px;border-radius:50%;background:${s.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-left:-16px;box-shadow:0 0 12px ${s.color}60">${s.step}</div>` :
                      `<div style="width:32px;height:32px;border-radius:50%;background:${s.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-left:-32px;box-shadow:0 0 12px ${s.color}60">${s.step}</div>`}
                    <div>
                      <div style="font-size:13px;font-weight:600;color:var(--text)">${s.label}</div>
                      <div style="font-size:11px;color:var(--text-faint);margin-top:2px">${s.sub}</div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Advantages -->
      <div class="card section-gap">
        <div class="card__title mb-6">Технические преимущества</div>
        <div class="grid-3">
          ${[
            { icon: '🔮', title: 'Transparent Forging', desc: 'Детерминированный алгоритм генерации блоков. Следующий форжер известен заранее — минимизирует риск атак, повышает скорость.' },
            { icon: '🏛️', title: 'Полная децентрализация', desc: 'Нет головного офиса, единого сервера или хранилища ключей. Сеть продолжит работу даже без первоначальных разработчиков.' },
            { icon: '🔐', title: 'Двойное шифрование', desc: 'Приватный ключ генерируется на стороне ноды и пользователя. Не может быть восстановлен — полный контроль пользователя.' },
            { icon: '📖', title: 'Открытый исходный код', desc: 'NEXT-Kernel на Java. Свободная интеграция без лицензионных ограничений. Независимый аудит безопасности.' },
            { icon: '🌱', title: 'Экологичность', desc: 'PoS не требует энергоёмкого майнинга. «Зелёная» криптовалюта для ESG-ориентированных инвесторов и регуляторов.' },
            { icon: '⚡', title: 'Высокая пропускная способность', desc: 'До 367 200 транзакций в сутки (~4.25 TPS). Подтверждение за 10 минут. Быстрее большинства межбанковских систем.' },
          ].map(c => `<div class="info-card"><div class="info-card__icon">${c.icon}</div><div class="info-card__content"><h3>${c.title}</h3><p>${c.desc}</p></div></div>`).join('')}
        </div>
      </div>

      <!-- Legal Status -->
      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">Правовой статус</span>
          <span class="badge badge--success">Двойная экспертиза</span>
        </div>
        <div class="grid-2">
          <div style="background:var(--surface-2);border:1px solid var(--border-light);border-radius:12px;padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:24px">🇲🇹</span>
              <div>
                <div style="font-weight:700">Мальта — VFA</div>
                <div style="font-size:12px;color:var(--text-faint)">Gonzi & Associates, 2021</div>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.7">
              PZM классифицируется как <strong style="color:var(--text)">Virtual Financial Asset (VFA)</strong> по мальтийскому законодательству.
              Допущен к обращению на лицензированных VFA-биржах. Не является электронными деньгами, ценной бумагой или производным инструментом.
            </p>
          </div>
          <div style="background:var(--surface-2);border:1px solid var(--border-light);border-radius:12px;padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:24px">🇺🇸</span>
              <div>
                <div style="font-weight:700">США — Не ценная бумага</div>
                <div style="font-size:12px;color:var(--text-faint)">Legal Kornet Law Firm, 2021</div>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.7">
              По тесту Хауи PZM <strong style="color:var(--text)">не является ценной бумагой</strong> по законодательству США.
              Не является кредитным инструментом, инструментом передачи риска или производным финансовым инструментом.
            </p>
          </div>
        </div>
        <div style="margin-top:16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px;font-size:13px;color:var(--text-muted)">
          ✅ Токен также зарегистрирован как <strong style="color:var(--text)">программное обеспечение</strong> (свидетельство №2018662596 от 11.10.2018) и
          <strong style="color:var(--text)">товарный знак</strong> в Роспатенте (свидетельство №706424 от 02.04.2019).
        </div>
      </div>

      <!-- Use Cases -->
      <div class="card section-gap">
        <div class="card__title mb-6">Сферы применения</div>
        <div class="grid-3">
          ${[
            { icon: '💳', title: 'Микроплатежи', desc: 'Комиссия 0.5% делает PZM идеальным для оплаты контента, доступа к API, стриминга. Традиционные системы не работают с суммами ниже $1.' },
            { icon: '🏦', title: 'Банковская сфера', desc: 'Трансграничные переводы вместо SWIFT. Любая сумма, любая точка мира за ~10 минут. Комиссия значительно ниже банковской.' },
            { icon: '🛒', title: 'Маркетплейсы', desc: 'P2P-торговля без посредников. Смарт-контракты для эскроу, подтверждения поставки и автоматического возврата средств.' },
            { icon: '📜', title: 'Нотариат и реестры', desc: 'Запись хэшей документов в блокчейн. Временная метка, подтверждение существования документа без раскрытия содержимого.' },
            { icon: '🌐', title: 'IoT и машинные расчёты', desc: 'PoS с низким энергопотреблением совместим с IoT-устройствами. Микротранзакции между сенсорами: энергия, данные, пропускная способность.' },
            { icon: '🌍', title: 'Финансовая инклюзия', desc: 'Более 1.4 млрд. человек без банковского счёта. PRIZM работает на любом смартфоне — переводы, хранение, торговля без банков.' },
          ].map(c => `<div class="info-card"><div class="info-card__icon">${c.icon}</div><div class="info-card__content"><h3>${c.title}</h3><p>${c.desc}</p></div></div>`).join('')}
        </div>
      </div>

      <!-- SWOT-style Analysis -->
      <div class="card section-gap">
        <div class="card__title mb-6">Сильные стороны и риски</div>
        <div class="grid-2">
          <div>
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--color-success);margin-bottom:12px">✓ Сильные стороны</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${[
                'Уникальный механизм парамайнинга (запатентован)',
                'Почти 9 лет непрерывной работы',
                'Двойная правовая экспертиза (Мальта + США)',
                'Нет инфляции — нет новой эмиссии',
                'Открытый код — возможность аудита',
                '«Зелёная» криптовалюта (PoS, без GPU)',
                'Работает на мобильных устройствах',
              ].map(s => `<div class="flex gap-2" style="font-size:13px;color:var(--text-muted)"><span style="color:var(--color-success)">✓</span>${s}</div>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--color-danger);margin-bottom:12px">✗ Риски и ограничения</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${[
                'Относительно низкая ликвидность на биржах',
                'Ограниченная известность вне СНГ',
                'Высокая корреляция с BTC-циклами',
                'Регуляторная неопределённость в ряде стран',
                'Отсутствие крупных маркет-мейкеров',
                'Небольшая команда разработчиков',
              ].map(r => `<div class="flex gap-2" style="font-size:13px;color:var(--text-muted)"><span style="color:var(--color-danger)">✗</span>${r}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;font-size:12px;color:var(--text-faint);line-height:1.7;margin-bottom:var(--sp-8)">
        ⚠️ <strong style="color:var(--color-warning)">Отказ от ответственности:</strong>
        Данный материал подготовлен исключительно в информационных и образовательных целях на основе открытой документации проекта PRIZM
        и юридических заключений Gonzi & Associates Advocates (Мальта, 2021) и Legal Kornet Law Firm Ltd. (2021).
        Ничто в данном материале не является инвестиционным советом или рекомендацией к покупке или продаже активов.
        Инвестиции в криптовалюты сопряжены с высоким риском.
      </div>
    `;
  }

  return { render };
})();
