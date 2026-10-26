(function (root) {
  'use strict';

  function clampNumber(value, min, max) {
    const num = Number(value);
    if (Number.isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
  }

  function roundTo(value, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function formatYen(amount, showDecimals = false) {
    const num = Number(amount) || 0;
    const rounded = showDecimals ? roundTo(num, 1) : Math.round(num);
    return rounded.toLocaleString('ja-JP') + '円';
  }

  function formatManYen(amount) {
    const num = Number(amount) || 0;
    const abs = Math.abs(num);
    if (abs >= 10000) {
      const man = roundTo(num / 10000, 1);
      return man.toLocaleString('ja-JP') + '万円';
    }
    return Math.round(num).toLocaleString('ja-JP') + '円';
  }

  function formatSignedYen(diffAmount) {
    const num = Math.round(Number(diffAmount) || 0);
    if (num > 0) return '+' + num.toLocaleString('ja-JP') + '円';
    if (num < 0) return num.toLocaleString('ja-JP') + '円';
    return '±0円';
  }

  function formatPercent(value, decimals = 1) {
    return roundTo(value, decimals).toFixed(decimals) + '%';
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const Formatters = {
    clampNumber,
    roundTo,
    formatYen,
    formatManYen,
    formatSignedYen,
    formatPercent,
    escapeHtml,
    deepClone
  };

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.Formatters = Formatters;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Formatters;
  }
})(typeof window !== 'undefined' ? window : globalThis);
