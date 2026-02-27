/*
 * @Description: '语文现代文阅读模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const { splitSentences, pickMaterialPoints } = require('../utils');

const MIN_MATERIAL_LENGTH = 60;

function generateModernReading(event) {
  const text = `${event.materialText || ''}`.trim();
  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `现代文阅读材料建议不少于 ${MIN_MATERIAL_LENGTH} 字。`,
    };
  }

  const points = pickMaterialPoints(splitSentences(text));
  const mainTheme = points[0] || '文本围绕核心问题展开观点表达';

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'modern_reading',
      featureLabel: '现代文阅读',
      source: 'rule-modern-reading-v1',
    },
    sections: [
      {
        title: '主旨与结构判断',
        type: 'cards',
        items: [
          {
            title: '主旨推断',
            desc: `可围绕“${mainTheme.slice(0, 24)}”组织答案。`,
            bullets: ['先写作者态度，再写现实意义', '避免只复述原文句子'],
          },
          {
            title: '结构拆解',
            desc: '建议按“提出问题-分析展开-价值落点”理解文本。',
            bullets: ['定位过渡句与总结句', '提炼每段段意，不超过 12 字'],
          },
        ],
      },
      {
        title: '高频题型答题框架',
        type: 'cards',
        items: [
          {
            title: '词句作用题',
            desc: '句子内容 + 结构位置 + 表达效果',
            bullets: ['先解释字面义', '再写在段落结构中的作用', '最后回扣主旨'],
          },
          {
            title: '段落作用题',
            desc: '内容作用 + 结构作用 + 情感作用',
            bullets: ['指出承上启下或伏笔照应', '说明对人物/主题推进'],
          },
          {
            title: '主旨理解题',
            desc: '观点提炼 + 依据定位 + 现实延展',
            bullets: ['至少引用 2 处文本依据', '结尾补一句现实意义'],
          },
        ],
      },
      {
        title: '答题模板（可直接套用）',
        type: 'ordered',
        items: [
          '这句话在内容上写出了……，在结构上起到……作用，从而突出……主题。',
          '本文先……再……最后……，层层推进表达了作者……态度。',
          '结合第X段与第Y段可知，作者意在强调……，启示我们……。',
        ],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，答题时请结合原文具体语句作答。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generateModernReading,
};
