/*
 * @Description: '学习建议云函数入口（模块化路由分发）'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 17:08:00
 */

const cloud = require('wx-server-sdk');
const { readFunctionTimeLimitMs } = require('./src/core/runtime');
const { extractErrorMessage } = require('./src/core/errors');
const { generateBySubject } = require('./src/subjects');
const { AI_MODEL_PROVIDER, AI_MODEL_NAME, AI_TIMEOUT_MS, getChineseFeatureRuntimeState } = require('./src/subjects/chinese');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const FUNCTION_BUILD_ID = '2026-02-27-m2-chinese-expansion-1';
const MIN_AI_FUNCTION_TIMEOUT_MS = 4000;

exports.main = async (event, context) => {
  try {
    const contextTimeLimitMs = readFunctionTimeLimitMs(context);
    if (event && event.type === 'generateOutline') {
      if (contextTimeLimitMs > 0 && contextTimeLimitMs <= MIN_AI_FUNCTION_TIMEOUT_MS) {
        return {
          ok: false,
          errorCode: 'FUNCTION_TIMEOUT_TOO_SHORT',
          message: `当前云函数执行超时仅 ${Math.round(contextTimeLimitMs / 1000)} 秒，AI 调用无法完成。请在云函数配置中将 timeout 调整到 20 秒以上并重新部署。`,
        };
      }
    }

    switch (event.type) {
      case 'healthcheck':
        {
          const chineseRuntimeState = getChineseFeatureRuntimeState();
        return {
          ok: true,
          buildId: FUNCTION_BUILD_ID,
          runtimeNode: (process.versions && process.versions.node) || '',
          timeLimitMs: contextTimeLimitMs,
          aiProvider: AI_MODEL_PROVIDER,
          aiModel: AI_MODEL_NAME,
          aiTimeoutMs: AI_TIMEOUT_MS,
          grayAcceptance: {
            subject: 'chinese',
            featureRuntime: chineseRuntimeState,
          },
        };
        }
      case 'generateOutline':
        return generateBySubject(
          Object.assign({}, event, {
            _runtimeTimeLimitMs: contextTimeLimitMs,
          })
        );
      default:
        return {
          ok: false,
          errorCode: 'UNKNOWN_TYPE',
          message: '不支持的调用类型',
        };
    }
  } catch (error) {
    return {
      ok: false,
      errorCode: 'FUNCTION_RUNTIME_ERROR',
      message: extractErrorMessage(error),
    };
  }
};
