/*
 * @Description: '结果页：按语文模块通用渲染'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:28:00
 */

const STORAGE_KEY = 'essayOutlineLatest';
const PAGE_AD_SLOT = {
  enabled: true,
  unitId: '',
  placeholderText: '',
};

const SUBJECT_LABEL_MAP = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  politics: '政治',
  history: '历史',
  geography: '地理',
};

const STYLE_LABEL_MAP = {
  argumentative: '议论文',
  narrative: '记叙文',
  speech: '演讲稿',
  letter: '书信',
  proposal: '倡议书/发言稿',
};

const FEATURE_LABEL_MAP = {
  essay_outline: '作文写前提分',
  essay_review: '作文写后体检',
  modern_reading: '现代文阅读',
  classical_chinese: '文言文',
  poetry_appreciation: '古诗词鉴赏',
  language_usage: '语言文字运用',
  famous_reading: '名著阅读',
};

const formatDate = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const flattenObject = (value) => {
  if (!value || typeof value !== 'object') {
    return `${value || ''}`;
  }
  return Object.keys(value)
    .map((key) => `${key}：${value[key]}`)
    .join('；');
};

const normalizeLegacySections = (resultData) => {
  if (Array.isArray(resultData.sections) && resultData.sections.length > 0) {
    return resultData.sections;
  }

  const sections = [];
  if (Array.isArray(resultData.material_points) && resultData.material_points.length > 0) {
    sections.push({
      title: '材料要点',
      type: 'ordered',
      items: resultData.material_points,
    });
  }

  if (Array.isArray(resultData.angles) && resultData.angles.length > 0) {
    sections.push({
      title: '立意候选',
      type: 'cards',
      items: resultData.angles.map((item) => ({
        title: item.title,
        desc: item.one_sentence,
        bullets: ['匹配理由：', ...(item.why_fit || []), '跑题风险：', ...(item.pitfalls || [])],
      })),
    });
  }

  if (resultData.outline && Array.isArray(resultData.outline.paragraphs)) {
    sections.push({
      title: '结构化提纲',
      type: 'cards',
      items: resultData.outline.paragraphs.map((item) => ({
        title: item.name,
        desc: `材料回扣：${item.material_hook}`,
        bullets: item.what_to_write || [],
      })),
    });
  }

  if (Array.isArray(resultData.score_checklist) && resultData.score_checklist.length > 0) {
    sections.push({
      title: '评分清单',
      type: 'cards',
      items: resultData.score_checklist.map((item) => ({
        title: item.dimension,
        desc: '',
        bullets: item.items || [],
      })),
    });
  }

  return sections;
};

const normalizeSectionsForView = (sections) =>
  (sections || []).map((section) => {
    const safeType = section.type === 'cards' ? 'cards' : 'list';
    if (safeType === 'cards') {
      return {
        title: section.title || '结果分组',
        viewType: 'cards',
        entries: (section.items || []).map((item) => ({
          title: item.title || '-',
          desc: item.desc || '',
          bullets: Array.isArray(item.bullets)
            ? item.bullets.map((bullet) => `${bullet || ''}`).filter((bullet) => bullet)
            : [],
        })),
      };
    }

    return {
      title: section.title || '结果分组',
      viewType: 'list',
      entries: (section.items || []).map((item) => ({
        text: typeof item === 'string' ? item : flattenObject(item),
      })),
    };
  });

const buildCopyContent = (resultData) => {
  const lines = [];
  const sections = normalizeLegacySections(resultData);
  sections.forEach((section) => {
    lines.push(`【${section.title || '结果分组'}】`);
    if (section.type === 'cards') {
      (section.items || []).forEach((item, cardIndex) => {
        lines.push(`${cardIndex + 1}. ${item.title || '-'}`);
        if (item.desc) {
          lines.push(`   ${item.desc}`);
        }
        (item.bullets || []).forEach((bullet) => {
          lines.push(`   - ${bullet}`);
        });
      });
    } else {
      (section.items || []).forEach((item, index) => {
        lines.push(`${index + 1}. ${typeof item === 'string' ? item : flattenObject(item)}`);
      });
    }
    lines.push('');
  });

  if (Array.isArray(resultData.safety_notes) && resultData.safety_notes.length > 0) {
    lines.push('【提示】');
    resultData.safety_notes.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
  }

  return lines.join('\n').trim();
};

Page({
  data: {
    hasResult: false,
    resultData: null,
    sections: [],
    subjectLabel: '语文',
    featureLabel: '作文写前提分',
    styleLabel: '',
    generatedAtText: '',
    hasSafetyNotes: false,
    modelFallbackReason: '',
    adSlotEnabled: PAGE_AD_SLOT.enabled,
    adUnitId: PAGE_AD_SLOT.unitId,
    adPlaceholderText: PAGE_AD_SLOT.placeholderText,
  },

  onLoad() {
    const payload = wx.getStorageSync(STORAGE_KEY);
    const resultData = payload?.response?.result;
    if (!resultData) {
      this.setData({ hasResult: false });
      return;
    }

    const isFallback = resultData?.meta?.source === 'fallback-rules';
    const modelFallbackReason = resultData?.meta?.modelFailureReason || '';
    const sections = normalizeSectionsForView(normalizeLegacySections(resultData));
    const currentFeature = payload.feature || resultData?.meta?.feature || 'essay_outline';
    const shouldShowStyle = currentFeature === 'essay_outline' || currentFeature === 'essay_review';

    this.setData({
      hasResult: true,
      resultData,
      sections,
      subjectLabel: payload.subjectLabel || resultData?.meta?.subjectLabel || SUBJECT_LABEL_MAP[payload.subject] || '语文',
      featureLabel: payload.featureLabel || resultData?.meta?.featureLabel || FEATURE_LABEL_MAP[currentFeature] || '语文模块',
      styleLabel: shouldShowStyle
        ? resultData?.meta?.styleLabel || STYLE_LABEL_MAP[resultData?.meta?.style] || STYLE_LABEL_MAP[payload.style] || '-'
        : '-',
      generatedAtText: formatDate(payload.generatedAt),
      hasSafetyNotes: (resultData.safety_notes || []).length > 0,
      modelFallbackReason,
    });

    if (isFallback && modelFallbackReason) {
      wx.showModal({
        title: '模型调用失败',
        content: `失败原因：${modelFallbackReason}`,
        showCancel: false,
      });
    } else if (isFallback) {
      wx.showToast({
        title: '已切换为规则生成',
        icon: 'none',
      });
    }
  },

  onCopyResult() {
    if (!this.data.hasResult) {
      return;
    }
    const text = buildCopyContent(this.data.resultData);
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制结果',
          icon: 'success',
        });
      },
    });
  },

  onRegenerate() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.reLaunch({
          url: '/pages/index/index',
        });
      },
    });
  },
});
