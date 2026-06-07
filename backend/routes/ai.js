/**
 * AI 路由 — 面试复盘分析
 */
import express from 'express';
import { analyzeInterview } from '../services/llm.js';

const router = express.Router();

/**
 * POST /api/ai/analyze
 *
 * 请求体:
 *   { content: string }  // 用户自由描述的面试复盘内容
 *
 * 响应体:
 *   {
 *     success: true,
 *     data: {
 *       review: { overallScore, pros, cons, referenceAnswer, suggestions },
 *       skills: { javascript, vue, css, browser, network, engineering, architecture, performance }
 *     }
 *   }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { content } = req.body;

    // 参数校验
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return res.json({
        success: false,
        message: '请至少输入 20 个字描述你的面试经历',
      });
    }

    console.log(`[AI] 收到面试复盘请求，内容长度: ${content.length} 字符`);

    const result = await analyzeInterview({ content: content.trim() });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AI] 分析失败:', err);
    res.json({
      success: false,
      message: 'AI 分析失败：' + err.message,
    });
  }
});

export default router;
