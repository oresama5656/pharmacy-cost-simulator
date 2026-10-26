(function (root) {
  'use strict';

  const Formatters =
    (root.PharmacyApp && root.PharmacyApp.Formatters) ||
    (typeof require !== 'undefined' ? require('../utils/formatters.js') : null);

  function buildMaterialMap(materials) {
    const map = {};
    for (const mat of materials) {
      map[mat.id] = mat;
    }
    return map;
  }

  function calcItemCost(material, itemState) {
    if (!material || !itemState || !itemState.checked) return 0;
    const price = Math.max(0, Number(material.unitPrice) || 0);
    const qty = Math.max(0, Number(itemState.qty) || 0);
    return Formatters.roundTo(price * qty, 2);
  }

  function calculatePatternMetrics(pattern, materials) {
    const matMap = buildMaterialMap(materials);
    const categoryTotals = { print: 0, bag: 0, dispense: 0 };
    const itemCosts = {};
    let totalCost = 0;

    for (const [matId, itemState] of Object.entries(pattern.items || {})) {
      const mat = matMap[matId];
      const cost = calcItemCost(mat, itemState);
      itemCosts[matId] = cost;
      totalCost += cost;
      if (mat && categoryTotals[mat.categoryId] !== undefined) {
        categoryTotals[mat.categoryId] += cost;
      }
    }

    const techFee = Math.max(0, Number(pattern.techFee) || 0);
    const grossProfit = techFee - totalCost;
    const profitMargin = techFee > 0 ? (grossProfit / techFee) * 100 : 0;

    return {
      patternId: pattern.id,
      techFee: Formatters.roundTo(techFee, 1),
      materialCost: Formatters.roundTo(totalCost, 1),
      grossProfit: Formatters.roundTo(grossProfit, 1),
      profitMargin: Formatters.roundTo(profitMargin, 2),
      categoryTotals,
      itemCosts
    };
  }

  function getNormalizedWeights(patterns, calculationMode, activePatternId) {
    if (calculationMode === 'single') {
      return patterns.map((p) => (p.id === activePatternId ? 1 : 0));
    }
    const totalRatio = patterns.reduce((sum, p) => sum + (Number(p.ratio) || 0), 0);
    if (totalRatio <= 0) {
      return patterns.map((_, idx) => (idx === 0 ? 1 : 0));
    }
    return patterns.map((p) => (Number(p.ratio) || 0) / totalRatio);
  }

  function calculateKaizenForPattern(ideaId, pattern, matMap) {
    const items = pattern.items || {};
    const getActiveQty = (id) => (items[id] && items[id].checked ? Number(items[id].qty) || 0 : 0);
    const getPrice = (id) => (matMap[id] ? Number(matMap[id].unitPrice) || 0 : 0);

    if (ideaId === 'color_to_mono') {
      const qty = getActiveQty('color_yakujo');
      const diff = Math.max(0, getPrice('color_yakujo') - getPrice('mono_yakujo'));
      return qty * diff;
    }
    if (ideaId === 'ziplock_half') {
      return getActiveQty('ziplock_bag') * getPrice('ziplock_bag') * 0.5;
    }
    if (ideaId === 'ippoka_loss_cut') {
      const qty = getActiveQty('ippoka_pack');
      return Math.min(qty, 3) * getPrice('ippoka_pack');
    }
    if (ideaId === 'yakutai_bundle') {
      const qty = getActiveQty('yakutai_regular');
      return Math.min(qty, 0.5) * getPrice('yakutai_regular');
    }
    if (ideaId === 'digital_techo') {
      const sealCost = getActiveQty('techo_seal') * getPrice('techo_seal');
      const printCost =
        getActiveQty('color_yakujo') * getPrice('color_yakujo') +
        getActiveQty('mono_yakujo') * getPrice('mono_yakujo');
      return (sealCost + printCost) * 0.3;
    }
    return 0;
  }

  function evaluateKaizenIdeas(kaizenIdeas, state) {
    const matMap = buildMaterialMap(state.materials);
    const weights = getNormalizedWeights(
      state.patterns,
      state.calculationMode,
      state.activePatternId
    );
    const annualRx = Math.max(0, Number(state.annualRxCount) || 0);

    return kaizenIdeas.map((idea) => {
      const savingsPerRx = state.patterns.reduce((sum, pat, idx) => {
        return sum + calculateKaizenForPattern(idea.id, pat, matMap) * weights[idx];
      }, 0);
      const isSelected = Boolean(state.activeKaizenIds && state.activeKaizenIds[idea.id]);
      return {
        ...idea,
        isSelected,
        savingsPerRx: Formatters.roundTo(savingsPerRx, 2),
        annualSavings: Math.round(savingsPerRx * annualRx)
      };
    });
  }

  function aggregateWeightedMetrics(patternMetricsList, weights) {
    let techFee = 0;
    let materialCost = 0;
    const categoryTotals = { print: 0, bag: 0, dispense: 0 };

    patternMetricsList.forEach((pm, idx) => {
      const w = weights[idx];
      techFee += pm.techFee * w;
      materialCost += pm.materialCost * w;
      categoryTotals.print += pm.categoryTotals.print * w;
      categoryTotals.bag += pm.categoryTotals.bag * w;
      categoryTotals.dispense += pm.categoryTotals.dispense * w;
    });

    return { techFee, materialCost, categoryTotals };
  }

  function runFullSimulation(state, kaizenIdeas = []) {
    const patternMetricsList = state.patterns.map((p) =>
      calculatePatternMetrics(p, state.materials)
    );
    const weights = getNormalizedWeights(
      state.patterns,
      state.calculationMode,
      state.activePatternId
    );
    const baseAgg = aggregateWeightedMetrics(patternMetricsList, weights);
    const evaluatedKaizen = evaluateKaizenIdeas(kaizenIdeas, state);
    const activeKaizenSavingsPerRx = evaluatedKaizen
      .filter((k) => k.isSelected)
      .reduce((sum, k) => sum + k.savingsPerRx, 0);

    const effectiveMaterialCost = Math.max(0, baseAgg.materialCost - activeKaizenSavingsPerRx);
    const grossProfitPerRx = baseAgg.techFee - effectiveMaterialCost;
    const annualRx = Math.max(0, Number(state.annualRxCount) || 0);
    const annualGrossProfit = Math.round(grossProfitPerRx * annualRx);
    const annualMaterialCost = Math.round(effectiveMaterialCost * annualRx);
    const annualTechRevenue = Math.round(baseAgg.techFee * annualRx);
    const equivalentRxCount =
      baseAgg.techFee > 0 ? Math.round(annualMaterialCost / baseAgg.techFee) : 0;

    return {
      patternMetricsList,
      activePatternMetrics:
        patternMetricsList.find((p) => p.patternId === state.activePatternId) ||
        patternMetricsList[0],
      techFeePerRx: Formatters.roundTo(baseAgg.techFee, 1),
      baseMaterialCostPerRx: Formatters.roundTo(baseAgg.materialCost, 1),
      kaizenSavingsPerRx: Formatters.roundTo(activeKaizenSavingsPerRx, 1),
      materialCostPerRx: Formatters.roundTo(effectiveMaterialCost, 1),
      grossProfitPerRx: Formatters.roundTo(grossProfitPerRx, 1),
      profitMargin:
        baseAgg.techFee > 0 ? Formatters.roundTo((grossProfitPerRx / baseAgg.techFee) * 100, 1) : 0,
      annualRxCount: annualRx,
      annualTechRevenue,
      annualMaterialCost,
      annualGrossProfit,
      annualKaizenSavings: Math.round(activeKaizenSavingsPerRx * annualRx),
      equivalentRxCount,
      categoryTotals: baseAgg.categoryTotals,
      evaluatedKaizen
    };
  }

  const Calculator = {
    calcItemCost,
    calculatePatternMetrics,
    getNormalizedWeights,
    evaluateKaizenIdeas,
    runFullSimulation
  };

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.Calculator = Calculator;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
  }
})(typeof window !== 'undefined' ? window : globalThis);
