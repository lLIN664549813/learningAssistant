/*
 * @Description: '语文学科处理器与功能子路由'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 17:08:00
 */

const { normalizeFeature, FEATURE_CONFIG, getChineseFeatureRuntimeState } = require('./config');
const { generateEssayOutline, AI_MODEL_PROVIDER, AI_MODEL_NAME, AI_TIMEOUT_MS } = require('./modules/essayOutline');
const { generateEssayReview } = require('./modules/essayReview');
const { generateModernReading } = require('./modules/modernReading');
const { generateClassicalChinese } = require('./modules/classicalChinese');
const { generatePoetryAppreciation } = require('./modules/poetryAppreciation');
const { generateLanguageUsage } = require('./modules/languageUsage');
const { generateFamousReading } = require('./modules/famousReading');

const CHINESE_FEATURE_HANDLERS = {
  essay_outline: generateEssayOutline,
  essay_review: generateEssayReview,
  modern_reading: generateModernReading,
  classical_chinese: generateClassicalChinese,
  poetry_appreciation: generatePoetryAppreciation,
  language_usage: generateLanguageUsage,
  famous_reading: generateFamousReading,
};

async function generateChineseResult(event) {
  const feature = normalizeFeature(event.feature);
  const featureMeta = FEATURE_CONFIG[feature];
  if (!(featureMeta && featureMeta.enabled)) {
    return {
      ok: false,
      errorCode: 'FEATURE_NOT_READY',
      message: `${(featureMeta && featureMeta.label) || '该语文模块'}正在开发中。`,
    };
  }

  const handler = CHINESE_FEATURE_HANDLERS[feature];
  if (!handler) {
    return {
      ok: false,
      errorCode: 'FEATURE_HANDLER_MISSING',
      message: '语文功能处理器未实现。',
    };
  }

  return handler(
    Object.assign({}, event, {
      feature,
      featureLabel: featureMeta.label,
    })
  );
}

module.exports = {
  AI_MODEL_PROVIDER,
  AI_MODEL_NAME,
  AI_TIMEOUT_MS,
  FEATURE_CONFIG,
  getChineseFeatureRuntimeState,
  generateChineseResult,
};
