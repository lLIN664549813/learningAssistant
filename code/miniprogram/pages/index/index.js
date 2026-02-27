/*
 * @Description: '首页输入：当前语文可用，架构支持全学科扩展'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 11:36:00
 */

const STORAGE_KEY = 'essayOutlineLatest';
const EXPECTED_FUNCTION_BUILD = '2026-02-27-ai-stable-4';

const SUBJECT_OPTIONS = [
  { label: '语文', value: 'chinese', enabled: true },
  { label: '数学', value: 'math', enabled: false },
  { label: '英语', value: 'english', enabled: false },
  { label: '物理', value: 'physics', enabled: false },
  { label: '化学', value: 'chemistry', enabled: false },
  { label: '生物', value: 'biology', enabled: false },
  { label: '政治', value: 'politics', enabled: false },
  { label: '历史', value: 'history', enabled: false },
  { label: '地理', value: 'geography', enabled: false },
];

const STYLE_OPTIONS = [
  { label: '议论文', value: 'argumentative' },
  { label: '记叙文', value: 'narrative' },
];

const getSubjectLabel = (subject) => {
  const item = SUBJECT_OPTIONS.find((option) => option.value === subject);
  return item ? item.label : '语文';
};

Page({
  data: {
    materialText: '',
    subject: 'chinese',
    subjectLabel: '语文',
    subjectOptions: SUBJECT_OPTIONS,
    style: 'argumentative',
    styleOptions: STYLE_OPTIONS,
    isGenerating: false,
    minLength: 60,
    maxLength: 3000,
  },

  onMaterialInput(event) {
    this.setData({
      materialText: event.detail.value || '',
    });
  },

  onSubjectChange(event) {
    const index = Number(event.detail.value || 0);
    const selectedSubject = SUBJECT_OPTIONS[index];
    if (!selectedSubject) {
      return;
    }

    if (!selectedSubject.enabled) {
      wx.showToast({
        title: `${selectedSubject.label}即将上线`,
        icon: 'none',
      });
      return;
    }

    this.setData({
      subject: selectedSubject.value,
      subjectLabel: selectedSubject.label,
    });
  },

  onStyleChange(event) {
    this.setData({
      style: event.detail.value,
    });
  },

  fillDemoMaterial() {
    const demo = '阅读下面材料，根据要求写作。有人说，走得快的人往往看得远；也有人说，走得稳的人才能走得远。在学习与成长中，速度与稳健并不总是一致。面对竞争、选择与压力，我们常在“快一步”与“稳一点”之间摇摆。请结合材料，联系现实，谈谈你的思考。';
    this.setData({
      materialText: demo,
    });
  },

  async onGenerate() {
    if (this.data.isGenerating) {
      return;
    }

    const materialText = (this.data.materialText || '').trim();
    if (!materialText) {
      wx.showToast({
        title: '请先粘贴题目材料',
        icon: 'none',
      });
      return;
    }

    if (materialText.length < this.data.minLength) {
      wx.showToast({
        title: `材料字数建议不少于${this.data.minLength}字`,
        icon: 'none',
      });
      return;
    }

    this.setData({ isGenerating: true });
    wx.showLoading({ title: '正在生成' });

    try {
      const healthResponse = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'healthcheck',
        },
      });

      const healthResult = healthResponse && healthResponse.result;
      if (!healthResult || healthResult.ok !== true) {
        throw new Error(`云函数健康检查失败：${JSON.stringify(healthResult || healthResponse || {}).slice(0, 220)}。请确认体验版已部署最新 quickstartFunctions。`);
      }

      if (healthResult.buildId !== EXPECTED_FUNCTION_BUILD) {
        throw new Error(`云函数版本不一致：当前 ${healthResult.buildId || 'unknown'}，期望 ${EXPECTED_FUNCTION_BUILD}。请重新部署云函数后再试。`);
      }

      if (Number(healthResult.timeLimitMs || 0) > 0 && Number(healthResult.timeLimitMs || 0) <= 4000) {
        throw new Error(`云函数超时配置仅 ${Math.round(Number(healthResult.timeLimitMs || 0) / 1000)} 秒，AI 调用会失败。请将 timeout 调整到 20 秒以上并重新部署。`);
      }

      const response = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'generateOutline',
          debugAI: true,
          exposeFailureReason: true,
          subject: this.data.subject,
          materialText,
          style: this.data.style,
        },
      });

      const cloudResult = response && response.result;
      const requestId = (response && (response.requestID || response.requestId)) || '';
      if (!cloudResult || typeof cloudResult !== 'object') {
        throw new Error(`云函数返回异常：${JSON.stringify(response || {}).slice(0, 240)}`);
      }

      if (!Object.prototype.hasOwnProperty.call(cloudResult, 'ok')) {
        throw new Error(
          `云函数返回非预期结构：${JSON.stringify(cloudResult).slice(0, 240)}${requestId ? `，requestId: ${requestId}` : ''}。请确认已部署最新 quickstartFunctions 代码。`
        );
      }

      if (!cloudResult.ok) {
        const errorCode = cloudResult.errorCode || 'UNKNOWN';
        throw new Error(cloudResult.message || `云函数执行失败，错误码：${errorCode}${requestId ? `，requestId: ${requestId}` : ''}`);
      }

      if (!cloudResult.result) {
        throw new Error(`云函数缺少 result 字段：${JSON.stringify(cloudResult).slice(0, 240)}`);
      }

      wx.setStorageSync(STORAGE_KEY, {
        subject: this.data.subject,
        subjectLabel: this.data.subjectLabel,
        materialText,
        style: this.data.style,
        generatedAt: Date.now(),
        response: cloudResult,
      });

      wx.navigateTo({
        url: '/pages/example/index',
      });
    } catch (error) {
      wx.showModal({
        title: '生成失败',
        content: error?.message || error?.errMsg || '请稍后重试',
        showCancel: false,
      });
    } finally {
      wx.hideLoading();
      this.setData({ isGenerating: false });
    }
  },
});
