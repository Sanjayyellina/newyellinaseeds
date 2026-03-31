// ============================================================
// BIN TILE V2 — Premium circular gauge design
// Yellina Seeds Operations Platform
// ============================================================
"use strict";

function renderBinTile(bin, isManager = false) {
  const sc = `s-${bin.status}`;
  const clickAction = isManager ? `onclick="openBinModal(${bin.id})"` : '';
  const m = parseFloat(bin.currentMoisture) || 0;
  const hours = hoursDiff(bin.intakeDateTS);
  const TARGET_HRS = 109;
  const hoursPct = Math.min(100, Math.round((hours / TARGET_HRS) * 100));

  // Status label
  const statusLabels = { intake: 'Intake', drying: 'Drying', shelling: 'Shelling', empty: 'Empty' };
  const statusLabel = statusLabels[bin.status] || bin.status;

  // Airflow label
  const airflowOn = bin.airflow === 'up';

  // Moisture gauge: pct mapped 0–100 based on raw moisture % (cap at 40% = 100% ring)
  // The ring shows how much moisture still remains (high = bad = full ring)
  const MAX_MOISTURE = 40;
  const gaugePct = Math.min(100, Math.round((m / MAX_MOISTURE) * 100));

  // Fill pct (qty vs bin capacity — assume 60,000 kg max per bin)
  const BIN_CAPACITY = 60000;
  const fillPct = bin.qty ? Math.min(100, Math.round((bin.qty / BIN_CAPACITY) * 100)) : 0;

  // Elapsed time display
  const days = Math.floor(hours / 24);
  const remHrs = hours % 24;
  const elapsedStr = days > 0 ? `${days}d ${remHrs}h` : `${hours}h`;

  // Format qty
  const qtyStr = bin.qty ? parseInt(bin.qty).toLocaleString('en-IN') + ' Kg' : '—';

  /* ── EMPTY BIN ── */
  if (bin.status === 'empty') {
    return `<div class="bin-tile ${sc}" ${clickAction}>
      <div class="bin-header">
        <div class="bin-number">BIN ${String(bin.id).padStart(2,'0')}</div>
        <div class="bin-status-pill">${statusLabel}</div>
      </div>
      <div class="bin-gauge-wrap">
        <div class="bin-gauge" style="--pct:0;">
          <div class="bin-gauge-inner">
            <div class="bin-gauge-val" style="font-size:13px;color:var(--t5);">—</div>
            <div class="bin-gauge-sub">empty</div>
          </div>
        </div>
      </div>
      <div class="bin-hybrid" style="color:var(--t5);">Available</div>
    </div>`;
  }

  /* ── ACTIVE BIN ── */
  return `<div class="bin-tile ${sc}" ${clickAction}>
    <div class="bin-header">
      <div class="bin-number">BIN ${String(bin.id).padStart(2,'0')}</div>
      <div class="bin-status-pill">${statusLabel}</div>
    </div>

    <div class="bin-gauge-wrap">
      <div class="bin-gauge" style="--pct:${gaugePct};">
        <div class="bin-gauge-inner">
          <div class="bin-gauge-val">${m.toFixed(1)}%</div>
          <div class="bin-gauge-sub">moisture</div>
        </div>
      </div>
    </div>

    <div class="bin-hybrid">${bin.hybrid || '—'}</div>
    <div class="bin-qty">${qtyStr}</div>

    <div class="bin-fill-track">
      <div class="bin-fill-fill" style="width:${fillPct}%;"></div>
    </div>
    <div class="bin-fill-label">${fillPct}% capacity</div>

    <div class="bin-elapsed">
      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${elapsedStr} in bin
    </div>

    <div class="bin-airflow ${airflowOn ? 'on' : 'off'}">
      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        ${airflowOn
          ? '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>'
          : '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2"/>'}
      </svg>
      ${airflowOn ? 'Airflow ON' : 'Airflow OFF'}
    </div>
  </div>`;
}
