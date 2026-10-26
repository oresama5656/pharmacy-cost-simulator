(function (root) {
  'use strict';

  const Formatters =
    (root.PharmacyApp && root.PharmacyApp.Formatters) ||
    (typeof require !== 'undefined' ? require('../utils/formatters.js') : null);
  const Presets =
    (root.PharmacyApp && root.PharmacyApp.Presets) ||
    (typeof require !== 'undefined' ? require('../data/presets.js') : null);
  const Calculator =
    (root.PharmacyApp && root.PharmacyApp.Calculator) ||
    (typeof require !== 'undefined' ? require('./calculator.js') : null);

  const STORAGE_KEY = 'pharmacy_cost_simulator_v1';

  function createInitialState() {
    const baseState = {
      calculationMode: 'mix', // 'mix' | 'single'
      activePatternId: 'standard',
      annualRxCount: 24000, // 月2,000枚 × 12ヶ月
      materials: Formatters.deepClone(Presets.DEFAULT_MATERIALS),
      patterns: Formatters.deepClone(Presets.DEFAULT_PATTERNS),
      activeKaizenIds: {},
      baselineAnnualProfit: null,
      baselineMaterialCostPerRx: null
    };
    const sim = Calculator.runFullSimulation(baseState, Presets.KAIZEN_IDEAS);
    baseState.baselineAnnualProfit = sim.annualGrossProfit;
    baseState.baselineMaterialCostPerRx = sim.materialCostPerRx;
    return baseState;
  }

  function loadState() {
    if (typeof localStorage === 'undefined') return createInitialState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.materials) || !Array.isArray(parsed.patterns)) {
        return createInitialState();
      }
      return parsed;
    } catch (_e) {
      return createInitialState();
    }
  }

  function saveState(state) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_e) {
      // ignore storage errors
    }
  }

  function getActivePattern(state) {
    return (
      state.patterns.find((p) => p.id === state.activePatternId) || state.patterns[0]
    );
  }

  function toggleMaterialCheck(state, materialId, checked) {
    const pattern = getActivePattern(state);
    if (!pattern.items[materialId]) {
      pattern.items[materialId] = { checked: Boolean(checked), qty: 1 };
    } else {
      pattern.items[materialId].checked = Boolean(checked);
    }
    saveState(state);
  }

  function updateMaterialQty(state, materialId, newQty) {
    const pattern = getActivePattern(state);
    const qty = Formatters.clampNumber(newQty, 0, 999);
    if (!pattern.items[materialId]) {
      pattern.items[materialId] = { checked: qty > 0, qty };
    } else {
      pattern.items[materialId].qty = qty;
      if (qty > 0 && !pattern.items[materialId].checked) {
        pattern.items[materialId].checked = true;
      }
    }
    saveState(state);
  }

  function updateMaterialUnitPrice(state, materialId, newPrice) {
    const mat = state.materials.find((m) => m.id === materialId);
    if (!mat) return;
    mat.unitPrice = Formatters.clampNumber(newPrice, 0, 10000);
    saveState(state);
  }

  function addCustomMaterial(state, { name, categoryId, unit, unitPrice, qty }) {
    const id = 'custom_' + Date.now();
    const cleanPrice = Formatters.clampNumber(unitPrice, 0, 10000);
    const cleanQty = Formatters.clampNumber(qty || 1, 0.1, 999);
    state.materials.push({
      id,
      categoryId: categoryId || 'bag',
      name: name.trim() || 'カスタム資材',
      unit: (unit || '個').trim(),
      unitPrice: cleanPrice,
      step: 1,
      hint: '店舗独自追加アイテム',
      isCustom: true
    });
    state.patterns.forEach((pat) => {
      pat.items[id] = {
        checked: pat.id === state.activePatternId,
        qty: cleanQty
      };
    });
    saveState(state);
  }

  function removeCustomMaterial(state, materialId) {
    state.materials = state.materials.filter((m) => m.id !== materialId);
    state.patterns.forEach((pat) => {
      delete pat.items[materialId];
    });
    saveState(state);
  }

  function updatePatternRatio(state, patternId, newRatio) {
    const target = state.patterns.find((p) => p.id === patternId);
    if (!target) return;
    const clamped = Math.round(Formatters.clampNumber(newRatio, 0, 100));
    target.ratio = clamped;
    const others = state.patterns.filter((p) => p.id !== patternId);
    const remaining = 100 - clamped;
    const othersSum = others.reduce((sum, p) => sum + p.ratio, 0);

    if (others.length > 0) {
      if (othersSum === 0) {
        others[0].ratio = remaining;
      } else {
        let distributed = 0;
        others.forEach((p, idx) => {
          if (idx === others.length - 1) {
            p.ratio = Math.max(0, remaining - distributed);
          } else {
            const share = Math.round((p.ratio / othersSum) * remaining);
            p.ratio = share;
            distributed += share;
          }
        });
      }
    }
    saveState(state);
  }

  function lockBaseline(state, simResult) {
    state.baselineAnnualProfit = simResult.annualGrossProfit;
    state.baselineMaterialCostPerRx = simResult.materialCostPerRx;
    saveState(state);
  }

  const StateManager = {
    createInitialState,
    loadState,
    saveState,
    getActivePattern,
    toggleMaterialCheck,
    updateMaterialQty,
    updateMaterialUnitPrice,
    addCustomMaterial,
    removeCustomMaterial,
    updatePatternRatio,
    lockBaseline
  };

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.StateManager = StateManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
  }
})(typeof window !== 'undefined' ? window : globalThis);
