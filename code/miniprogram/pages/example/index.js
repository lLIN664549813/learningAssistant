/*
 * @Description: '结果页：结构化建议渲染（支持多学科扩展）'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-26 18:08:00
 */

const STORAGE_KEY = 'essayOutlineLatest';

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

const buildCopyContent = (resultData, selectedAngle) => {
  const lines = [];
  lines.push('【材料要点】');
  (resultData.material_points || []).forEach((point, index) => {
    lines.push(`${index + 1}. ${point}`);
  });

  if (selectedAngle) {
    lines.push('');
    lines.push('【当前立意】');
    lines.push(`${selectedAngle.title}：${selectedAngle.one_sentence}`);
    lines.push('匹配理由：');
    (selectedAngle.why_fit || []).forEach((reason, index) => {
      lines.push(`${index + 1}. ${reason}`);
    });
  }

  lines.push('');
  lines.push('【结构化提纲】');
  (resultData.outline?.paragraphs || []).forEach((paragraph, index) => {
    lines.push(`${index + 1}. ${paragraph.name}`);
    (paragraph.what_to_write || []).forEach((item) => {
      lines.push(`   - ${item}`);
    });
  });

  lines.push('');
  lines.push('【提分点清单】');
  (resultData.score_checklist || []).forEach((group) => {
    lines.push(`${group.dimension}`);
    (group.items || []).forEach((item) => {
      lines.push(`- ${item}`);
    });
  });
  return lines.join('\n');
};

Page({
  data: {
    hasResult: false,
    resultData: null,
    subjectLabel: '语文',
    styleLabel: '',
    generatedAtText: '',
    selectedAngleIndex: 0,
    selectedAngle: null,
    hasSafetyNotes: false,
    modelFallbackReason: '',
  },

  onLoad() {
    const payload = wx.getStorageSync(STORAGE_KEY);
    const resultData = payload?.response?.result;
    if (!resultData) {
      this.setData({ hasResult: false });
      return;
    }

    const firstAngle = resultData.angles?.[0] || null;
    const isFallback = resultData?.meta?.source === 'fallback-rules';
    const modelFallbackReason = resultData?.meta?.modelFailureReason || '';

    this.setData({
      hasResult: true,
      resultData,
      subjectLabel: payload.subjectLabel || SUBJECT_LABEL_MAP[payload.subject] || '语文',
      styleLabel: STYLE_LABEL_MAP[payload.style] || '-',
      generatedAtText: formatDate(payload.generatedAt),
      selectedAngleIndex: 0,
      selectedAngle: firstAngle,
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

  onSelectAngle(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const selectedAngle = this.data.resultData?.angles?.[index] || null;
    this.setData({
      selectedAngleIndex: index,
      selectedAngle,
    });
  },

  onCopyResult() {
    if (!this.data.hasResult) {
      return;
    }
    const text = buildCopyContent(this.data.resultData, this.data.selectedAngle);
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
