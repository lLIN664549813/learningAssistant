/*
 * @Description: '语文古诗词鉴赏模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const MIN_MATERIAL_LENGTH = 20;

function generatePoetryAppreciation(event) {
  const text = `${event.materialText || ''}`.trim();
  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `古诗词材料建议不少于 ${MIN_MATERIAL_LENGTH} 字。`,
    };
  }

  const keywords = text
    .replace(/[，。！？；、“”]/g, ' ')
    .split(/\s+/)
    .filter((item) => item.length >= 2)
    .slice(0, 5);

  const imagery = keywords.length > 0 ? keywords : ['月', '风', '山', '水'];

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'poetry_appreciation',
      featureLabel: '古诗词鉴赏',
      source: 'rule-poetry-v1',
    },
    sections: [
      {
        title: '意象提取',
        type: 'ordered',
        items: imagery.map((item) => `核心意象：${item}`),
      },
      {
        title: '情感判断',
        type: 'cards',
        items: [
          {
            title: '主情感',
            desc: '可优先判断“思乡/怀人/感时/自勉”中的主线。',
            bullets: ['结合时间词与场景词定位情感色调', '避免直接贴标签，需引用诗句依据'],
          },
          {
            title: '情感变化',
            desc: '关注转折词与视角变化。',
            bullets: ['先写前半情绪，再写后半情绪', '补一句“由……到……”形成层次'],
          },
        ],
      },
      {
        title: '手法分析模板',
        type: 'ordered',
        items: ['手法判断：借景抒情/托物言志/对比衬托', '作用表达：增强画面感与情感力度', '答题句式：通过……描写，表达了诗人……情感'],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，鉴赏结论需结合具体诗句逐点作答。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generatePoetryAppreciation,
};
