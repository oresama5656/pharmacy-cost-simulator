(function (root) {
  'use strict';

  const Formatters = root.PharmacyApp.Formatters;

  function buildModeToggleHtml(state) {
    const isMix = state.calculationMode === 'mix';
    return `
      <div class="pattern-header-row">
        <div>
          <h2 class="panel-title">1. 処方パターンの選択と技術料単価</h2>
          <p class="panel-subtitle">処方内容によって使う袋や紙の量は変わります。タブを切り替えてパターンごとの資材をチェックできます。</p>
        </div>
        <div class="mode-switch-group" role="group" aria-label="計算モード切替">
          <button type="button" class="mode-btn ${isMix ? 'active' : ''}" data-mode="mix">
            📊 3パターン比率ミックス（リアル）
          </button>
          <button type="button" class="mode-btn ${!isMix ? 'active' : ''}" data-mode="single">
            🎯 選択中のパターンのみ（シンプル）
          </button>
        </div>
      </div>
    `;
  }

  function buildPatternCardHtml(pattern, metrics, isSelected, isMix) {
    const activeClass = isSelected ? 'pattern-card-active' : '';
    const ratioBadge = isMix
      ? `<span class="pattern-ratio-pill">構成比 ${pattern.ratio}%</span>`
      : '';
    return `
      <div class="pattern-card ${activeClass}" data-pattern-select="${pattern.id}">
        <div class="pattern-card-top">
          <span class="pattern-icon">${pattern.icon}</span>
          <div class="pattern-title-wrap">
            <div class="pattern-name">${Formatters.escapeHtml(pattern.name)}</div>
            <div class="pattern-desc">${Formatters.escapeHtml(pattern.description)}</div>
          </div>
          ${ratioBadge}
        </div>
        <div class="pattern-metrics-row">
          <div class="pm-item">
            <span class="pm-label">技術料単価</span>
            <span class="pm-val">${Formatters.formatYen(metrics.techFee)}</span>
          </div>
          <span class="pm-operator">－</span>
          <div class="pm-item pm-cost">
            <span class="pm-label">使用資材費</span>
            <span class="pm-val text-rose">${Formatters.formatYen(metrics.materialCost, true)}</span>
          </div>
          <span class="pm-operator">＝</span>
          <div class="pm-item pm-profit">
            <span class="pm-label">粗利単価</span>
            <span class="pm-val text-emerald">${Formatters.formatYen(metrics.grossProfit, true)}</span>
          </div>
        </div>
        ${isMix ? buildRatioSliderHtml(pattern) : ''}
      </div>
    `;
  }

  function buildRatioSliderHtml(pattern) {
    return `
      <div class="pattern-ratio-control" data-stop-prop="true">
        <label class="ratio-slider-label">
          <span>店舗の処方割合: <strong>${pattern.ratio}%</strong></span>
          <input
            type="range"
            class="ratio-slider"
            data-ratio-pattern="${pattern.id}"
            min="0"
            max="100"
            step="5"
            value="${pattern.ratio}"
          />
        </label>
      </div>
    `;
  }

  function buildActiveTechFeeEditorHtml(activePattern, activeMetrics) {
    const quickFees = [1500, 1850, 2150, 2600, 3100, 4000];
    const quickBtns = quickFees
      .map((fee) => {
        const isCurrent = Math.round(activePattern.techFee) === fee ? 'active' : '';
        return `<button type="button" class="chip-btn tech-preset-btn ${isCurrent}" data-tech-preset="${fee}">${fee.toLocaleString('ja-JP')}円</button>`;
      })
      .join('');

    return `
      <div class="tech-fee-editor">
        <div class="tech-fee-left">
          <span class="active-pattern-indicator">${activePattern.icon} 現在編集中: <strong>${Formatters.escapeHtml(activePattern.name)}</strong></span>
          <span class="tech-fee-caption">この処方パターンの平均技術料単価（調剤基本料＋管理料＋指導料・加算等）</span>
        </div>
        <div class="tech-fee-right">
          <div class="tech-input-wrap">
            <label for="input-tech-fee" class="sr-only">技術料単価</label>
            <input
              type="number"
              id="input-tech-fee"
              class="tech-fee-input"
              value="${activePattern.techFee}"
              min="0"
              max="50000"
              step="10"
            />
            <span class="unit-label">円 / 枚</span>
          </div>
          <div class="tech-quick-chips">
            ${quickBtns}
          </div>
        </div>
        <div class="tech-fee-summary-strip">
          <span>${Formatters.escapeHtml(activePattern.name)}の粗利単価:</span>
          <strong>技術料 ${Formatters.formatYen(activeMetrics.techFee)} － 資材費 ${Formatters.formatYen(activeMetrics.materialCost, true)} ＝ <span class="text-emerald">${Formatters.formatYen(activeMetrics.grossProfit, true)}</span></strong>
        </div>
      </div>
    `;
  }

  function renderPatternsSection(container, sim, state) {
    if (!container) return;
    const isMix = state.calculationMode === 'mix';
    const cardsHtml = state.patterns
      .map((pat, idx) => {
        const metrics = sim.patternMetricsList[idx];
        const isSelected = pat.id === state.activePatternId;
        return buildPatternCardHtml(pat, metrics, isSelected, isMix);
      })
      .join('');

    const activePattern =
      state.patterns.find((p) => p.id === state.activePatternId) || state.patterns[0];

    container.innerHTML = `
      ${buildModeToggleHtml(state)}
      <div class="pattern-cards-grid">
        ${cardsHtml}
      </div>
      ${buildActiveTechFeeEditorHtml(activePattern, sim.activePatternMetrics)}
    `;
  }

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.RenderPatterns = { renderPatternsSection };
})(typeof window !== 'undefined' ? window : globalThis);
