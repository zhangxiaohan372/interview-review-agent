/**
 * LLM Service — 面试复盘分析核心
 *
 * 工作流程：
 * 1. 接收面试信息（公司、岗位、题目、作答）
 * 2. 构建结构化 System Prompt，约束输出格式
 * 3. 调用 LLM API，获取 JSON 格式的复盘结果
 * 4. 解析并返回结构化数据
 */

// ─── 配置读取 ───
function getConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    apiUrl: process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  };
}

// ─── System Prompt ───
const SYSTEM_PROMPT = `你是一位资深的前端技术面试官和面试教练。用户会发来一段面试复盘笔记，其中可能包含：
- 公司名称、应聘岗位
- 一到多道面试题及用户的作答
- 也可能只有题和回答，没有公司信息

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

评分标准：
- overallScore: 综合所有题目，评估准确性、深度、表达逻辑
- 各技能分数: 根据面试中展现的该维度能力推断（60 为及格线，不要全部虚高）
  - javascript: JS 基础、ES6+、异步、闭包、原型链等
  - vue: Vue 响应式、组件化、生命周期、Vue Router、Pinia 等
  - css: 布局、盒模型、Flex/Grid、动画、响应式等
  - browser: DOM/BOM、事件循环、渲染流程、存储等
  - network: HTTP/HTTPS、缓存、跨域、WebSocket 等
  - engineering: 构建工具(Vite/Webpack)、模块化、代码规范、CI/CD 等
  - architecture: 组件设计、状态管理、路由设计、分层架构等
  - performance: 首屏优化、懒加载、虚拟滚动、内存管理等

分析要求：
1. pros/cons 各列出 3 条，从不同维度点评，不要重复
2. referenceAnswer 挑选用户回答最薄弱的那道题，给出更好的回答思路
3. suggestions 给出 3 条具体可执行的学习建议，最好附带关键词便于搜索
4. 技能分数基于内容真实推断，有依据地给分`;

// ─── 调用 LLM ───
async function callLLM(messages) {
  const { apiKey, apiUrl, model } = getConfig();

  if (!apiKey) {
    throw new Error('未配置 LLM_API_KEY，请在 backend/.env 中设置');
  }

  const body = {
    model,
    messages,
    temperature: 0.3, // 低温度保证输出稳定
  };

  console.log(`[LLM] 请求 ${apiUrl}/chat/completions, model=${model}`);

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API 错误 (${response.status}): ${errText}`);
  }

  return response.json();
}

// ─── JSON 提取与解析 ───
function extractJSON(text) {
  // 尝试直接解析
  try {
    return JSON.parse(text);
  } catch {
    // 尝试从 markdown 代码块中提取
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // 继续尝试其他方式
      }
    }

    // 尝试匹配大括号包裹的内容
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // 继续尝试其他方式
      }
    }

    throw new Error(`无法解析 LLM 返回的 JSON。原始内容前 300 字: ${text.slice(0, 300)}`);
  }
}

// ─── 主入口 ───

/**
 * 分析面试回答
 * @param {object} params
 * @param {string} params.content - 用户自由描述的面试复盘内容
 * @returns {object} { review, skills }
 */
export async function analyzeInterview({ content }) {
  const userMessage = `以下是我的面试复盘笔记，请全面分析：

${content}

请严格按照 JSON 格式返回复盘分析结果。`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  console.log('[LLM] 开始面试复盘分析...');

  const data = await callLLM(messages);
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error('LLM 返回数据异常: ' + JSON.stringify(data));
  }

  const llmOutput = choice.message?.content || '';
  console.log(`[LLM] 分析完成，输出 ${llmOutput.length} 字符`);

  const result = extractJSON(llmOutput);

  // 校验结构完整性
  if (!result.review || !result.skills) {
    throw new Error('LLM 返回的 JSON 缺少 review 或 skills 字段');
  }

  if (typeof result.review.overallScore !== 'number') {
    throw new Error('overallScore 必须是数字');
  }

  return result;
}
