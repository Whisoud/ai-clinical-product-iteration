# Changelog

本文件记录 PM-Framework 工作台模版的版本变更历史。

## [Unreleased]

### 🐛 修复

- **AI prompt 元素特征泄漏框架 class**：保存/删除标注、UI 修改指令的"目标元素特征"会混入框架运行时注入的 class（`prd-badge-pseudo` 等，不在页面源码中），误导 AI 定位。现统一剔除全部框架 class（`prd-inspector-hover` / `prd-badge-pseudo` / `prd-hover` / `prd-active` / `prd-pulse`）
- **onboarding 引导页文案残留旧架构表述**：bridge 约束说明仍写"仅 file:// 需要"（v2 起为全协议唯一渲染器）；Demo 区提示更新为现行交互（点徽章定位卡片 / 编辑视图点元素写需求）

### 📄 文档

- **README 新增「标注管理工作流」**：增 / 删 / 改 / 查四条端到端流程（含"删除须删两处"的不一致后果说明、走查与 hover 双向联动说明）
- **AI_INSTRUCTIONS 精确化**：§3 删除标注中"只删属性"的后果改为准确表述（store 孤儿配置 + 兜底时按 pageUrl 翻出）；新增"运行时注入物识别"条款（`data-prd-num` / `prd-badge-pseudo` 等严禁写入源码）；§5 补充交付态徽章默认可见说明

### ✨ 增强

- **锚点 hover 反向联动**：鼠标移入被标注元素时，右侧对应需求卡片反向高亮并就近滚动可见（新增 `PRD_ANCHOR_HOVER` 消息；同时元素自身呈现 hover 虚线态，与"卡片 hover → 元素高亮"正向联动对称）

### 🔀 合并（copy 2 方案取长补短）

- **replaced 元素徽章显隐门控**：`img`/`input` 等锚点的独立徽章从"仅 IO 裁剪判定"升级为三条件门控（显隐语义祖先链 display/visibility/opacity && IO 几何相交 && 总开关），触发点为 class/style 属性突变（双级 MO：只刷显隐、不重建锚点）与 transitionend 动画终态。修复 img/input 锚点位于 visibility:hidden / opacity:0 祖先内时徽章错误显示的问题
- **虚线态/走查态描边内嵌**：hover 虚线、全部高亮虚线、走查 active 实线的 `outline-offset` 由 +2px 改为 -2px，防止祖先 `overflow:hidden` 紧裁剪切断描边；脉冲保持外扩（瞬时寻路更醒目）
- **徽章 hover 微交互**：锚点 hover 时徽章放大变色（普通元素纯 CSS `::after` 实现，replaced 元素由 setHover 同步类名）
- **代码卫生**：锚点名改 `--pm-prd-` 前缀隔离；bridge 头注释补齐双级 MO 触发纪律与已知限制（WAAPI/媒体查询驱动的显隐无法被 replaced 元素门控感知，普通元素结构性免疫）
- 测试基建：`test-dynamics.html` 新增"⑥ 隐藏容器内的图片锚点"场景（含 `prd-t-img-hidden` 配置）

### 🏗️ 重构

- **标注系统架构重写（声明式锚定，v2）**：标注徽章与高亮从"JS 测量坐标 + 注入 absolute 覆盖层"改为"锚点元素自身的 CSS 状态"，位置跟踪由浏览器排版引擎原生完成。滚动、CSS 动画、显隐切换、缩放场景下标注**构造上不可能漂移**。
  - 徽章双路径：普通元素用 `::after` 伪元素（徽章是元素自身的一部分，display/visibility/opacity 任何显隐状态天然跟随）；`img`/`input` 等 replaced element 用 CSS Anchor Positioning 独立徽章 + IntersectionObserver 显隐同步（不测量位置）；replaced element 且无 Anchor 支持时仅保留描边
  - 删除全部位置同步补丁：MutationObserver（位置类）、transitionend 兜底、resize 重算、滚动容器探测、margin 防御、body reset 注入
- **单一渲染路径**：`localhost` 与 `file://` 统一由 `page-bridge.js` 在 iframe 内渲染（原双引擎并行为标注问题的主要来源之一）；父页面 `prd-renderer.js` 只负责卡片与交互
- **走查导览交互**：右侧面板新增"上一条/下一条"导航与进度指示，逐条定位标注（scrollIntoView + 瞬时脉冲高亮）；"全部高亮"开关作为总览入口；点击页面内标注徽章可直接定位到对应卡片
- **标注默认开启**：徽章常驻（量小不干扰），高亮按需显形
- **桥缺失检测**：页面未引入 `page-bridge.js` 时，右侧面板 2 秒后显示显性警告与纯文本兜底列表（原为静默降级）
- **配置缺失显性化**：页面存在 `data-prd-id` 锚点但 PrdStore 缺少配置时，面板显示警告卡片（原为静默跳过）

### 💥 行为变更

- **删除标注必须同步删除两处**：`PrdStore` 配置 + HTML 上的 `data-prd-id` 属性（原规范称属性残留"无害"，新架构下残留会显示"未配置标注"徽章）
- 废弃旧版 `data-prd-title` / `data-prd-desc` 内联属性的读取兼容（规范早已禁止，本次移除代码路径）
- postMessage 协议整体更换（`PRD_ANNOTATION_LIST` / `PRD_PULSE` / `PRD_SET_ACTIVE` 等），旧消息类型（`PRD_READY` / `SET_HIGHLIGHT_ENABLED` / `HIGHLIGHT` / `SHOW_CARD` / `HIGHLIGHT_CLICK`）不再使用
- 业务页面不再需要（也禁止）为标注手动派发 `resize` 事件兜底

### 🐛 修复（架构性消除）

- 标注漂移：几何快照过期导致的各类错位（transform 动画、space-y 容器 margin、内层滚动、闭包过期等历史问题）
- 标注不显示：动态显隐场景（Tab 切换/弹窗/流式输出）依赖补丁枚举兜底的问题
- 页面未就绪先显示标注：标注现为元素态 CSS，随元素显隐，无独立时序

### 📄 文档

- `AI_INSTRUCTIONS.md` 第 3、9 条按新架构重写；`README.md` 特性与目录说明更新；`DESIGN.md` 标注 token 更新

### 🧪 验证设施

- 新增三个标注压力测试页（导航"标注压力测试"分组，`pages/test-*.html`，可整体删除）：动态显隐与动画（Tab/折叠/抽屉/弹窗/reveal）、布局陷阱（space-y 容器/内层滚动/replaced element/transform 祖先/行内元素/响应式栅格）、动态内容（流式输出顶推/运行时新增锚点/容器 resize）

---

## [1.1.0] - 目录结构与工程化

### 🏗️ 重构

- **目录结构优化**：`scripts/` 重命名为 `tools/`，消除与 `assets/scripts/` 的命名歧义
- **数据源独立**：`project-data.js` 从 `assets/scripts/` 移至独立的 `data/` 目录，`assets/` 目录变为 100% 只读
- **业务资源目录**：新增 `pages/assets/images/` 作为业务页面共享静态资源存放约定

### 🐛 修复

- **消除重复代码**：移除 `prd-renderer.js` 中重复定义的 `escapeHTML`，复用 `main.js` 全局定义

### 🔒 稳定性

- **CDN 版本锁定**：Tailwind CSS CDN 从 latest 锁定到 `3.4.17`，消除不可控更新风险

### 📄 工程化

- 新增 `.editorconfig` 统一编码格式
- 新增 `CHANGELOG.md` 变更日志
- 更新 `README.md`、`AI_INSTRUCTIONS.md` 中的目录描述与路径引用

---

## [1.0.0] - 初始版本

### 核心功能

- 三栏式工作台布局（导航树 / iframe 原型沙箱 / PRD 标注面板）
- 双模式系统（编辑态 / 交付态），协议自动检测
- 双轨检查器（添加交互说明 / 修改 UI 文案）
- "剪贴板即 API"通信协议
- 任务批处理站（Prompt Cart）
- 全局说明抽屉（Markdown 渲染）
- file:// 桥接脚本（page-bridge.js）
- Node.js 自动化（serve / watch / sync-nav）
- 双层视觉规范架构（DESIGN.md 框架层 / page-design.md 业务层）
