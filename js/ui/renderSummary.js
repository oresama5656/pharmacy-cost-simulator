(function (root) {
  'use strict';

  const Formatters = root.PharmacyApp.Formatters;
  const Presets = root.PharmacyApp.Presets;

  function buildFormulaCardHtml(sim, state) {
    const modeLabel =
      state.calculationMode === 'mix' ? '店舗加重平均（全パターン合成）' : '選択中パターンのみ';
    return `
      <div class="kpi-card kpi-primary">
        <div class="kpi-header">
          <span class="kpi-badge">${Formatters.escapeHtml(modeLabel)}</span>
          <span class="kpi-margin">粗利率 ${Formatters.formatPercent(sim.profitMargin, 1)}</span>
        </div>
        <div class="kpi-title">1処方あたり 粗利単価（純技術料）</div>
        <div class="kpi-value-lg">${Formatters.formatYen(sim.grossProfitPerRx, true)}<span class="kpi-unit">/枚</span></div>
        <div class="kpi-formula">
          <span>技術料 <strong>${Formatters.formatYen(sim.techFeePerRx, true)}</strong></span>
          <span class="formula-minus">－</span>
          <span class="formula-cost">資材費 <strong>${Formatters.formatYen(sim.materialCostPerRx, true)}</strong></span>
        </div>
      </div>
    `;
  }

  function buildAnnualProfitCardHtml(sim) {
    const monthlyRx = Math.round(sim.annualRxCount / 12);
    return `
      <div class="kpi-card kpi-profit">
        <div class="kpi-header">
          <span class="kpi-badge badge-emerald">年間粗利シミュレーション</span>
          <span class="kpi-sub">月平均 約${monthlyRx.toLocaleString('ja-JP')}枚</span>
        </div>
        <div class="kpi-title">年間合計粗利（技術料ベース）</div>
        <div class="kpi-value-lg text-emerald">${Formatters.formatManYen(sim.annualGrossProfit)}</div>
        <div class="kpi-sub-detail">
          正確額: <strong>${Formatters.formatYen(sim.annualGrossProfit)}</strong>
          （年間技術料売上: ${Formatters.formatManYen(sim.annualTechRevenue)}）
        </div>
      </div>
    `;
  }

  function buildAhaCostCardHtml(sim) {
    const monthlyCost = Math.round(sim.annualMaterialCost / 12);
    return `
      <div class="kpi-card kpi-aha">
        <div class="kpi-header">
          <span class="kpi-badge badge-amber">💡 現場のコスト気づき指標</span>
          <span class="kpi-sub">月あたり 約${Formatters.formatYen(monthlyCost)}</span>
        </div>
        <div class="kpi-title">年間で消えている消耗品・資材費総額</div>
        <div class="kpi-value-lg text-rose">${Formatters.formatManYen(sim.annualMaterialCost)}<span class="kpi-unit">/年</span></div>
        <div class="kpi-aha-callout">
          😱 処方箋 <strong>約${sim.equivalentRxCount.toLocaleString('ja-JP')}枚分</strong> の技術料が紙・袋・資材代で消えています！
        </div>
      </div>
    `;
  }

  function buildDiffBannerHtml(sim, state) {
    const baseProfit = Number(state.baselineAnnualProfit) || sim.annualGrossProfit;
    const baseCostRx = Number(state.baselineMaterialCostPerRx) || sim.materialCostPerRx;
    const annualDiff = sim.annualGrossProfit - baseProfit;
    const rxDiff = Formatters.roundTo(baseCostRx - sim.materialCostPerRx, 1);

    let statusClass = 'diff-neutral';
    let messageHtml = `まずは現状のチェックを入れて<strong>「今の状態を基準にセット」</strong>を押し、見直したい項目を変更してみましょう！`;

    if (annualDiff > 0) {
      statusClass = 'diff-positive';
      messageHtml = `
        🎉 <strong>コスト改善インパクト！</strong> 基準と比べて1枚あたり <strong>${Formatters.formatYen(rxDiff, true)}</strong> コスト減
        ➔ 年間で <strong class="diff-highlight">${Formatters.formatSignedYen(annualDiff)}</strong> 粗利が増えます！
      `;
    } else if (annualDiff < 0) {
      statusClass = 'diff-negative';
      messageHtml = `
        ⚠️ 基準と比べて資材費が増加しています（年間 <strong class="diff-highlight">${Formatters.formatSignedYen(annualDiff)}</strong>）。
      `;
    }

    return `
      <div class="diff-banner ${statusClass}">
        <div class="diff-text">${messageHtml}</div>
        <div class="diff-actions">
          <button type="button" id="btn-lock-baseline" class="btn-baseline" title="現在の設定をBefore（比較元）として記憶します">
            📌 今の状態を「現状（基準）」にセット
          </button>
          <button type="button" id="btn-reset-all" class="btn-reset" title="初期プリセットに戻します">
            ↺ 初期値に戻す
          </button>
        </div>
      </div>
    `;
  }

  function buildAnnualRxControlHtml(state) {
    const rx = Number(state.annualRxCount) || 24000;
    const monthly = Math.round(rx / 12);
    const presetButtons = Presets.ANNUAL_RX_PRESETS.map((p) => {
      const active = p.value === rx ? 'active' : '';
      return `<button type="button" class="chip-btn rx-preset-btn ${active}" data-rx="${p.value}">${Formatters.escapeHtml(p.label)}</button>`;
    }).join('');

    return `
      <div class="rx-volume-bar">
        <div class="rx-volume-top">
          <div class="rx-volume-label">
            <span class="section-icon">📊</span>
            <div>
              <strong>年間処方箋枚数（店舗ボリューム）</strong>
              <span class="rx-monthly-badge">月平均 約 <strong>${monthly.toLocaleString('ja-JP')}</strong> 枚 / 日平均 約 <strong>${Math.round(monthly / 25)}</strong> 枚</span>
            </div>
          </div>
          <div class="rx-input-group">
            <input type="number" id="input-annual-rx" class="rx-number-input" value="${rx}" min="1000" max="200000" step="1000" />
            <span class="unit-label">枚 / 年</span>
          </div>
        </div>
        <div class="rx-slider-row">
          <input type="range" id="slider-annual-rx" class="rx-range-slider" min="3000" max="100000" step="1000" value="${Math.min(rx, 100000)}" />
        </div>
        <div class="rx-presets-row">
          <span class="preset-caption">ワンタッチ設定:</span>
          ${presetButtons}
        </div>
      </div>
    `;
  }

  function renderSummarySection(container, sim, state) {
    if (!container) return;
    container.innerHTML = `
      ${buildAnnualRxControlHtml(state)}
      <div class="kpi-grid">
        ${buildFormulaCardHtml(sim, state)}
        ${buildAnnualProfitCardHtml(sim)}
        ${buildAhaCostCardHtml(sim)}
      </div>
      ${buildDiffBannerHtml(sim, state)}
    `;
  }

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.RenderSummary = { renderSummarySection };
})(typeof window !== 'undefined' ? window : globalThis);
