# 2026-08-24 迭代

## 账号切换器（用户需求：2个抖音号怎么切换）
- main.js：`M.go` 暴露 `M.cur`；新增 `Main.setActiveAccount(id)`（存 settings.activeAccount，空串=全部），调用处重渲染当前页。
- views_center.js：
  - `Views.center_accounts` 顶部加账号切换胶囊（仅 ≥2 个账号时显示），点击设为"当前账号"并高亮；附「全部账号」取消聚焦。
  - `accCard(a, activeId)` 当前账号卡加 `.active` 高亮边框。
  - `Views.center_dashboard` 加 scope：有当前账号则只统计该账号（近7天播放/总粉丝/各平台柱图/本月目标），顶部加「当前聚焦：xxx」提示条 + 查看全部按钮。
- index.html：新增 `.acc-switch / .acc-chip / .card.active / .focus-bar` 样式。
- 验证：node --check 通过；线上拉源码核对三文件改动均生效。
- 线上地址：https://6509416a8fc2495f894d829ed67a94a5.bj5.agentos-app.net
