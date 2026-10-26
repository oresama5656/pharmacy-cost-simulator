(function (root) {
  'use strict';

  const Formatters = root.PharmacyApp.Formatters;
  const Presets = root.PharmacyApp.Presets;

  function calcAnnualImpactForMat(itemCost, state) {
    const annualRx = Number(state.annualRxCount) || 0;
    if (state.calculationMode === 'single') {
      return Math.round(itemCost * annualRx);
    }
    const activePat =
      state.patterns.find((p) => p.id === state.activePatternId) || state.patterns[0];
    const ratio = (Number(activePat.ratio) || 0) / 100;
    return Math.round(itemCost * ratio * annualRx);
  }

  function buildMaterialRowHtml(mat, itemState, itemCost, state) {
    const checked = Boolean(itemState && itemState.checked);
    const qty = itemState ? itemState.qty : 1;
    const annualItemCost = checked ? calcAnnualImpactForMat(itemCost, state) : 0;
    const rowClass = checked ? 'mat-row mat-row-checked' : 'mat-row mat-row-unchecked';
    const deleteBtn = mat.isCustom
      ? `<button type="button" class="btn-delete-custom" data-delete-mat="${mat.id}" title="この項目を削除">✕</button>`
      : '';

    return `
      <div class="${rowClass}" data-mat-row="${mat.id}">
        <label class="mat-check-label">
          <input
            type="checkbox"
            class="mat-checkbox"
            data-check-mat="${mat.id}"
            ${checked ? 'checked' : ''}
          />
          <span class="custom-check-visual"></span>
          <div class="mat-info">
            <span class="mat-name">${Formatters.escapeHtml(mat.name)}</span>
            <span class="mat-hint">${Formatters.escapeHtml(mat.hint || '')}</span>
          </div>
        </label>
        <div class="mat-controls">
          <div class="mat-field">
            <span class="mat-field-label">単価</span>
            <div class="mat-input-unit">
              <input
                type="number"
                class="mat-price-input"
                data-price-mat="${mat.id}"
                value="${mat.unitPrice}"
                min="0"
                max="10000"
                step="${mat.step || 0.5}"
              />
              <span>円/${Formatters.escapeHtml(mat.unit)}</span>
            </div>
          </div>
          <span class="mat-mult">×</span>
          <div class="mat-field">
            <span class="mat-field-label">数量</span>
            <div class="mat-stepper">
              <button type="button" class="step-btn" data-step-mat="${mat.id}" data-step-dir="-1">－</button>
              <input
                type="number"
                class="mat-qty-input"
                data-qty-mat="${mat.id}"
                value="${qty}"
                min="0"
                max="999"
                step="${mat.id === 'ippoka_pack' ? 1 : 0.5}"
              />
              <span class="mat-unit-text">${Formatters.escapeHtml(mat.unit)}</span>
              <button type="button" class="step-btn" data-step-mat="${mat.id}" data-step-dir="1">＋</button>
            </div>
          </div>
          <div class="mat-subtotal">
            <div class="mat-cost-rx">${checked ? Formatters.formatYen(itemCost, true) : '0円'}<span class="per-rx-sub">/回</span></div>
            <div class="mat-cost-annual">${checked && annualItemCost > 0 ? '年 ' + Formatters.formatManYen(annualItemCost) : '不使用'}</div>
          </div>
          ${deleteBtn}
        </div>
      </div>
    `;
  }

  function buildCategoryGroupHtml(category, materials, activePattern, activeMetrics, state) {
    const catMats = materials.filter((m) => m.categoryId === category.id);
    const catTotal = activeMetrics.categoryTotals[category.id] || 0;
    const rowsHtml = catMats
      .map((mat) => {
        const itemState = activePattern.items[mat.id] || { checked: false, qty: 1 };
        const itemCost = activeMetrics.itemCosts[mat.id] || 0;
        return buildMaterialRowHtml(mat, itemState, itemCost, state);
      })
      .join('');

    return `
      <div class="mat-category-block">
        <div class="mat-category-header">
          <span class="mat-cat-title">${Formatters.escapeHtml(category.label)}</span>
          <span class="mat-cat-subtotal">小計: <strong>${Formatters.formatYen(catTotal, true)}</strong> / 枚</span>
        </div>
        <div class="mat-rows-list">
          ${rowsHtml}
        </div>
      </div>
    `;
  }

  function buildAddCustomFormHtml() {
    const optionsHtml = Presets.CATEGORIES.map(
      (c) => `<option value="${c.id}">${Formatters.escapeHtml(c.label)}</option>`
    ).join('');

    return `
      <div class="custom-add-box">
        <div class="custom-add-title">➕ 店舗独自の資材・消耗品を追加する（封筒、カレンダー、サービス品など）</div>
        <div class="custom-add-form">
          <select id="custom-mat-category" class="custom-select" aria-label="カテゴリ">
            ${optionsHtml}
          </select>
          <input type="text" id="custom-mat-name" class="custom-text-input" placeholder="資材名（例：郵送用封筒・切手）" />
          <div class="custom-num-wrap">
            <input type="number" id="custom-mat-price" class="custom-num-input" placeholder="単価" value="10" min="0" step="0.5" />
            <span>円</span>
          </div>
          <div class="custom-num-wrap">
            <input type="text" id="custom-mat-unit" class="custom-unit-input" placeholder="単位" value="枚" />
          </div>
          <button type="button" id="btn-add-custom-mat" class="btn-add-custom">＋ リストに追加</button>
        </div>
      </div>
    `;
  }

  function renderChecklistSection(container, sim, state) {
    if (!container) return;
    const activePattern =
      state.patterns.find((p) => p.id === state.activePatternId) || state.patterns[0];
    const activeMetrics = sim.activePatternMetrics;

    const groupsHtml = Presets.CATEGORIES.map((cat) =>
      buildCategoryGroupHtml(cat, state.materials, activePattern, activeMetrics, state)
    ).join('');

    container.innerHTML = `
      <div class="checklist-panel-header">
        <div>
          <h2 class="panel-title">
            2. 使用する資材・費用の差し引きチェック（${activePattern.icon} ${Formatters.escapeHtml(activePattern.name)}）
          </h2>
          <p class="panel-subtitle">
            実際に使っている項目にチェック（✓）を入れ、枚数や単価を合わせるとリアルタイムに粗利単価が計算されます。
          </p>
        </div>
        <div class="checklist-total-badge">
          <span>このパターンの資材費合計</span>
          <strong>${Formatters.formatYen(activeMetrics.materialCost, true)} / 枚</strong>
        </div>
      </div>
      ${groupsHtml}
      ${buildAddCustomFormHtml()}
    `;
  }

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.RenderChecklist = { renderChecklistSection };
})(typeof window !== 'undefined' ? window : globalThis);
