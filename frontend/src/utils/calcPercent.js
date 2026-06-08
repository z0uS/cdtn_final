// utils/calcPercent.js
// Hàm tính toán phần trăm và thống kê

export const calcPercent = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
};

export const calcPercentChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

export const calcSavingsRate = (income, expense) => {
  if (!income || income === 0) return 0;
  const savings = income - expense;
  return Math.round((savings / income) * 100);
};

export const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export const sumBy = (arr, key) =>
  arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);

export const groupBy = (arr, key) =>
  arr.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});
