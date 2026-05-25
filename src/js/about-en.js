/* English “About PRIZM” static HTML (loaded when UI language uses English bundle) */
window.PRIZM_PAGE_ABOUT_EN = `
      <div class="page-header">
        <h1 class="page-header__title">About the PRIZM cryptocurrency</h1>
        <p class="page-header__subtitle">Technology overview, use cases, and legal notes (informational)</p>
      </div>

      <div class="card card--glow section-gap" style="background:linear-gradient(135deg,rgba(147,51,234,0.15),rgba(59,130,246,0.08));border-color:rgba(147,51,234,0.4)">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:240px">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--color-primary-light);margin-bottom:8px">Next-generation cryptocurrency</div>
            <h2 style="font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:12px">PRIZM (PZM)</h2>
            <p style="color:var(--text-muted);font-size:15px;line-height:1.7;max-width:540px">
              A 100% Proof-of-Stake blockchain live since 2016 without developer control of the network.
              Unique paramining, documented regulatory positioning, and zero inflation from new issuance.
            </p>
            <div class="flex gap-2 mt-4" style="flex-wrap:wrap">
              <span class="badge badge--success">✓ VFA (Malta)</span>
              <span class="badge badge--info">✓ Not a security (US legal memo)</span>
              <span class="badge badge--primary">✓ ~9 years of uptime</span>
              <span class="badge badge--neutral">✓ Open Source</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;min-width:280px">
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">⛓️</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Algorithm</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">100% PoS</div></div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">⚡</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Block</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">~60 sec</div></div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">💸</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Fee</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">0.5% (max 10 PZM)</div></div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">🌍</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Launch</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">2016</div></div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">💎</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Emission</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">10M PZM</div></div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px"><div style="font-size:20px;margin-bottom:4px">📊</div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">TX / day</div><div style="font-size:14px;font-weight:600;font-family:var(--font-mono)">up to 367,200</div></div>
          </div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">Paramining — unique mechanism</span>
          <span class="badge badge--primary">Patented</span>
        </div>
        <p style="color:var(--text-muted);line-height:1.8">
          Paramining is a linear-retrograde reward model for holding coins. It <strong style="color:var(--text)">does not mint new coins</strong>:
          rewards come from fees and circulation, preserving a closed supply economy.
        </p>
      </div>

      <div class="card section-gap">
        <div class="card__title mb-6">Technical advantages</div>
        <div class="grid-3">
          <div class="info-card"><div class="info-card__icon">🔮</div><div class="info-card__content"><h3>Transparent forging</h3><p>Deterministic block generation: the next forger is known in advance, reducing certain attack surfaces.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🏛️</div><div class="info-card__content"><h3>Decentralization</h3><p>No single HQ or key vault; the network can continue without the original team.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🔐</div><div class="info-card__content"><h3>Strong user control</h3><p>Keys are generated client-side; users retain full custody consistent with wallet design.</p></div></div>
          <div class="info-card"><div class="info-card__icon">📖</div><div class="info-card__content"><h3>Open source</h3><p>Java-based NEXT kernel — auditable and integratable without proprietary lock-in.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🌱</div><div class="info-card__content"><h3>Energy profile</h3><p>PoS avoids proof-of-work energy use — relevant for ESG-oriented narratives.</p></div></div>
          <div class="info-card"><div class="info-card__icon">⚡</div><div class="info-card__content"><h3>Throughput</h3><p>Designed for high daily transaction capacity with ~10 minute confirmation targets.</p></div></div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">Legal status (high level)</span>
          <span class="badge badge--success">Obtain independent advice</span>
        </div>
        <p style="font-size:13px;color:var(--text-muted);line-height:1.7">
          Malta VFA classification and US “not a security” legal analyses have been published by third-party firms.
          Tokens may also be registered as software/trademark in applicable jurisdictions. This portal does not provide legal or investment advice.
        </p>
      </div>

      <div class="card section-gap">
        <div class="card__title mb-6">Use cases</div>
        <div class="grid-3">
          <div class="info-card"><div class="info-card__icon">💳</div><div class="info-card__content"><h3>Micropayments</h3><p>Low fees suit content, API access, and streaming where card rails fail below ~$1.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🏦</div><div class="info-card__content"><h3>Cross-border</h3><p>Value transfer without traditional correspondent banking; settlement targets on the order of minutes.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🛒</div><div class="info-card__content"><h3>Marketplaces</h3><p>P2P trade with escrow-style flows where the chain provides auditability.</p></div></div>
          <div class="info-card"><div class="info-card__icon">📜</div><div class="info-card__content"><h3>Notarization</h3><p>Anchor document hashes on-chain for existence proofs without revealing content.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🌐</div><div class="info-card__content"><h3>IoT &amp; machines</h3><p>PoS-friendly footprint for device-to-device micro-settlement scenarios.</p></div></div>
          <div class="info-card"><div class="info-card__icon">🌍</div><div class="info-card__content"><h3>Financial access</h3><p>Wallet on a smartphone — storage and transfers without a legacy bank account.</p></div></div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="grid-2" style="gap:24px">
          <div>
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--color-success);margin-bottom:12px">Strengths</div>
            <ul style="margin:0;padding-left:1.2em;color:var(--text-muted);line-height:1.75;font-size:14px">
              <li>Unique paramining model (patented)</li>
              <li>Long-running network (since 2016)</li>
              <li>Documented regulatory memos (Malta / US analyses)</li>
              <li>No inflation from new issuance in the paramining design</li>
              <li>Open-source kernel — auditable</li>
              <li>PoS without proof-of-work energy use</li>
            </ul>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--color-danger);margin-bottom:12px">Risks &amp; limits</div>
            <ul style="margin:0;padding-left:1.2em;color:var(--text-muted);line-height:1.75;font-size:14px">
              <li>Limited liquidity vs major assets</li>
              <li>Lower brand recognition outside core regions</li>
              <li>High correlation with broad crypto cycles</li>
              <li>Regulatory uncertainty in some jurisdictions</li>
              <li>Smaller market-making depth</li>
            </ul>
          </div>
        </div>
      </div>

      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;font-size:12px;color:var(--text-faint);line-height:1.7;margin-bottom:var(--sp-8)">
        <strong style="color:var(--color-warning)">Disclaimer:</strong>
        This page is for education and information only. It is not investment advice. Crypto assets are volatile and risky.
      </div>
    `;
