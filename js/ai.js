/**
 * AI 大模型服务模块
 * 支持豆包、DeepSeek、OpenAI 等多个模型，OpenAI 兼容格式
 */

// ==================== 预置模型配置 ====================
const AI_PROVIDERS = {
  doubao: {
    name: '豆包 (火山引擎)',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-pro-32k', 'doubao-pro-4k', 'doubao-lite-32k', 'doubao-lite-4k'],
    defaultModel: 'doubao-pro-32k',
    apiKeyHelp: '在火山引擎控制台 → 方舟平台 → API Key 管理 中创建',
    endpointHelp: '需在方舟平台创建推理接入点(Endpoint)，将 Endpoint ID 填到模型名'
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    apiKeyHelp: '在 platform.deepseek.com 获取 API Key',
    endpointHelp: ''
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    apiKeyHelp: '在 platform.openai.com 获取 API Key',
    endpointHelp: ''
  },
  custom: {
    name: '自定义',
    baseURL: '',
    models: [],
    defaultModel: '',
    apiKeyHelp: '输入任意兼容 OpenAI 格式的 API 地址和 Key',
    endpointHelp: ''
  }
};

// ==================== AI 配置存储 ====================

function getAIConfig() {
  try {
    return JSON.parse(localStorage.getItem('ih_ai_config') || '{}');
  } catch { return {}; }
}

function saveAIConfig(config) {
  localStorage.setItem('ih_ai_config', JSON.stringify(config));
}

function getActiveAIProvider() {
  const config = getAIConfig();
  const provider = config.provider || 'doubao';
  return {
    ...AI_PROVIDERS[provider],
    provider,
    apiKey: config.apiKey || '',
    baseURL: config.baseURL || AI_PROVIDERS[provider].baseURL,
    model: config.model || AI_PROVIDERS[provider].defaultModel
  };
}

function isAIConfigured() {
  const config = getAIConfig();
  return !!(config.apiKey && config.apiKey.trim().length > 10);
}

// ==================== AI API 调用 ====================

/**
 * 调用 AI 大模型（OpenAI 兼容格式）
 * @param {Array} messages - 消息列表 [{role, content}]
 * @param {Object} options - 可选参数 {temperature, maxTokens}
 * @returns {Promise<string>} - AI 返回的文本
 */
async function callAI(messages, options = {}) {
  const p = getActiveAIProvider();

  if (!p.apiKey) {
    throw new Error('请先配置 AI 模型：在「个人资料」页面设置 API Key');
  }

  const url = `${p.baseURL}/chat/completions`;

  const body = {
    model: p.model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
    stream: false
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${p.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (resp.status === 401) throw new Error('API Key 无效，请检查配置');
      if (resp.status === 404) throw new Error(`模型 "${p.model}" 不存在，请检查模型名称`);
      throw new Error(`AI 请求失败 (${resp.status}): ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('网络请求失败，可能是 CORS 跨域限制。豆包 API 建议通过后端代理调用。\n\n临时方案：尝试使用 DeepSeek 或 OpenAI（它们支持浏览器直接调用）');
    }
    throw err;
  }
}

// ==================== AI 功能：分析 JD ====================

async function aiAnalyzeJD(jdText) {
  const prompt = `你是一位专业的求职顾问。请分析以下职位描述，提取关键信息：

职位描述：
${jdText}

请按以下格式输出：
1. 【核心要求】（3-5条，每条一句话）
2. 【必备技能】（列出具体技能名，逗号分隔）
3. 【加分项】（列出加分技能或经验，逗号分隔）
4. 【岗位关键词】（10-15个最关键的描述性关键词）
5. 【简历建议】（2-3条建议，这段经历怎么写最能打动面试官）

请直接输出分析结果，不要多余的开场白。`;

  const messages = [
    { role: 'system', content: '你是专业的求职顾问，擅长分析岗位需求并给出简历建议。请用中文回答，简洁专业。' },
    { role: 'user', content: prompt }
  ];

  return callAI(messages, { temperature: 0.3, maxTokens: 1500 });
}

// ==================== AI 功能：改写经历 ====================

async function aiRewriteExperience(experience, jdText, jobTitle) {
  const expText = [
    `公司：${experience.company_name}`,
    `岗位：${experience.position}`,
    `时间：${experience.start_date} 至 ${experience.end_date}`,
    '工作成果：',
    ...experience.achievements.map((a, i) => `${i + 1}. ${a.title}：${a.description}`),
    `技能：${(experience.skills || []).join('、')}`
  ].join('\n');

  const prompt = `目标岗位：${jobTitle}

目标岗位 JD：
${jdText}

我在这段经历中的原始描述：
${expText}

请帮我改写这段经历，使其更匹配目标岗位：
1. 【改写后的岗位名称】（保持真实不造假，但可调整表述侧重）
2. 【改写后的工作成果】（每条成果保留原意，但用更匹配目标岗位JD的语言重写，加入量化数据如果原描述有的话）
3. 【匹配亮点】（说明这段经历为什么适合目标岗位，2-3句话）

请直接输出，不要加"好的"之类的开场白。`;

  const messages = [
    { role: 'system', content: '你是专业的简历优化师，擅长帮求职者改写经历使其匹配目标岗位。保持真实不造假，用更专业、更有针对性的语言表达。' },
    { role: 'user', content: prompt }
  ];

  return callAI(messages, { temperature: 0.5, maxTokens: 1500 });
}

// ==================== AI 功能：生成完整简历 ====================

async function aiGenerateResume(profile, experiences, jdText, jobTitle) {
  const expList = experiences.map((e, i) =>
    `经历${i + 1}：\n公司：${e.company_name}\n岗位：${e.position}\n时间：${e.start_date} 至 ${e.end_date}\n成果：\n${e.achievements.map(a => `- ${a.title}：${a.description}`).join('\n')}\n技能：${(e.skills || []).join('、')}`
  ).join('\n\n---\n\n');

  const prompt = `目标岗位：${jobTitle}

目标岗位 JD：
${jdText}

我的基本信息：
姓名：${profile.name || '（待填）'}
邮箱：${profile.email || '（待填）'}
电话：${profile.phone || '（待填）'}
教育：${profile.education || '（待填）'}
简介：${profile.summary || '（待填）'}

我的工作经历：
${expList}

请帮我生成一份针对目标岗位的完整简历，严格按以下格式输出：

【简历正文开始】
## 个人简介
（基于我的背景和JD要求，写一段有力的个人总结，2-3句话）

## 工作经历
（为每段经历写一个精炼版本，突出与JD相关的部分，每条成果用 STAR 法则改写）

## 核心技能
（列出与JD最匹配的技能，分类展示）

## 面试提示
（基于这份简历，预测面试官最可能问的3个问题）
【简历正文结束】

要求：语言专业有力，侧重匹配JD需求，不编造未在原始经历中出现的内容。`;

  const messages = [
    { role: 'system', content: '你是顶级的简历撰写专家，擅长针对具体岗位定制简历。输出专业、有说服力、真实不造假的内容。' },
    { role: 'user', content: prompt }
  ];

  return callAI(messages, { temperature: 0.4, maxTokens: 3000 });
}

// ==================== 导出 ====================

window.AIService = {
  AI_PROVIDERS, getAIConfig, saveAIConfig, getActiveAIProvider, isAIConfigured,
  aiAnalyzeJD, aiRewriteExperience, aiGenerateResume
};
