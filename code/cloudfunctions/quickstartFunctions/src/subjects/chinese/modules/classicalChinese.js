/*
 * @Description: '语文文言文模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const { splitSentences } = require('../utils');

const MIN_MATERIAL_LENGTH = 40;

function normalizeClassicalLine(line) {
  return `${line || ''}`.replace(/[，。！？；]/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateClassicalChinese(event) {
  const text = `${event.materialText || ''}`.trim();
  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `文言文材料建议不少于 ${MIN_MATERIAL_LENGTH} 字。`,
    };
  }

  const lines = splitSentences(text).slice(0, 3).map((item) => normalizeClassicalLine(item)).filter((item) => item);
  const fallbackLines = lines.length > 0 ? lines : ['臣闻古之学者必有师', '师者所以传道受业解惑也'];

  const analysisCards = fallbackLines.map((line, index) => ({
    title: `句${index + 1}：${line.slice(0, 18)}`,
    desc: '建议先断句，再判断实词义与句式。',
    bullets: [`断句建议：${line.replace(/\s+/g, ' / ')}`, '关键词：其、而、以、之（按语境判断）', '翻译提示：先直译再顺句'],
  }));

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'classical_chinese',
      featureLabel: '文言文',
      source: 'rule-classical-v1',
    },
    sections: [
      {
        title: '句级解析',
        type: 'cards',
        items: analysisCards,
      },
      {
        title: '高频实虚词提醒',
        type: 'unordered',
        items: ['“其”常见：代词/语气副词', '“以”常见：介词“用、把、凭”', '“而”常见：并列、转折、承接'],
      },
      {
        title: '翻译步骤模板',
        type: 'ordered',
        items: ['先找主谓宾，补全省略成分', '落实实词、虚词与特殊句式', '按现代汉语语序重组并润色'],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，断句与翻译请以教材注释和课堂标准为准。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generateClassicalChinese,
};
