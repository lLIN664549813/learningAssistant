/*
 * @Description: 'Codex聊天中转云函数：接收小程序消息并调用OpenAI接口'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-03-03 11:14:51
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-03-03 13:56:38
 */

const https = require('https');
const { URL } = require('url');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const OPENAI_API_BASE = `${process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'}`.replace(/\/+$/, '');
const OPENAI_MODEL = `${process.env.OPENAI_MODEL || 'codex-mini-latest'}`.trim();
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 20000);
const MAX_MESSAGE_LENGTH = 2000;

function extractErrorMessage(error) {
  const raw =
    (error && error.message) ||
    (error && error.errMsg) ||
    (error && error.error) ||
    (typeof error === 'string' ? error : '未知错误');
  return `${raw}`.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function normalizeTimeout(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 3000) {
    return fallback;
  }
  return Math.floor(parsed);
}

function maskSecret(value) {
  const text = `${value || ''}`.trim();
  if (!text) {
    return '';
  }
  if (text.length <= 10) {
    return `${text.slice(0, 2)}***${text.slice(-2)}`;
  }
  return `${text.slice(0, 6)}***${text.slice(-4)}`;
}

function readResponseText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output_text)) {
    const merged = payload.output_text.map((item) => `${item || ''}`.trim()).filter((item) => item).join('\n');
    if (merged) {
      return merged;
    }
  }

  if (Array.isArray(payload.output)) {
    const contentText = payload.output
      .flatMap((item) => (item && Array.isArray(item.content) ? item.content : []))
      .map((item) => (item && (item.text || item.output_text)) || '')
      .map((item) => `${item}`.trim())
      .filter((item) => item)
      .join('\n');
    if (contentText) {
      return contentText;
    }
  }

  const choiceText =
    payload &&
    payload.choices &&
    payload.choices[0] &&
    payload.choices[0].message &&
    payload.choices[0].message.content;
  if (Array.isArray(choiceText)) {
    const mergedChoiceText = choiceText
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        return (item && item.text) || '';
      })
      .map((item) => `${item}`.trim())
      .filter((item) => item)
      .join('\n');
    if (mergedChoiceText) {
      return mergedChoiceText;
    }
  }
  if (typeof choiceText === 'string' && choiceText.trim()) {
    return choiceText.trim();
  }

  return '';
}

function requestOpenAi(pathname, payload, apiKey, timeoutMs) {
  return new Promise((resolve, reject) => {
    const target = new URL(`${OPENAI_API_BASE}${pathname}`);
    const requestData = JSON.stringify(payload);

    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const statusCode = Number(res.statusCode || 0);
          let parsed = {};
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch (error) {
            reject(new Error(`OpenAI返回非JSON，状态码：${statusCode}`));
            return;
          }

          if (statusCode < 200 || statusCode >= 300) {
            const apiErrorCode = (parsed && parsed.error && parsed.error.code) || '';
            const apiErrorType = (parsed && parsed.error && parsed.error.type) || '';
            const apiErrorParam = (parsed && parsed.error && parsed.error.param) || '';
            const apiErrorMessage =
              (parsed && parsed.error && parsed.error.message) ||
              (parsed && parsed.message) ||
              `OpenAI请求失败，状态码：${statusCode}`;
            const detailParts = [
              `status=${statusCode}`,
              apiErrorCode ? `code=${apiErrorCode}` : '',
              apiErrorType ? `type=${apiErrorType}` : '',
              apiErrorParam ? `param=${apiErrorParam}` : '',
            ].filter((item) => item);
            const bodyPreview = `${body || ''}`.trim().replace(/\s+/g, ' ').slice(0, 220);
            const detailText = detailParts.join(', ');
            reject(new Error(`${apiErrorMessage}${detailText ? ` (${detailText})` : ''}${bodyPreview ? ` | body: ${bodyPreview}` : ''}`));
            return;
          }

          resolve(parsed);
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('请求OpenAI超时'));
    });
    req.on('error', (error) => {
      reject(error);
    });
    req.write(requestData);
    req.end();
  });
}

exports.main = async (event) => {
  const type = `${(event && event.type) || ''}`.trim();
  const apiKey = `${process.env.OPENAI_API_KEY || ''}`.trim();

  if (type === 'debugEnv') {
    return {
      ok: true,
      result: {
        runEnv: `${process.env.TCB_ENV || ''}`.trim(),
        functionName: `${process.env.WX_CLOUD_FUNCTION_NAME || ''}`.trim(),
        openAiApiBase: OPENAI_API_BASE,
        openAiModel: OPENAI_MODEL,
        requestMode: OPENAI_API_BASE.includes('right.codes') ? 'chat_completions' : 'responses',
        hasOpenAiApiKey: Boolean(apiKey),
        openAiApiKeyMasked: maskSecret(apiKey),
      },
    };
  }

  if (type !== 'chat') {
    return {
      ok: false,
      errorCode: 'UNKNOWN_TYPE',
      message: '不支持的调用类型',
    };
  }

  const message = `${(event && event.message) || ''}`.trim();
  if (!message) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message: '请输入聊天内容',
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      errorCode: 'MESSAGE_TOO_LONG',
      message: `输入长度不能超过 ${MAX_MESSAGE_LENGTH} 字`,
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      errorCode: 'CONFIG_MISSING',
      message: '云函数未配置 OPENAI_API_KEY',
    };
  }

  try {
    if (OPENAI_API_BASE.includes('right.codes')) {
      const compatibleResponse = await requestOpenAi(
        '/chat/completions',
        {
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: '你是一个清晰、可靠的中文助手。回答要直接、准确。',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 800,
          temperature: 0.4,
        },
        apiKey,
        normalizeTimeout(OPENAI_TIMEOUT_MS, 20000)
      );

      const compatibleReply = readResponseText(compatibleResponse);
      if (!compatibleReply) {
        throw new Error('OpenAI返回内容为空');
      }

      return {
        ok: true,
        result: {
          reply: compatibleReply,
          model: OPENAI_MODEL,
          requestId: `${compatibleResponse.id || ''}`.trim(),
        },
      };
    }

    const response = await requestOpenAi(
      '/responses',
      {
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: '你是一个清晰、可靠的中文助手。回答要直接、准确。',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: message,
              },
            ],
          },
        ],
        max_output_tokens: 800,
      },
      apiKey,
      normalizeTimeout(OPENAI_TIMEOUT_MS, 20000)
    );

    const reply = readResponseText(response);
    if (!reply) {
      throw new Error('OpenAI返回内容为空');
    }

    return {
      ok: true,
      result: {
        reply,
        model: OPENAI_MODEL,
        requestId: `${response.id || ''}`.trim(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: 'OPENAI_REQUEST_FAILED',
      message: extractErrorMessage(error),
    };
  }
};
