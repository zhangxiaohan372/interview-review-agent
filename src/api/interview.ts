/**
 * 面试复盘 API — 前端请求封装
 */
import axios from 'axios';

const BASE_URL = import.meta.env.PROD ? '/api/ai' : 'http://localhost:3000/api/ai';

/** 面试复盘分析请求参数 */
export interface AnalyzeRequest {
  content: string;
}

/** 复盘结果 */
export interface ReviewData {
  overallScore: number;
  pros: string[];
  cons: string[];
  referenceAnswer: string;
  suggestions: string[];
}

/** 技能分数 */
export interface SkillData {
  javascript: number;
  vue: number;
  css: number;
  browser: number;
  network: number;
  engineering: number;
  architecture: number;
  performance: number;
}

/** 分析返回结果 */
export interface AnalyzeResult {
  review: ReviewData;
  skills: SkillData;
}

/** API 统一响应 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 提交面试信息进行 AI 复盘分析
 */
export async function analyzeInterview(params: AnalyzeRequest): Promise<ApiResponse<AnalyzeResult>> {
  const res = await axios.post<ApiResponse<AnalyzeResult>>(`${BASE_URL}/analyze`, params);
  return res.data;
}
