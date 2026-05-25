// src/controllers/spendingMethod.controller.js
// Controller cho Phương pháp Phân bổ Chi tiêu

import { success, error } from '../utils/response.js';
import {
  getMethods, createMethod, deleteMethod, applyMethod,
} from '../services/spendingMethod.service.js';

// GET /api/v1/spending-methods
export const listMethods = async (req, res, next) => {
  try {
    const methods = await getMethods(req.user.id);
    return success(res, methods);
  } catch (err) { next(err); }
};

// POST /api/v1/spending-methods
export const addMethod = async (req, res, next) => {
  try {
    const { name, description, icon, allocations } = req.body;
    if (!name?.trim()) return error(res, 'Tên phương pháp không được để trống', 400);
    if (!Array.isArray(allocations) || allocations.length < 2) {
      return error(res, 'Cần ít nhất 2 khoản phân bổ', 400);
    }

    const methodId = await createMethod(req.user.id, { name, description, icon, allocations });
    const methods  = await getMethods(req.user.id);
    const created  = methods.find((m) => m.id === methodId);
    return success(res, created, 'Đã tạo phương pháp mới', 201);
  } catch (err) {
    if (err.message.includes('bằng 100%')) return error(res, err.message, 400);
    next(err);
  }
};

// DELETE /api/v1/spending-methods/:id
export const removeMethod = async (req, res, next) => {
  try {
    await deleteMethod(req.user.id, parseInt(req.params.id));
    return success(res, null, 'Đã xoá phương pháp');
  } catch (err) {
    if (err.message.includes('không có quyền')) return error(res, err.message, 403);
    next(err);
  }
};

// POST /api/v1/spending-methods/apply
export const applyTobudgets = async (req, res, next) => {
  try {
    const { methodId, monthlyIncome, month, year, categoryMappings, walletIds } = req.body;

    if (!methodId)       return error(res, 'Thiếu methodId', 400);
    if (!monthlyIncome || monthlyIncome <= 0) return error(res, 'Thu nhập không hợp lệ', 400);
    if (!Array.isArray(categoryMappings) || categoryMappings.length === 0) {
      return error(res, 'Cần ít nhất 1 ánh xạ danh mục', 400);
    }

    const m  = parseInt(month)  || new Date().getMonth() + 1;
    const y  = parseInt(year)   || new Date().getFullYear();
    // walletIds: optional array of account IDs to link to each budget
    const accountIds = Array.isArray(walletIds) ? walletIds : [];
    const results = await applyMethod(req.user.id, { methodId, monthlyIncome, month: m, year: y, categoryMappings, accountIds });

    return success(res, results, `Đã áp dụng phương pháp vào ${results.length} danh mục ngân sách`);
  } catch (err) {
    if (err.message.includes('Không tìm thấy')) return error(res, err.message, 404);
    next(err);
  }
};
