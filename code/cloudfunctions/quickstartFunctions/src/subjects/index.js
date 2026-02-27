/*
 * @Description: '学科注册与路由分发'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

const { generateChineseResult } = require('./chinese');

const SUBJECT_CONFIG = {
  chinese: { label: '语文', enabled: true },
  math: { label: '数学', enabled: false },
  english: { label: '英语', enabled: false },
  physics: { label: '物理', enabled: false },
  chemistry: { label: '化学', enabled: false },
  biology: { label: '生物', enabled: false },
  politics: { label: '政治', enabled: false },
  history: { label: '历史', enabled: false },
  geography: { label: '地理', enabled: false },
};

const SUBJECT_HANDLERS = {
  chinese: generateChineseResult,
};

function normalizeSubject(subject) {
  const value = `${subject || 'chinese'}`.toLowerCase().trim();
  return SUBJECT_CONFIG[value] ? value : 'chinese';
}

async function generateBySubject(event) {
  const subject = normalizeSubject(event.subject);
  const subjectMeta = SUBJECT_CONFIG[subject];
  if (!(subjectMeta && subjectMeta.enabled)) {
    return {
      ok: false,
      errorCode: 'SUBJECT_NOT_READY',
      message: `${(subjectMeta && subjectMeta.label) || '该学科'}正在开发中，当前仅支持语文。`,
    };
  }

  const handler = SUBJECT_HANDLERS[subject];
  if (!handler) {
    return {
      ok: false,
      errorCode: 'SUBJECT_HANDLER_MISSING',
      message: '学科处理器未实现。',
    };
  }

  return handler(
    Object.assign({}, event, {
      subject,
      subjectLabel: subjectMeta.label,
    })
  );
}

module.exports = {
  SUBJECT_CONFIG,
  normalizeSubject,
  generateBySubject,
};
