// api/reportApi.js
import axiosInstance from './axiosInstance';

export const getSummaryApi = async (month, year) => {
  const res = await axiosInstance.get('/v1/reports/summary', { params: { month, year } });
  return res.data.data;
};

export const getMonthlyChartApi = async (year) => {
  const res = await axiosInstance.get('/v1/reports/monthly-chart', { params: { year } });
  return res.data.data;
};

export const getCategoryBreakdownApi = async (type, month, year) => {
  const res = await axiosInstance.get('/v1/reports/category-breakdown', {
    params: { type, month, year },
  });
  return res.data.data;
};

export const getTopCategoriesApi = async (type, month, year, limit = 5) => {
  const res = await axiosInstance.get('/v1/reports/top-categories', {
    params: { type, month, year, limit },
  });
  return res.data.data;
};

export const getDailyChartApi = async (startDate, endDate) => {
  const res = await axiosInstance.get('/v1/reports/daily-chart', {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data.data;
};
