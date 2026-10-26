(function (root) {
  'use strict';

  const Formatters = root.PharmacyApp.Formatters;
  const Presets = root.PharmacyApp.Presets;

  function buildCostBreakdownHtml(sim) {
    const total = sim.baseMaterialCostPerRx || 0.01;
    const annualRx = sim.annualRxCount;

    const barsHtml = Presets.CATEGORIES.map((cat) => {
      const val = Formatters.roundTo(sim.categoryTotals[cat.id] || 0, 1);
      const pct = sim.baseMaterialCostPerRx > 0 ? Math.min(100, (val / total) * 100) : 0;
      const annualCat = Math.round(val * annualRx);
      return `
        <div class="breakdown-row">
          <div class="breakdown-label-row">
            <span class="breakdown-cat-name">${Formatters.escapeHtml(cat.label)}</span>
            <span class="breakdown-cat-stats">
              <strong>${Formatters.formatYen(val, true)}</strong>/枚
              （年 <strong>${Formatters.formatManYen(annualCat)}</strong> ・ ${Formatters.formatPercent(pct, 0)}）
            </span>
          </div>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill fill-${cat.badgeColor}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="side-card breakdown-card">
        <h3 class="side-card-title">📊 どこに費用がかかっている？（資材内訳）</h3>
        <p class="side-card-desc">現在の設定における1処方あたりのカテゴリ別コスト構造です。</p>
        <div class="breakdown-list">
          ${barsHtml}
        </div>
      </div>
    `;
  }

  function buildKaizenItemHtml(idea) {
    const activeClass = idea.isSelected ? 'kaizen-card-active' : '';
    const hasEffect = idea.annualSavings > 0;
    const badgeHtml = hasEffect
      ? `<span class="kaizen-saving-badge">年間 ＋${Formatters.formatManYen(idea.annualSavings)}</span>`
      : `<span class="kaizen-saving-badge badge-muted">対象資材OFF</span>`;

    return `
      <label class="kaizen-item-card ${activeClass}">
        <div class="kaizen-item-top">
          <input
            type="checkbox"
            class="kaizen-toggle-input"
            data-kaizen-id="${idea.id}"
            ${idea.isSelected ? 'checked' : ''}
          />
          <span class="kaizen-switch-ui"></span>
          <span class="kaizen-tag">${Formatters.escapeHtml(idea.tag)}</span>
          ${badgeHtml}
        </div>
        <div class="kaizen-item-title">${Formatters.escapeHtml(idea.title)}</div>
        <div class="kaizen-item-detail">
          ${Formatters.escapeHtml(idea.detail)}
          （1処方あたり <strong>-${Formatters.formatYen(idea.savingsPerRx, true)}</strong>）
        </div>
      </label>
    `;
  }

  function buildKaizenSummaryCalloutHtml(sim) {
    if (sim.annualKaizenSavings <= 0) {
      return `
        <div class="kaizen-motivation-box kaizen-idle">
          👆 上の「改善スイッチ」をONにすると、<strong>「コレを変えたら年間いくら浮くか？」</strong>をワンタッチで試せます！
        </div>
      `;
    }
    const eqRx =
      sim.techFeePerRx > 0 ? Math.round(sim.annualKaizenSavings / sim.techFeePerRx) : 0;
    return `
      <div class="kaizen-motivation-box kaizen-active-callout">
        <div class="km-headline">
          🔥 改善スイッチ合計効果：年間 <strong>＋${Formatters.formatYen(sim.annualKaizenSavings)}</strong> の粗利UP！
        </div>
        <div class="km-sub">
          これは新規の処方箋を <strong>年間 ${eqRx.toLocaleString('ja-JP')} 枚</strong> 増やすのと同じ利益インパクトです！
        </div>
      </div>
    `;
  }

  function renderKaizenSection(container, sim) {
    if (!container) return;
    const ideasHtml = sim.evaluatedKaizen.map((idea) => buildKaizenItemHtml(idea)).join('');

    container.innerHTML = `
      <div class="side-card kaizen-panel">
        <div class="kaizen-header">
          <span class="kaizen-flame">🚀</span>
          <div>
            <h3 class="side-card-title">「コレ変えたらいくら浮く？」改善シミュレーター</h3>
            <p class="side-card-desc">現場のちょっとした工夫で、年間どれだけ利益が増えるかスイッチを入れて体験してみましょう！</p>
          </div>
        </div>
        ${buildKaizenSummaryCalloutHtml(sim)}
        <div class="kaizen-list">
          ${ideasHtml}
        </div>
      </div>
      ${buildCostBreakdownHtml(sim)}
    `;
  }

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.RenderKaizen = { renderKaizenSection };
})(typeof window !== 'undefined' ? window : globalThis);
