/*
 * @Description: '语文名著阅读模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const MIN_MATERIAL_LENGTH = 30;

function generateFamousReading(event) {
  const text = `${event.materialText || ''}`.trim();
  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `名著阅读题干建议不少于 ${MIN_MATERIAL_LENGTH} 字。`,
    };
  }

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'famous_reading',
      featureLabel: '名著阅读',
      source: 'rule-famous-reading-v1',
    },
    sections: [
      {
        title: '人物关系梳理',
        type: 'cards',
        items: [
          {
            title: '主角关系网',
            desc: '按“亲属/同盟/对立”三类整理。',
            bullets: ['写清人物身份', '补一条关键冲突事件'],
          },
          {
            title: '配角功能',
            desc: '判断其对主线推进的作用。',
            bullets: ['推动情节', '映衬主角性格', '揭示主题'],
          },
        ],
      },
      {
        title: '情节线索模板',
        type: 'ordered',
        items: ['起点事件：引发主要矛盾', '转折事件：人物关系变化', '高潮事件：冲突集中爆发', '结局事件：主题价值落地'],
      },
      {
        title: '高频问法答题骨架',
        type: 'cards',
        items: [
          {
            title: '人物形象题',
            desc: '观点 + 依据 + 评价',
            bullets: ['先定性格关键词', '引用两个关键情节支撑', '结尾写其主题意义'],
          },
          {
            title: '情节作用题',
            desc: '内容作用 + 结构作用 + 主题作用',
            bullets: ['说明对后文铺垫', '说明对人物塑造影响'],
          },
        ],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，请结合原著文本与课堂要求完成作答。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generateFamousReading,
};
