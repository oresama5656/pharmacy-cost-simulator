(function (root) {
  'use strict';

  const Formatters = root.PharmacyApp.Formatters;
  const Presets = root.PharmacyApp.Presets;
  const Calculator = root.PharmacyApp.Calculator;
  const StateManager = root.PharmacyApp.StateManager;
  const RenderSummary = root.PharmacyApp.RenderSummary;
  const RenderPatterns = root.PharmacyApp.RenderPatterns;
  const RenderChecklist = root.PharmacyApp.RenderChecklist;
  const RenderKaizen = root.PharmacyApp.RenderKaizen;

  let appState = null;

  function renderAll() {
    const sim = Calculator.runFullSimulation(appState, Presets.KAIZEN_IDEAS);
    RenderSummary.renderSummarySection(
      document.getElementById('summary-section'),
      sim,
      appState
    );
    RenderPatterns.renderPatternsSection(
      document.getElementById('patterns-section'),
      sim,
      appState
    );
    RenderChecklist.renderChecklistSection(
      document.getElementById('checklist-section'),
      sim,
      appState
    );
    RenderKaizen.renderKaizenSection(
      document.getElementById('kaizen-section'),
      sim
    );
  }

  function handleSummaryEvents(target) {
    if (target.id === 'btn-lock-baseline') {
      const sim = Calculator.runFullSimulation(appState, Presets.KAIZEN_IDEAS);
      StateManager.lockBaseline(appState, sim);
      renderAll();
      return true;
    }
    if (target.id === 'btn-reset-all') {
      appState = StateManager.createInitialState();
      StateManager.saveState(appState);
      renderAll();
      return true;
    }
    const rxPresetBtn = target.closest('[data-rx]');
    if (rxPresetBtn) {
      appState.annualRxCount = Number(rxPresetBtn.dataset.rx) || 24000;
      StateManager.saveState(appState);
      renderAll();
      return true;
    }
    return false;
  }

  function handlePatternEvents(target) {
    const modeBtn = target.closest('[data-mode]');
    if (modeBtn) {
      appState.calculationMode = modeBtn.dataset.mode;
      StateManager.saveState(appState);
      renderAll();
      return true;
    }
    const techPreset = target.closest('[data-tech-preset]');
    if (techPreset) {
      const pat = StateManager.getActivePattern(appState);
      pat.techFee = Number(techPreset.dataset.techPreset) || 1850;
      StateManager.saveState(appState);
      renderAll();
      return true;
    }
    if (target.closest('[data-stop-prop]')) return false;
    const patCard = target.closest('[data-pattern-select]');
    if (patCard) {
      appState.activePatternId = patCard.dataset.patternSelect;
      StateManager.saveState(appState);
      renderAll();
      return true;
    }
    return false;
  }

  function handleChecklistClickEvents(target) {
    const stepBtn = target.closest('[data-step-mat]');
    if (stepBtn) {
      const matId = stepBtn.dataset.stepMat;
      const dir = Number(stepBtn.dataset.stepDir) || 1;
      const pat = StateManager.getActivePattern(appState);
      const curQty = pat.items[matId] ? Number(pat.items[matId].qty) || 0 : 0;
      const delta = matId === 'ippoka_pack' ? 5 * dir : 0.5 * dir;
      StateManager.updateMaterialQty(appState, matId, Formatters.roundTo(Math.max(0, curQty + delta), 1));
      renderAll();
      return true;
    }
    const delBtn = target.closest('[data-delete-mat]');
    if (delBtn) {
      StateManager.removeCustomMaterial(appState, delBtn.dataset.deleteMat);
      renderAll();
      return true;
    }
    if (target.id === 'btn-add-custom-mat') {
      handleAddCustomMaterial();
      return true;
    }
    return false;
  }

  function handleAddCustomMaterial() {
    const nameEl = document.getElementById('custom-mat-name');
    const catEl = document.getElementById('custom-mat-category');
    const priceEl = document.getElementById('custom-mat-price');
    const unitEl = document.getElementById('custom-mat-unit');
    if (!nameEl || !nameEl.value.trim()) {
      if (nameEl) nameEl.focus();
      return;
    }
    StateManager.addCustomMaterial(appState, {
      name: nameEl.value,
      categoryId: catEl ? catEl.value : 'bag',
      unitPrice: priceEl ? Number(priceEl.value) : 10,
      unit: unitEl ? unitEl.value : '個',
      qty: 1
    });
    renderAll();
  }

  function handleChangeEvent(e) {
    const t = e.target;
    if (t.id === 'input-annual-rx' || t.id === 'slider-annual-rx') {
      appState.annualRxCount = Formatters.clampNumber(t.value, 500, 500000);
      StateManager.saveState(appState);
      renderAll();
      return;
    }
    if (t.id === 'input-tech-fee') {
      const pat = StateManager.getActivePattern(appState);
      pat.techFee = Formatters.clampNumber(t.value, 0, 50000);
      StateManager.saveState(appState);
      renderAll();
      return;
    }
    if (t.dataset.ratioPattern) {
      StateManager.updatePatternRatio(appState, t.dataset.ratioPattern, t.value);
      renderAll();
      return;
    }
    handleItemAndKaizenChange(t);
  }

  function handleItemAndKaizenChange(t) {
    if (t.dataset.checkMat) {
      StateManager.toggleMaterialCheck(appState, t.dataset.checkMat, t.checked);
      renderAll();
      return;
    }
    if (t.dataset.qtyMat) {
      StateManager.updateMaterialQty(appState, t.dataset.qtyMat, t.value);
      renderAll();
      return;
    }
    if (t.dataset.priceMat) {
      StateManager.updateMaterialUnitPrice(appState, t.dataset.priceMat, t.value);
      renderAll();
      return;
    }
    if (t.dataset.kaizenId) {
      const kId = t.dataset.kaizenId;
      appState.activeKaizenIds = appState.activeKaizenIds || {};
      appState.activeKaizenIds[kId] = Boolean(t.checked);
      StateManager.saveState(appState);
      renderAll();
    }
  }

  function initApp() {
    appState = StateManager.loadState();
    renderAll();

    document.addEventListener('click', (e) => {
      if (handleSummaryEvents(e.target)) return;
      if (handlePatternEvents(e.target)) return;
      handleChecklistClickEvents(e.target);
    });

    document.addEventListener('change', handleChangeEvent);
    document.addEventListener('input', (e) => {
      if (e.target.id === 'slider-annual-rx') {
        handleChangeEvent(e);
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.App = { initApp, renderAll };
})(typeof window !== 'undefined' ? window : globalThis);
