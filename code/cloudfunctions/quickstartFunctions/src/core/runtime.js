/*
 * @Description: '云函数运行时工具：超时与上下文时限解析'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

function parseTimeout(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    return fallback;
  }
  return Math.floor(parsed);
}

function readFunctionTimeLimitMs(context) {
  if (!context || typeof context !== 'object') {
    return 0;
  }

  const candidates = [
    context.time_limit_in_ms,
    context.timeLimitInMs,
    context.timeLimitIns,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const value = Number(candidates[index]);
    if (Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }
  }

  return 0;
}

function buildAttemptTimeout(runtimeTimeLimitMs, callStartAt, aiTimeoutMs, headroomMs = 10000) {
  const elapsedMs = Date.now() - callStartAt;
  if (!Number.isFinite(runtimeTimeLimitMs) || runtimeTimeLimitMs <= 0) {
    return aiTimeoutMs;
  }

  const remainingMs = runtimeTimeLimitMs - elapsedMs - headroomMs;
  const safeRemainingMs = Math.max(1500, remainingMs);
  return Math.max(1500, Math.min(aiTimeoutMs, safeRemainingMs));
}

module.exports = {
  parseTimeout,
  readFunctionTimeLimitMs,
  buildAttemptTimeout,
};
