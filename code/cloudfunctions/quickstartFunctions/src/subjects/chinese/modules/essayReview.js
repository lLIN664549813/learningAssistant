/*
 * @Description: '语文作文写后体检模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const { normalizeStyle, STYLE_CONFIG } = require('../config');
const { splitSentences } = require('../utils');

const MIN_MATERIAL_LENGTH = 80;

function extractWeakSentences(text) {
  const lines = splitSentences(text).slice(0, 8);
  return lines.filter((line) => line.length < 14 || /非常|很多|特别|各种|一些/.test(line)).slice(0, 3);
}

function generateEssayReview(event) {
  const style = normalizeStyle(event.style);
  const styleMeta = STYLE_CONFIG[style] || STYLE_CONFIG.argumentative;
  const text = `${event.materialText || ''}`.trim();

  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `作文内容建议不少于 ${MIN_MATERIAL_LENGTH} 字，才能完成写后体检。`,
    };
  }

  const weakSentences = extractWeakSentences(text);
  const issues = [
    {
      title: '扣题风险',
      desc: '首段与结尾可能未形成同一核心命题闭环。',
      bullets: ['首段加入材料关键词并给出明确立场', '结尾重申中心句，避免“总结型空话”'],
    },
    {
      title: '结构风险',
      desc: '段落之间递进关系不够清晰。',
      bullets: ['每段开头补一句“本段任务句”', '将并列段改为“现象-原因-对策”或“问题-分析-回应”'],
    },
    {
      title: '语言风险',
      desc: '存在泛化表达，影响说服力。',
      bullets: ['将“很重要/非常好”替换为可验证描述', '每段至少保留 1 句分析型长句 + 1 句结论型短句'],
    },
  ];

  if (weakSentences.length > 0) {
    issues.push({
      title: '可优先修改句',
      desc: '以下句子信息密度偏低，建议优先改写。',
      bullets: weakSentences,
    });
  }

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'essay_review',
      featureLabel: '作文写后体检',
      style,
      styleLabel: styleMeta.label,
      source: 'rule-review-v1',
    },
    sections: [
      {
        title: '体检结论',
        type: 'unordered',
        items: ['当前稿件可围绕“扣题-结构-语言”三维优化。', '先改结构再润色语言，提升效率更高。'],
      },
      {
        title: '问题清单与建议',
        type: 'cards',
        items: issues,
      },
      {
        title: '二次修改行动单',
        type: 'ordered',
        items: ['重写首段中心句（1 句）', '重排中间段落逻辑（2-3 段）', '替换空泛词并补 2 处分析句', '检查结尾回扣材料关键词'],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，请结合老师批改意见综合判断。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generateEssayReview,
};
