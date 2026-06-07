/**
 * Vercel Serverless Function — 面试复盘分析
 * 路径: /api/ai/analyze（自动映射自 api/ai/analyze.js）
 */

const SYSTEM_PROMPT = `你是一位资深的前端技术面试官和面试教练。用户会发来一段面试复盘笔记，其中可能包含：
- 公司名称、应聘岗位
- 一到多道面试题及用户的作答

你需要理解全部内容，做一次综合的复盘分析。即使用户贴了多道题，也只需要输出一份综合复盘结果。

你的分析必须严格遵循以下 JSON 格式返回，不要包含任何其他文字、markdown 标记或代码块：

{
  "review": {
    "overallScore": <0-100 整数，综合评估本次面试的整体表现>,
    "pros": ["<回答的优点1>", "<优点2>", "<优点3>"],
    "cons": ["<回答的不足1>", "<不足2>", "<不足3>"],
    "referenceAnswer": "<针对用户提及的核心问题，给出更优回答思路与关键知识点，150-400字>",
    "suggestions": ["<针对性学习建议1>", "<建议2>", "<建议3>"]
  },
  "skills": {
    "javascript": <0-100 整数>,
    "vue": <0-100 整数>,
    "css": <0-100 整数>,
    "browser": <0-100 整数>,
    "network": <0-100 整数>,
    "engineering": <0-100 整数>,
    "architecture": <0-100 整数>,
    "performance": <0-100 整数>
  }
}

分析要求：
1. pros/cons 各列出 3 条，从不同维度点评
2. referenceAnswer 挑选用户回答最薄弱的题，给出更好回答思路
3. suggestions 给出 3 条具体学习建议
4. 技能分数基于内容真实推断，不要全部虚高`;

function getConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    apiUrl: process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  };
}

async function callLLM(messages) {
  const { apiKey, apiUrl, model } = getConfig();
  if (!apiKey) throw new Error('未配置 LLM_API_KEY');

  const res = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API 错误 (${res.status}): ${text}`);
  }
  return res.json();
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const code = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (code) { try { return JSON.parse(code[1].trim()); } catch {} }
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) { try { return JSON.parse(brace[0]); } catch {} }
  throw new Error(`无法解析 LLM 返回的 JSON: ${text.slice(0, 300)}`);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '仅支持 POST' });
  }

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return res.status(400).json({ success: false, message: '请至少输入 20 个字' });
    }

    const userMessage = `以下是我的面试复盘笔记，请全面分析：\n\n${content.trim()}\n\n请严格按照 JSON 格式返回复盘分析结果。`;

    const data = await callLLM([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);

    const choice = data.choices?.[0];
    if (!choice) throw new Error('LLM 返回异常');

    const result = extractJSON(choice.message?.content || '');
    if (!result.review || !result.skills) throw new Error('缺少 review 或 skills 字段');
    if (typeof result.review.overallScore !== 'number') throw new Error('overallScore 必须是数字');

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
