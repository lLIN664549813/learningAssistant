/*
 * @Description: '语文语言文字运用模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const MIN_MATERIAL_LENGTH = 30;

function generateLanguageUsage(event) {
  const text = `${event.materialText || ''}`.trim();
  if (text.length < MIN_MATERIAL_LENGTH) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: `语言文字运用题干建议不少于 ${MIN_MATERIAL_LENGTH} 字。`,
    };
  }

  const result = {
    schemaVersion: '2.0.0',
    meta: {
      subject: 'chinese',
      subjectLabel: '语文',
      feature: 'language_usage',
      featureLabel: '语言文字运用',
      source: 'rule-language-usage-v1',
    },
    sections: [
      {
        title: '病句排查清单',
        type: 'ordered',
        items: ['主谓搭配是否一致', '关联词是否成对且逻辑一致', '成分是否残缺或赘余', '指代对象是否明确'],
      },
      {
        title: '语句衔接方法',
        type: 'cards',
        items: [
          {
            title: '话题一致',
            desc: '保证相邻句共享同一主语或话题中心。',
            bullets: ['先确定主题句', '再补充解释句与例证句'],
          },
          {
            title: '逻辑连接',
            desc: '按“总-分-总”或“因-果-策”组织。',
            bullets: ['转折用“然而/但是”', '递进用“不仅…而且…”'],
          },
        ],
      },
      {
        title: '成语与表达提醒',
        type: 'unordered',
        items: ['注意感情色彩是否匹配语境', '避免望文生义与对象误配', '压缩语段时优先保留主干信息'],
      },
    ],
    safety_notes: ['本结果为 AI 辅助建议，选择题请以语法规则与语境为最终依据。'],
  };

  return {
    ok: true,
    generationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    result,
  };
}

module.exports = {
  generateLanguageUsage,
};
