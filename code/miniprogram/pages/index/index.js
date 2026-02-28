/*
 * @Description: '首页输入：当前语文可用，架构支持全学科扩展'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-28 13:50:11
 */

const STORAGE_KEY = 'essayOutlineLatest';
const EXPECTED_FUNCTION_BUILD = '2026-02-28-remove-ocr-1';
const PAGE_AD_SLOT = {
  enabled: true,
  unitId: '',
  placeholderText: '',
};

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
  { label: '演讲稿', value: 'speech' },
  { label: '书信', value: 'letter' },
  { label: '倡议书/发言稿', value: 'proposal' },
];

const FEATURE_OPTIONS = [
  {
    label: '作文写前提分',
    value: 'essay_outline',
    requiresStyle: true,
    minLength: 60,
    placeholder: '请粘贴作文题目或材料（建议 60 字以上）',
    hint: '当前输出：材料要点、立意候选、结构化提纲、评分清单',
    demoText:
      '阅读下面材料，根据要求写作。有人说，走得快的人往往看得远；也有人说，走得稳的人才能走得远。在学习与成长中，速度与稳健并不总是一致。面对竞争、选择与压力，我们常在“快一步”与“稳一点”之间摇摆。请结合材料，联系现实，谈谈你的思考。',
  },
  {
    label: '作文写后体检',
    value: 'essay_review',
    requiresStyle: true,
    minLength: 80,
    placeholder: '请粘贴你的作文正文（建议 80 字以上）',
    hint: '当前输出：扣题/结构/语言问题清单 + 二次修改行动单',
    demoText:
      '成长的路上，我们总想快一点赢，慢一点就会焦虑。可当我在一次考试失利后重新整理错题，才意识到真正的进步不是一味求快，而是在关键环节稳住节奏。后来我把计划拆成每天可执行的小目标，效率反而提高。速度和稳健并不是对立的，只有把基础打牢，才有资格谈更快的突破。',
  },
  {
    label: '现代文阅读',
    value: 'modern_reading',
    requiresStyle: false,
    minLength: 60,
    placeholder: '请粘贴现代文阅读材料或题干（建议 60 字以上）',
    hint: '当前输出：主旨结构判断 + 高频题型答题模板',
    demoText:
      '在信息爆炸的时代，真正稀缺的不是信息，而是深度思考的能力。很多人习惯快速浏览，却很少停下来追问“这条信息意味着什么”。阅读不是被动接收，而是主动建构意义。只有把阅读变成思考训练，才能在复杂现实中保持判断力。',
  },
  {
    label: '文言文',
    value: 'classical_chinese',
    requiresStyle: false,
    minLength: 40,
    placeholder: '请粘贴文言文语段（建议 40 字以上）',
    hint: '当前输出：断句建议 + 重点词义 + 翻译步骤',
    demoText: '师者，所以传道受业解惑也。人非生而知之者，孰能无惑？惑而不从师，其为惑也，终不解矣。',
  },
  {
    label: '古诗词鉴赏',
    value: 'poetry_appreciation',
    requiresStyle: false,
    minLength: 20,
    placeholder: '请粘贴诗词原文或题干（建议 20 字以上）',
    hint: '当前输出：意象提取 + 情感判断 + 手法分析模板',
    demoText: '明月松间照，清泉石上流。竹喧归浣女，莲动下渔舟。',
  },
  {
    label: '语言文字运用',
    value: 'language_usage',
    requiresStyle: false,
    minLength: 30,
    placeholder: '请粘贴语言运用题干（建议 30 字以上）',
    hint: '当前输出：病句排查清单 + 衔接方法 + 成语提醒',
    demoText: '请修改下列语段中的语病，并说明修改理由。为了提升同学们的阅读能力，学校开展了经典阅读活动，受到了师生的一致好评和积极响应。',
  },
  {
    label: '名著阅读',
    value: 'famous_reading',
    requiresStyle: false,
    minLength: 30,
    placeholder: '请粘贴名著阅读题干（建议 30 字以上）',
    hint: '当前输出：人物关系梳理 + 情节线索 + 高频问法模板',
    demoText: '请结合《红楼梦》相关情节，分析林黛玉形象的主要特点，并说明其与贾宝玉关系对主题表达的作用。',
  },
];

const getSubjectLabel = (subject) => {
  const item = SUBJECT_OPTIONS.find((option) => option.value === subject);
  return item ? item.label : '语文';
};

const getFeatureConfig = (feature) => FEATURE_OPTIONS.find((option) => option.value === feature) || FEATURE_OPTIONS[0];

Page({
  data: {
    materialText: '',
    subject: 'chinese',
    subjectLabel: '语文',
    subjectOptions: SUBJECT_OPTIONS,
    feature: 'essay_outline',
    featureLabel: '作文写前提分',
    featureOptions: FEATURE_OPTIONS,
    style: 'argumentative',
    styleOptions: STYLE_OPTIONS,
    showStyleSelector: true,
    isGenerating: false,
    minLength: 60,
    maxLength: 3000,
    inputPlaceholder: '请粘贴作文题目或材料（建议 60 字以上）',
    hintText: '当前输出：材料要点、立意候选、结构化提纲、评分清单',
    adSlotEnabled: PAGE_AD_SLOT.enabled,
    adUnitId: PAGE_AD_SLOT.unitId,
    adPlaceholderText: PAGE_AD_SLOT.placeholderText,
  },

  onMaterialInput(event) {
    const nextText = event.detail.value || '';
    this.setData({
      materialText: nextText,
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

  onFeatureChange(event) {
    const index = Number(event.detail.value || 0);
    const selectedFeature = FEATURE_OPTIONS[index];
    if (!selectedFeature) {
      return;
    }
    this.setData({
      feature: selectedFeature.value,
      featureLabel: selectedFeature.label,
      showStyleSelector: !!selectedFeature.requiresStyle,
      minLength: selectedFeature.minLength,
      inputPlaceholder: selectedFeature.placeholder,
      hintText: selectedFeature.hint,
    });
  },

  onStyleChange(event) {
    this.setData({
      style: event.detail.value,
    });
  },

  onStyleTap(event) {
    const value = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.value : '';
    if (!value || value === this.data.style) {
      return;
    }
    this.setData({
      style: value,
    });
  },

  fillDemoMaterial() {
    const featureConfig = getFeatureConfig(this.data.feature);
    const demo = featureConfig.demoText;
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

      const requestPayload = {
        type: 'generateOutline',
        debugAI: true,
        exposeFailureReason: true,
        subject: this.data.subject,
        feature: this.data.feature,
        materialText,
        style: this.data.showStyleSelector ? this.data.style : '',
      };

      const response = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: requestPayload,
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
        feature: this.data.feature,
        featureLabel: this.data.featureLabel,
        materialText,
        style: this.data.showStyleSelector ? this.data.style : '',
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
