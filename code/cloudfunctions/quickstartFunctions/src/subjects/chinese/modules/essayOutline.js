/*
 * @Description: '语文作文写前提分（AI + 规则兜底）'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:08:00
 */

const { parseTimeout, buildAttemptTimeout } = require('../../../core/runtime');
const { extractErrorMessage } = require('../../../core/errors');
const {
  ensureStringArray,
  splitSentences,
  pickMaterialPoints,
  inferTheme,
  withTimeout,
  buildRawPreview,
} = require('../utils');
const { STYLE_CONFIG, normalizeStyle } = require('../config');

const AI_ENV_ID = process.env.TCB_ENV || 'cloud1-1g2nu0dnc866c9b3';
const AI_MODEL_PROVIDER = 'hunyuan-exp';
const AI_MODEL_NAME = 'hunyuan-turbos-latest';
const AI_TIMEOUT_MS = parseTimeout(process.env.AI_TIMEOUT_MS, 540000);
const CLOUDBASE_TIMEOUT_MS = parseTimeout(process.env.CLOUDBASE_TIMEOUT_MS, 520000);
const AI_DEBUG_PREVIEW_MAX = 600;
const MAX_MATERIAL_LENGTH = 3000;
const AI_REQUEST_MATERIAL_MAX_LENGTH = 1600;
const AI_RETRY_MATERIAL_MAX_LENGTH = 900;
const RETRY_MIN_REMAINING_MS = 5500;
const MIN_MATERIAL_LENGTH = 60;
const RUNTIME_NODE_VERSION = (process.versions && process.versions.node) || '';
const RUNTIME_NODE_MAJOR = Number((RUNTIME_NODE_VERSION.split('.')[0] || '0'));
const IS_LEGACY_NODE_RUNTIME = RUNTIME_NODE_MAJOR > 0 && RUNTIME_NODE_MAJOR < 12;
const HAS_CLOUD_RUNTIME = Boolean(process.env.TENCENTCLOUD_RUNENV || process.env.WX_CLOUD_FUNCTION_NAME || process.env.SCF_RUNTIME_VERSION);

function buildChineseAngles(style, theme) {
  const group = STYLE_CONFIG[style] ? STYLE_CONFIG[style].group : 'argumentative';
  if (group === 'narrative') {
    return [
      {
        title: '在抉择中完成成长',
        one_sentence: `围绕“${theme}”设置成长冲突，展现由困惑到笃定的转变。`,
        why_fit: ['材料存在价值冲突或选择压力，适合写“变化”与“领悟”', '便于通过事件推进人物成长轨迹'],
        pitfalls: ['只叙事不点题，缺少价值提炼', '情节堆砌但细节与心理描写不足'],
      },
      {
        title: '在平凡场景中见精神',
        one_sentence: `从日常情境切入“${theme}”，以小见大呈现核心品质。`,
        why_fit: ['便于快速找到可写生活素材', '能把抽象材料落到具体人物与事件'],
        pitfalls: ['故事完整但主旨不聚焦', '结尾未回扣材料关键词'],
      },
      {
        title: '以一次关键经历回应材料',
        one_sentence: `选取一段关键经历，前后对比回应“${theme}”的现实意义。`,
        why_fit: ['结构清晰，容易形成“开端-发展-转折-收束”', '适合考场限时写作快速起稿'],
        pitfalls: ['转折生硬，缺少铺垫', '抒情空泛，缺少行动与细节支撑'],
      },
    ];
  }

  if (group === 'practical') {
    return [
      {
        title: '明确对象与行动目标',
        one_sentence: `围绕“${theme}”，先界定受众，再提出可执行主张。`,
        why_fit: ['任务型应用文重在对象感与行动感', '有助于形成“目的-对象-行动”闭环'],
        pitfalls: ['口号化表达，缺少具体行动', '对象不清，导致语气失准'],
      },
      {
        title: '用现实问题驱动倡导',
        one_sentence: `从现实痛点切入“${theme}”，给出路径与协作方案。`,
        why_fit: ['更容易写出真实场景和说服力', '可自然嵌入责任分工与执行步骤'],
        pitfalls: ['问题描述过长，解决方案不足', '只提倡议不说明可行性'],
      },
      {
        title: '价值表达与可落地并重',
        one_sentence: `兼顾情感号召与制度化安排，落实“${theme}”的公共价值。`,
        why_fit: ['兼容演讲稿、书信、倡议书等常见任务', '利于结尾形成号召力'],
        pitfalls: ['情绪饱满但结构松散', '缺少时间点与执行人'],
      },
    ];
  }

  return [
    {
      title: '平衡速度与稳健',
      one_sentence: `围绕“${theme}”论证快与稳的辩证统一，强调审时度势。`,
      why_fit: ['材料常含两种看似对立的立场，适合辩证分析', '便于拆分分论点并形成层次化论证'],
      pitfalls: ['只做态度表态，缺少论证过程', '观点面面俱到导致中心论点不突出'],
    },
    {
      title: '以长期主义回应当下焦虑',
      one_sentence: `从“${theme}”切入，论证长期目标与当下行动的一致性。`,
      why_fit: ['与高中生成长情境贴近，现实感较强', '便于引用学习、社会、个体发展等多维例证'],
      pitfalls: ['例子堆砌，缺少分析与回扣', '分论点重复，逻辑递进不明显'],
    },
    {
      title: '在约束中实现有效突破',
      one_sentence: `论证面对现实边界时，如何通过方法与心态完成“${theme}”的价值实现。`,
      why_fit: ['能兼顾理想与现实，避免单向度论述', '可形成“现象-原因-路径”结构'],
      pitfalls: ['问题分析停留在口号层面', '结尾没有形成价值升华'],
    },
  ];
}

function buildChineseOutlineByStyle(style, materialPoints, angle) {
  const firstPoint = materialPoints[0] || '结合材料关键词';
  const secondPoint = materialPoints[1] || firstPoint;
  const styleMeta = STYLE_CONFIG[style] || STYLE_CONFIG.argumentative;

  if (styleMeta.group === 'narrative') {
    return {
      style,
      paragraphs: [
        {
          name: '开端：情境引入',
          what_to_write: ['点出人物、时间与冲突情境', '用 1-2 句自然带出材料关键词'],
          material_hook: firstPoint,
        },
        {
          name: '发展：矛盾推进',
          what_to_write: ['通过行动与对话推进事件', '突出“我”在选择中的犹豫与思考'],
          material_hook: secondPoint,
        },
        {
          name: '转折：关键触发',
          what_to_write: ['设置触发点（人物一句话/一次失败/一次提醒）', '让主题从“知道”走向“做到”'],
          material_hook: firstPoint,
        },
        {
          name: '高潮：变化发生',
          what_to_write: ['呈现主人公做出关键决定后的行动', '细节描写支撑情感与价值变化'],
          material_hook: secondPoint,
        },
        {
          name: '收束：回扣与升华',
          what_to_write: ['回扣材料，明确主题感悟', '将个体体验提升到普遍意义'],
          material_hook: angle.one_sentence,
        },
      ],
    };
  }

  if (styleMeta.group === 'practical') {
    return {
      style,
      paragraphs: [
        {
          name: `开篇：明确${styleMeta.label}任务`,
          what_to_write: ['交代写作对象与目的', '一句话点明核心主张'],
          material_hook: firstPoint,
        },
        {
          name: '现状：问题与背景',
          what_to_write: ['结合材料提炼现实问题', '说明问题对对象的影响'],
          material_hook: secondPoint,
        },
        {
          name: '主张：价值与理由',
          what_to_write: ['提出 2-3 条核心理由', '每条理由配一条现实依据'],
          material_hook: firstPoint,
        },
        {
          name: '方案：行动路径',
          what_to_write: ['列出可执行步骤（谁、何时、怎么做）', '补充可衡量的目标或检查点'],
          material_hook: secondPoint,
        },
        {
          name: '结尾：号召与回扣',
          what_to_write: ['呼吁行动并重申公共价值', '回扣材料关键词，形成闭环'],
          material_hook: angle.one_sentence,
        },
      ],
    };
  }

  return {
    style,
    paragraphs: [
      {
        name: '第一段：引材料并立中心论点',
        what_to_write: ['简述材料矛盾点或核心命题', '提出明确中心论点（一句话可判定）'],
        material_hook: firstPoint,
      },
      {
        name: '第二段：分论点一（是什么）',
        what_to_write: ['解释概念边界，避免空泛', '用一个贴近学生场景的例证说明'],
        material_hook: secondPoint,
      },
      {
        name: '第三段：分论点二（为什么）',
        what_to_write: ['分析背后原因或价值逻辑', '补充社会或历史维度的例证'],
        material_hook: firstPoint,
      },
      {
        name: '第四段：分论点三（怎么做）',
        what_to_write: ['给出可执行路径与方法', '回应常见反例或质疑，体现思辨性'],
        material_hook: secondPoint,
      },
      {
        name: '第五段：结尾回扣材料并升华',
        what_to_write: ['重申中心论点并回扣材料关键词', '收束到青年成长或时代命题'],
        material_hook: angle.one_sentence,
      },
    ],
  };
}

function buildChineseScoreChecklist(style) {
  const group = STYLE_CONFIG[style] ? STYLE_CONFIG[style].group : 'argumentative';
  const commonList = [
    {
      dimension: '扣题与立意',
      items: ['开头 3 句内出现材料关键词', '中心观点表达明确，不含糊', '结尾再次回扣材料与中心主张'],
    },
    {
      dimension: '结构完整性',
      items: ['段落分工清晰，不重复', '段与段之间有逻辑衔接', '全文首尾呼应，结构闭环'],
    },
    {
      dimension: '语言表达',
      items: ['关键句简洁有力，避免口语化', '减少空洞套话与重复表述', '有 1-2 处点题句提升质感'],
    },
  ];

  if (group === 'narrative') {
    return [
      ...commonList,
      {
        dimension: '叙事与细节',
        items: ['至少 2 处动作/神态/心理细节', '转折有铺垫，不突兀', '人物变化前后有对照'],
      },
    ];
  }

  if (group === 'practical') {
    return [
      ...commonList,
      {
        dimension: '任务完成度',
        items: ['对象、目的、语气准确', '行动建议具体可执行', '结尾有号召且与身份一致'],
      },
    ];
  }

  return [
    ...commonList,
    {
      dimension: '论证质量',
      items: ['每个分论点都有例证或分析支撑', '例证后有“所以”式分析回扣', '有一处反向思考体现思辨深度'],
    },
  ];
}

function buildOutlineSections(result) {
  return [
    {
      title: '材料要点',
      type: 'ordered',
      items: result.material_points,
    },
    {
      title: '立意候选',
      type: 'cards',
      items: (result.angles || []).map((item) => ({
        title: item.title,
        desc: item.one_sentence,
        bullets: ['匹配理由：', ...(item.why_fit || []), '跑题风险：', ...(item.pitfalls || [])],
      })),
    },
    {
      title: '结构化提纲',
      type: 'cards',
      items: ((result.outline && result.outline.paragraphs) || []).map((paragraph) => ({
        title: paragraph.name,
        desc: `材料回扣：${paragraph.material_hook}`,
        bullets: paragraph.what_to_write || [],
      })),
    },
    {
      title: '评分清单',
      type: 'cards',
      items: (result.score_checklist || []).map((group) => ({
        title: group.dimension,
        desc: '',
        bullets: group.items || [],
      })),
    },
  ];
}

function stripCodeBlock(content) {
  const raw = `${content || ''}`.trim();
  if (!raw.startsWith('```')) {
    return raw;
  }
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();
}

function normalizeJsonCandidate(content) {
  let normalized = `${content || ''}`.trim();
  if (!normalized) {
    return normalized;
  }
  if (!normalized.startsWith('{') && !normalized.startsWith('[')) {
    if (normalized.startsWith('"material_points"') || normalized.startsWith("'material_points'")) {
      normalized = `{${normalized}}`;
    }
  }
  return normalized.replace(/,\s*([}\]])/g, '$1');
}

function parseModelJson(content) {
  const normalized = normalizeJsonCandidate(stripCodeBlock(content));
  try {
    return JSON.parse(normalized);
  } catch (error) {
    const startIndex = normalized.indexOf('{');
    const endIndex = normalized.lastIndexOf('}');
    if (startIndex >= 0 && endIndex > startIndex) {
      return JSON.parse(normalizeJsonCandidate(normalized.slice(startIndex, endIndex + 1)));
    }
    throw error;
  }
}

function normalizeModelResult(payload, style) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const materialPoints = ensureStringArray(safePayload.material_points);
  const angles = Array.isArray(safePayload.angles)
    ? safePayload.angles
        .map((item) => ({
          title: `${(item && item.title) || ''}`.trim(),
          one_sentence: `${(item && item.one_sentence) || ''}`.trim(),
          why_fit: ensureStringArray(item && item.why_fit),
          pitfalls: ensureStringArray(item && item.pitfalls),
        }))
        .filter((item) => item.title && item.one_sentence)
        .slice(0, 3)
    : [];

  const outlineSource = safePayload.outline && Array.isArray(safePayload.outline.paragraphs)
    ? safePayload.outline.paragraphs
    : [];
  const outlineParagraphs = outlineSource.length > 0
    ? outlineSource
        .map((item) => ({
          name: `${(item && item.name) || ''}`.trim(),
          what_to_write: ensureStringArray(item && item.what_to_write),
          material_hook: `${(item && item.material_hook) || ''}`.trim(),
        }))
        .filter((item) => item.name && item.what_to_write.length > 0)
    : [];

  const scoreChecklist = Array.isArray(safePayload.score_checklist)
    ? safePayload.score_checklist
        .map((item) => ({
          dimension: `${(item && item.dimension) || ''}`.trim(),
          items: ensureStringArray(item && item.items),
        }))
        .filter((item) => item.dimension && item.items.length > 0)
    : [];

  const safetyNotes = ensureStringArray(safePayload.safety_notes);

  if (materialPoints.length < 2 || angles.length === 0 || outlineParagraphs.length === 0 || scoreChecklist.length === 0) {
    throw new Error('AI 返回结构不完整');
  }

  const styleMeta = STYLE_CONFIG[style] || STYLE_CONFIG.argumentative;
  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'essay_outline',
      featureLabel: '作文写前提分',
      style,
      styleLabel: styleMeta.label,
      source: 'hunyuan-exp',
      model: AI_MODEL_NAME,
    },
    material_points: materialPoints,
    angles,
    outline: {
      style,
      paragraphs: outlineParagraphs,
    },
    score_checklist: scoreChecklist,
    safety_notes: safetyNotes,
  };
  result.sections = buildOutlineSections(result);
  return result;
}

function buildChineseFallbackResult(style, parsedText, safetyNotes, modelFailureReason = '', debugInfo = null) {
  const sentences = splitSentences(parsedText);
  const materialPoints = pickMaterialPoints(sentences);
  const theme = inferTheme(materialPoints);
  const angles = buildChineseAngles(style, theme);
  const outline = buildChineseOutlineByStyle(style, materialPoints, angles[0]);
  const scoreChecklist = buildChineseScoreChecklist(style);
  const styleMeta = STYLE_CONFIG[style] || STYLE_CONFIG.argumentative;

  if (materialPoints.length < 3) {
    safetyNotes.push('材料有效信息较少，建议补充题干中的限定条件再生成。');
  }

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'essay_outline',
      featureLabel: '作文写前提分',
      style,
      styleLabel: styleMeta.label,
      source: 'fallback-rules',
      modelFailureReason,
      debug: debugInfo,
    },
    material_points: materialPoints,
    angles,
    outline,
    score_checklist: scoreChecklist,
    safety_notes: safetyNotes,
  };
  result.sections = buildOutlineSections(result);
  return result;
}

let cloudbaseSdk = null;
let aiModelInstance;

function getCloudbaseSdk() {
  if (cloudbaseSdk) {
    return cloudbaseSdk;
  }
  try {
    cloudbaseSdk = require('@cloudbase/node-sdk');
    return cloudbaseSdk;
  } catch (error) {
    return null;
  }
}

function getAiModel() {
  if (aiModelInstance !== undefined) {
    return aiModelInstance;
  }

  const sdk = getCloudbaseSdk();
  if (!sdk) {
    aiModelInstance = null;
    return aiModelInstance;
  }

  try {
    const app = sdk.init({
      env: AI_ENV_ID,
      timeout: CLOUDBASE_TIMEOUT_MS,
    });
    if (app && typeof app.ai === 'function') {
      aiModelInstance = app.ai().createModel(AI_MODEL_PROVIDER);
      return aiModelInstance;
    }
    aiModelInstance = null;
    return aiModelInstance;
  } catch (error) {
    aiModelInstance = null;
    return aiModelInstance;
  }
}

function createModelMessages(materialText, style) {
  const styleText = (STYLE_CONFIG[style] && STYLE_CONFIG[style].label) || STYLE_CONFIG.argumentative.label;
  const systemPrompt = [
    '你是高中语文作文教学助手。',
    '你只输出一个 JSON 对象，不要输出 markdown、解释、注释或额外文本。',
    '输出必须以 { 开头，以 } 结尾。',
    'JSON 必须包含字段：material_points, angles, outline, score_checklist, safety_notes。',
    'angles 为 2-3 个对象，每个对象含 title, one_sentence, why_fit, pitfalls。',
    'why_fit 与 pitfalls 必须是字符串数组。',
    'outline.paragraphs 为 5 段，每段含 name, what_to_write, material_hook。',
    'score_checklist 为 3-4 组，每组含 dimension, items。',
    'material_points、what_to_write、items、safety_notes 必须是字符串数组。',
    '语言要简洁可执行，贴合高考语文作文场景。',
  ].join('');

  const userPrompt = [`文体：${styleText}`, '请基于以下材料生成写前提分建议：', materialText].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

async function callModelStreamText(messages, timeoutMs = AI_TIMEOUT_MS) {
  const model = getAiModel();
  if (!model) {
    throw new Error('AI 模型初始化失败');
  }

  const requestTask = async () => {
    if (typeof model.generateText !== 'function') {
      throw new Error('当前模型实例不支持 generateText');
    }

    const response = await model.generateText({
      model: AI_MODEL_NAME,
      messages,
    }, {
      timeout: timeoutMs,
    });

    const text = `${(response && response.text) || ''}`.trim();
    if (!text) {
      throw new Error('模型返回为空');
    }

    return {
      text,
      streamType: 'generateText',
      chunkCount: 1,
    };
  };

  return withTimeout(requestTask(), timeoutMs, '模型调用超时');
}

async function generateEssayOutline(event) {
  const style = normalizeStyle(event.style);
  const styleMeta = STYLE_CONFIG[style] || STYLE_CONFIG.argumentative;
  const materialText = `${event.materialText || ''}`.trim();
  const debugEnabled = (event && event.debugAI === true) || `${process.env.DEBUG_AI || ''}` === '1';

  if (!materialText || materialText.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `请输入不少于 ${MIN_MATERIAL_LENGTH} 字的题目材料`,
    };
  }

  let parsedText = materialText;
  const safetyNotes = ['本结果为 AI 辅助建议，请结合课堂要求进一步调整。'];
  if (parsedText.length > MAX_MATERIAL_LENGTH) {
    parsedText = parsedText.slice(0, MAX_MATERIAL_LENGTH);
    safetyNotes.push(`材料超过 ${MAX_MATERIAL_LENGTH} 字，系统仅基于前 ${MAX_MATERIAL_LENGTH} 字分析。`);
  }

  let aiMaterialText = parsedText;
  if (aiMaterialText.length > AI_REQUEST_MATERIAL_MAX_LENGTH) {
    aiMaterialText = aiMaterialText.slice(0, AI_REQUEST_MATERIAL_MAX_LENGTH);
    safetyNotes.push(`为提升稳定性，AI 调用仅使用前 ${AI_REQUEST_MATERIAL_MAX_LENGTH} 字进行分析。`);
  }

  if (IS_LEGACY_NODE_RUNTIME) {
    return {
      ok: false,
      errorCode: 'RUNTIME_NOT_SUPPORTED',
      message: `当前云函数运行时 Node ${RUNTIME_NODE_VERSION || 'unknown'} 不支持 AI 调用，请在云函数配置中切换到 Node16 后重新部署。`,
    };
  }

  if (!HAS_CLOUD_RUNTIME && process.env.ENABLE_LOCAL_AI !== '1') {
    const fallbackResult = buildChineseFallbackResult(
      style,
      parsedText,
      safetyNotes.concat(['当前为本地运行环境，已跳过模型调用并使用规则生成结果。'])
    );
    return {
      ok: true,
      generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      result: fallbackResult,
    };
  }

  try {
    const startAt = Date.now();
    const runtimeTimeLimitMs = Number((event && event._runtimeTimeLimitMs) || 0);
    let modelResponse = null;

    try {
      const firstAttemptTimeout = buildAttemptTimeout(runtimeTimeLimitMs, startAt, AI_TIMEOUT_MS);
      const messages = createModelMessages(aiMaterialText, style);
      modelResponse = await callModelStreamText(messages, firstAttemptTimeout);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const secondAttemptTimeout = buildAttemptTimeout(runtimeTimeLimitMs, startAt, AI_TIMEOUT_MS);
      const shouldRetry =
        errorMessage.includes('模型调用超时') &&
        aiMaterialText.length > AI_RETRY_MATERIAL_MAX_LENGTH &&
        secondAttemptTimeout >= RETRY_MIN_REMAINING_MS;
      if (!shouldRetry) {
        throw error;
      }

      const retryMaterialText = aiMaterialText.slice(0, AI_RETRY_MATERIAL_MAX_LENGTH);
      safetyNotes.push(`首次 AI 调用超时，已自动缩短材料至 ${AI_RETRY_MATERIAL_MAX_LENGTH} 字重试。`);
      const retryMessages = createModelMessages(retryMaterialText, style);
      modelResponse = await callModelStreamText(retryMessages, secondAttemptTimeout);
    }

    const modelText = modelResponse.text;
    const debugInfo = {
      streamType: modelResponse.streamType,
      chunkCount: modelResponse.chunkCount,
      rawLength: modelText.length,
      elapsedMs: Date.now() - startAt,
      rawPreview: buildRawPreview(modelText, AI_DEBUG_PREVIEW_MAX),
      requestMaterialLength: aiMaterialText.length,
      runtimeTimeLimitMs,
    };

    const parsedModelResult = parseModelJson(modelText);
    const result = normalizeModelResult(parsedModelResult, style);
    result.meta.styleLabel = styleMeta.label;
    if (debugEnabled) {
      result.meta.debug = debugInfo;
    }
    result.safety_notes = (result.safety_notes || []).concat(safetyNotes);

    return {
      ok: true,
      generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      result,
    };
  } catch (error) {
    const modelFailureReason = extractErrorMessage(error);
    const exposeFailureReason = debugEnabled || (event && event.exposeFailureReason === true);
    const safeFailureReason = exposeFailureReason ? modelFailureReason : '';
    const debugInfo = debugEnabled ? { error: modelFailureReason } : null;
    const fallbackNotes = safetyNotes.concat(
      exposeFailureReason
        ? [`模型调用失败原因：${modelFailureReason}`, '模型暂不可用，已自动切换为规则生成结果。']
        : ['模型暂不可用，已自动切换为规则生成结果。']
    );
    const fallbackResult = buildChineseFallbackResult(style, parsedText, fallbackNotes, safeFailureReason, debugInfo);
    return {
      ok: true,
      generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      result: fallbackResult,
    };
  }
}

module.exports = {
  AI_MODEL_PROVIDER,
  AI_MODEL_NAME,
  AI_TIMEOUT_MS,
  generateEssayOutline,
};
