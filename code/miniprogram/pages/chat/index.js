/*
 * @Description: '聊天页面逻辑：单轮消息发送与Codex云函数调用'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-03-03 11:14:51
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-03-03 11:14:51
 */

const MAX_INPUT_LENGTH = 2000;

function buildMessage(role, text) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
  };
}

Page({
  data: {
    messages: [
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: '你好，我是 AI 助手。请告诉我你想解决的问题。',
      },
    ],
    inputText: '',
    isSending: false,
    scrollIntoView: 'welcome-msg',
    maxInputLength: MAX_INPUT_LENGTH,
  },

  onInput(event) {
    this.setData({
      inputText: event.detail.value || '',
    });
  },

  onClear() {
    this.setData({
      messages: [],
      scrollIntoView: '',
    });
  },

  async onSend() {
    if (this.data.isSending) {
      return;
    }

    const message = `${this.data.inputText || ''}`.trim();
    if (!message) {
      wx.showToast({
        title: '请输入问题',
        icon: 'none',
      });
      return;
    }

    if (message.length > MAX_INPUT_LENGTH) {
      wx.showToast({
        title: `输入不能超过 ${MAX_INPUT_LENGTH} 字`,
        icon: 'none',
      });
      return;
    }

    const userMessage = buildMessage('user', message);
    const nextMessages = this.data.messages.concat(userMessage);
    this.setData({
      messages: nextMessages,
      inputText: '',
      isSending: true,
      scrollIntoView: userMessage.id,
    });

    try {
      const response = await wx.cloud.callFunction({
        name: 'codexChat',
        data: {
          type: 'chat',
          message,
        },
      });

      const result = response && response.result;
      if (!result || typeof result !== 'object') {
        throw new Error('云函数返回格式异常');
      }
      if (!result.ok) {
        throw new Error(result.message || '聊天请求失败');
      }

      const reply = result.result && `${result.result.reply || ''}`.trim();
      if (!reply) {
        throw new Error('AI 返回为空');
      }

      const assistantMessage = buildMessage('assistant', reply);
      this.setData({
        messages: this.data.messages.concat(assistantMessage),
        scrollIntoView: assistantMessage.id,
      });
    } catch (error) {
      wx.showModal({
        title: '发送失败',
        content: error?.message || error?.errMsg || '请稍后重试',
        showCancel: false,
      });
    } finally {
      this.setData({
        isSending: false,
      });
    }
  },
});
