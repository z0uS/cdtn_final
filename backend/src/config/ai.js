// src/config/ai.js
// Khởi tạo Google Gemini AI client

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI client initialized');
} else {
  console.warn('⚠️  GEMINI_API_KEY not set – AI module will use mock responses');
}

/**
 * Lấy model instance
 * @param {string} modelName
 * @returns {GenerativeModel|null}
 */
export const getModel = (modelName = process.env.AI_MODEL || 'gemini-flash-latest', systemInstruction) => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName, systemInstruction });
};

export default genAI;
