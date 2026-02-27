/*
 * @Description: '语文学科配置：文体与功能模块'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 17:08:00
 */

const STYLE_CONFIG = {
  argumentative: { label: '议论文', group: 'argumentative' },
  narrative: { label: '记叙文', group: 'narrative' },
  speech: { label: '演讲稿', group: 'practical' },
  letter: { label: '书信', group: 'practical' },
  proposal: { label: '倡议书/发言稿', group: 'practical' },
};

const BASE_FEATURE_CONFIG = {
  essay_outline: { label: '作文写前提分', enabled: true },
  essay_review: { label: '作文写后体检', enabled: true },
  modern_reading: { label: '现代文阅读', enabled: true },
  classical_chinese: { label: '文言文', enabled: true },
  poetry_appreciation: { label: '古诗词鉴赏', enabled: true },
  language_usage: { label: '语言文字运用', enabled: true },
  famous_reading: { label: '名著阅读', enabled: true },
};

function parseDisabledFeatureSet() {
  const raw = `${process.env.CHINESE_DISABLED_FEATURES || ''}`.trim();
  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item)
  );
}

const FEATURE_DISABLED_SET = parseDisabledFeatureSet();
const FEATURE_CONFIG = Object.keys(BASE_FEATURE_CONFIG).reduce((config, key) => {
  config[key] = {
    label: BASE_FEATURE_CONFIG[key].label,
    enabled: BASE_FEATURE_CONFIG[key].enabled && !FEATURE_DISABLED_SET.has(key),
  };
  return config;
}, {});

function getChineseFeatureRuntimeState() {
  const features = Object.keys(FEATURE_CONFIG).map((key) => ({
    key,
    label: FEATURE_CONFIG[key].label,
    enabled: FEATURE_CONFIG[key].enabled,
  }));

  return {
    total: features.length,
    enabledCount: features.filter((item) => item.enabled).length,
    disabledFeatures: features.filter((item) => !item.enabled).map((item) => item.key),
    rawDisabledConfig: `${process.env.CHINESE_DISABLED_FEATURES || ''}`.trim(),
    features,
  };
}

function normalizeStyle(style) {
  const value = `${style || 'argumentative'}`.toLowerCase().trim();
  return STYLE_CONFIG[value] ? value : 'argumentative';
}

function normalizeFeature(feature) {
  const value = `${feature || 'essay_outline'}`.toLowerCase().trim();
  return FEATURE_CONFIG[value] ? value : 'essay_outline';
}

module.exports = {
  STYLE_CONFIG,
  FEATURE_CONFIG,
  normalizeStyle,
  normalizeFeature,
  getChineseFeatureRuntimeState,
};
