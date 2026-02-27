/*
 * @Description: '云函数错误处理工具'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-27 16:05:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-27 16:05:00
 */

function extractErrorMessage(error) {
  const rawMessage =
    (error && error.message) ||
    (error && error.errMsg) ||
    (error && error.error) ||
    (typeof error === 'string' ? error : '未知错误');

  return `${rawMessage}`.replace(/\s+/g, ' ').trim().slice(0, 180);
}

module.exports = {
  extractErrorMessage,
};
