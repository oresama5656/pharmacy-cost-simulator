const test = require('node:test');
const assert = require('node:assert/strict');

const Formatters = require('../js/utils/formatters.js');
const Presets = require('../js/data/presets.js');
const Calculator = require('../js/logic/calculator.js');
const StateManager = require('../js/logic/state.js');

test('calculatePatternMetrics computes accurate material cost and gross profit', () => {
  // Arrange
  const state = StateManager.createInitialState();
  const standardPattern = state.patterns.find((p) => p.id === 'standard');

  // Act
  const metrics = Calculator.calculatePatternMetrics(standardPattern, state.materials);

  // Assert
  // standard defaults:
  // color_yakujo (8.5 * 1) + receipt_sheet (2.0 * 1) + techo_seal (2.5 * 1)
  // + yakutai_regular (3.5 * 2 = 7.0) + ziplock_bag (4.5 * 1) = 24.5円
  assert.equal(metrics.materialCost, 24.5);
  assert.equal(metrics.techFee, 1850);
  assert.equal(metrics.grossProfit, 1825.5);
});

test('runFullSimulation computes weighted average and annual totals', () => {
  // Arrange
  const state = StateManager.createInitialState();
  state.annualRxCount = 24000;

  // Act
  const sim = Calculator.runFullSimulation(state, Presets.KAIZEN_IDEAS);

  // Assert
  assert.ok(sim.materialCostPerRx > 24.5, 'Weighted cost includes ippoka pattern');
  assert.equal(sim.annualRxCount, 24000);
  assert.equal(sim.annualMaterialCost, Math.round(sim.materialCostPerRx * 24000));
  assert.equal(sim.annualGrossProfit, Math.round(sim.grossProfitPerRx * 24000));
});

test('Kaizen ideas reduce material cost and increase annual gross profit when selected', () => {
  // Arrange
  const state = StateManager.createInitialState();
  const beforeSim = Calculator.runFullSimulation(state, Presets.KAIZEN_IDEAS);

  // Act
  state.activeKaizenIds = { color_to_mono: true, ippoka_loss_cut: true };
  const afterSim = Calculator.runFullSimulation(state, Presets.KAIZEN_IDEAS);

  // Assert
  assert.ok(afterSim.kaizenSavingsPerRx > 0);
  assert.ok(afterSim.materialCostPerRx < beforeSim.materialCostPerRx);
  assert.ok(afterSim.annualGrossProfit > beforeSim.annualGrossProfit);
});

test('updatePatternRatio keeps sum of pattern ratios at 100%', () => {
  // Arrange
  const state = StateManager.createInitialState();

  // Act
  StateManager.updatePatternRatio(state, 'ippoka', 50);
  const sum = state.patterns.reduce((acc, p) => acc + p.ratio, 0);

  // Assert
  assert.equal(sum, 100);
  assert.equal(state.patterns.find((p) => p.id === 'ippoka').ratio, 50);
});

test('Formatters format yen and man-yen properly', () => {
  assert.equal(Formatters.formatYen(1850), '1,850円');
  assert.equal(Formatters.formatYen(24.5, true), '24.5円');
  assert.equal(Formatters.formatManYen(850000), '85万円');
  assert.equal(Formatters.formatSignedYen(120000), '+120,000円');
});
