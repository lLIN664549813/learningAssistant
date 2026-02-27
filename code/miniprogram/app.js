/*
 * @Description: '小程序初始化与云环境配置'
 * @Version: 1.0
 * @Autor:'zhanglin'
 * @Date: 2026-02-26 11:46:00
 * @LastEditors: 'zhanglin'
 * @LastEditTime: 2026-02-26 11:46:00
 */

App({
  onLaunch() {
    this.globalData = {
      env: 'cloud1-1g2nu0dnc866c9b3',
    };

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以支持云能力');
      return;
    }

    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true,
    });
  },
});
