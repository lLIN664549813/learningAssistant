/*
 * @Description: '语文学科通用工具'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

function ensureStringArray(value, fallback = [], max = 8) {
  if (Array.isArray(value)) {
    return value
      .map((item) => `${item || ''}`.trim())
      .filter((item) => item)
      .slice(0, max);
  }

  if (typeof value === 'string') {
    return value
      .split(/[；;。\n、|]/)
      .map((item) => item.trim())
      .filter((item) => item)
      .slice(0, max);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => `${item || ''}`.trim())
      .filter((item) => item)
      .slice(0, max);
  }

  return fallback;
}

function splitSentences(text) {
  return `${text || ''}`
    .replace(/\r/g, '')
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);
}

function pickMaterialPoints(sentences) {
  const points = [];
  for (let index = 0; index < sentences.length; index += 1) {
    if (points.length >= 5) {
      break;
    }
    const point = sentences[index]
      .replace(/[“”"'《》]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (point) {
      points.push(point);
    }
  }
  if (points.length === 0 && sentences[0]) {
    points.push(sentences[0].slice(0, 28));
  }
  return points;
}

function inferTheme(materialPoints) {
  const firstPoint = materialPoints[0] || '材料核心主题';
  return firstPoint.slice(0, 12);
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

function buildRawPreview(text, max = 600) {
  return `${text || ''}`.slice(0, max);
}

function toSectionList(title, items, type = 'unordered') {
  return {
    title,
    type,
    items: ensureStringArray(items, []),
  };
}

module.exports = {
  ensureStringArray,
  splitSentences,
  pickMaterialPoints,
  inferTheme,
  withTimeout,
  buildRawPreview,
  toSectionList,
};
