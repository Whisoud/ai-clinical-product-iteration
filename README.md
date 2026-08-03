# AI-PM 原型工作台 (Boilerplate)

> **⚠️ 致 AI 助手的特别说明**：
> 本 `README.md` 文件是为 **人类开发者与产品经理** 编写的架构总览与使用说明书。
> 作为 AI，在执行代码修改、生成页面或处理用户指令时，**必须且只能以 `AI_INSTRUCTIONS.md` 中的系统指令为绝对准则！** 若两者在某些实现细节上存在冲突，永远以 `AI_INSTRUCTIONS.md` 的规定为最高优先级。

这是一个专为 AI 时代产品经理打造的“所见即所得”工业级原型工作台模版。
通过物理隔离和纯净沙箱机制，实现了 **“UI 归 AI，逻辑与标注归 PM”** 的高效协同工作流。

## 核心特性

1. **零构建的纯静态架构**：无需 Webpack/Vite，双击 `index.html` 即可运行，极致轻量。
2. **沙箱隔离的页面预览**：使用 iframe 完美隔离外壳与内容，防止 AI 误改框架代码。
3. **“剪贴板即 API”通信协议**：PM 在界面上的任何操作，都会转化为结构化的 Prompt 复制到剪贴板，由 AI 执行，实现代码级的绝对安全。
4. **声明式锚定的 PRD 标注（v2）**：
   - 标注徽章与高亮是锚点元素自身的 CSS 状态（由 page-bridge.js 注入），浏览器排版引擎原生跟踪位置——滚动、动画、显隐、缩放永不漂移，零 JS 几何测量。
   - **走查导览**：右侧面板即标注目录，上一条/下一条逐条定位（滚动 + 脉冲高亮），"全部高亮"一键总览。
5. **双轨检查器 (Dual-purpose Inspector)**：
   - **模式一 (添加交互说明)**：点击页面元素即可挂载 PRD 标注，数据存储于全局 PrdStore 字典（`project-data.js`），不污染页面 HTML。
   - **模式二 (修改 UI/文案)**：点击元素即可生成精准的源码修改指令（包含标签名、class 和内容指纹），让 AI 像长了眼睛一样百发百中。
6. **任务批处理站 (Prompt Cart)**：无感拦截并暂存 PM 的多步操作指令，智能检测冲突，支持一键批量发给 AI。
7. **自动化目录同步**：后台运行 `npm run dev`，即可监听页面文件的增删改并自动同步到左侧导航树。
8. **单一渲染路径的双重交付**：`localhost` 与 `file://` 下标注渲染完全同路径（均由页面内桥接脚本完成），表现一致；交付态自动只读。

## 📁 核心目录结构与定义

项目采用了严格的物理隔离设计，以确保 AI 生成代码时不会污染工作台主框架。

```text
PM-Framework/
├── 📄 index.html                # 【只读·框架级】工作台主入口（自动识别协议：localhost=编辑态，file://=交付态）
├── 📄 AI_INSTRUCTIONS.md        # 【只读·框架级】严格约束 AI 行为的系统级提示词（PM 维护）
├── 📄 README.md                 # 【只读·框架级】架构总览与使用说明（PM 维护）
├── 📄 DESIGN.md                 # 【只读·框架级】框架层（外壳）视觉规范（YAML token + Markdown 理念，固化 index.html/main.css 的配色/字号/圆角/间距；由 PM 维护，不约束 pages/*.html 业务页面，禁止在业务页面中引用）
├── 📄 package.json              # 【只读·框架级】项目配置与自动化脚本依赖（整体严禁 AI 修改）
│
├── 📂 data/                     # 📝 数据层（AI 可写）
│   └── 📄 project-data.js      # 【唯一数据源】项目元信息 + 导航树 + PRD 字典 + 全局说明内容（OverviewContent）
│
├── 📂 assets/                   # 🔒 工作台框架静态资源（引擎核心，全部只读）
│   ├── 📂 scripts/
│   │   ├── 📄 main.js           # 【只读·框架级】工作台主干 UI 与交互引擎（含全局说明渲染逻辑）
│   │   ├── 📄 prd-renderer.js   # 【只读·框架级】标注卡片面板、走查导览与编辑交互（父页面侧，零几何测量）
│   │   └── 📄 page-bridge.js    # 【只读·框架级】声明式标注渲染桥（pages/*.html 必须引入，全协议激活）
│   └── 📂 styles/
│       └── 📄 main.css          # 【只读·框架级】工作台全局样式（iframe 内标注样式由 page-bridge.js 注入，不在此处）
│
├── 📂 pages/                    # 🚀 【AI 演练场】业务页面沙箱
│   ├── 📂 assets/               # 业务页面共享静态资源（图片/图标等）
│   │   └── 📂 images/
│   └── 📄 onboarding.html       # (示例) 单页流式新手引导
│   ├── 📄 test-dynamics.html    # (验证设施) 标注压力测试：动态显隐与动画
│   ├── 📄 test-layout.html      # (验证设施) 标注压力测试：布局陷阱
│   ├── 📄 test-dynamic-content.html # (验证设施) 标注压力测试：动态内容
│   # 👆 AI 生成的所有 HTML 页面必须且只能存放在此目录下
│   # 👆 三个 test-*.html 为标注系统回归验证页（导航"标注压力测试"分组），验收后可整体删除
│
├── 📂 docs/                     # 📚 业务层文档沙箱（业务视觉规范）
│   └── 📄 page-design.md        # 【可选·业务级】业务页面视觉规范（YAML token + MD 理念，约束 pages/*.html；PM 维护，AI 可读可改；不约束框架外壳，与根目录 DESIGN.md 互不参考）
│
└── 📂 tools/                    # ⚙️ 【只读·框架级】Node.js 自动化脚本（PM 可执行，AI 不可修改）
    ├── 📄 watch.js              # 监听 pages 目录变动的服务
    ├── 📄 sync-nav.js           # 增量合并算法：自动同步物理文件到导航树
    └── 📄 serve.js              # PM 本地静态服务器（npm start 入口）
```

## 🎨 视觉规范分层设计

本工作台采用**双层视觉规范**架构，物理隔离、逻辑独立、互不参考：

| 层级 | 文件 | 约束对象 | 谁维护 | AI 权限 | 是否必选 |
|------|------|---------|--------|---------|---------|
| **框架层** | `DESIGN.md`（根目录） | `index.html`、`assets/styles/main.css` 等外壳 | PM | 🚫 不可改 | ✅ 必选 |
| **业务层** | `docs/page-design.md` | `pages/*.html` 业务页面 | PM | ✅ 可改（在 PM 指令下） | ⚙️ 可选 |

**关键规则**：
- AI 生成/修改 `pages/*.html` 时，**只读 `docs/page-design.md`**，严禁参考根目录 `DESIGN.md`。
- 当 PM 的 Prompt 已显式指定视觉细节时，AI 不必读 `page-design.md`，直接按 Prompt 执行（优先级：PM Prompt > page-design.md > AI 默认）。
- 两个 `.md` 文件均**禁止在 `pages/*.html` 中运行时引用**（link/fetch/import 均禁止），它们仅是 AI 生成代码时的上下文参考。
- `page-design.md` 是可选的：文件不存在或为空壳时，AI 按 Prompt 生成，不报错。

详细规则见 `AI_INSTRUCTIONS.md`。

## 🛠️ 标准工作流 (SOP)

1. **初始化**：复制本模版文件夹作为新项目外壳。复制后建议清空 `pages/` 下的示例页面（`onboarding.html` 与三个 `test-*.html` 标注压力测试页）、删除 `data/project-data.js` 中的演示 PrdStore 数据（含"标注压力测试"分组）与 OverviewContent 内容，从空白开始（但保留 `navConfig` 的根节点结构、`PrdStore = {}` 空对象、`OverviewContent` 空反引号字符串）。
2. **写总览**：在 `data/project-data.js` 的 `window.OverviewContent` 变量中编写全局业务说明（Markdown 格式，反引号字符串）。
3. **AI 生成**：在 `pages/` 下新建 HTML 文件，将 Prompt 发给 AI（如 Trae），由 AI 在沙箱内生成高保真 UI。
4. **打点标注**：在工作台的 `编辑视图` 下，直接鼠标点击生成的 UI 元素，添加 PRD 交互与业务规则。
5. **打包交付**：将整个文件夹发给开发，开发双击 `index.html` 即可。系统会自动识别 file:// 协议进入只读交付模式，无需任何配置。PM 自己开发时，运行 `npm start` 即可启动本地服务器进入编辑态。

## 🏷️ 标注管理工作流

标注数据与结构解耦：页面 HTML 只保留 `data-prd-id` 锚点，标题/描述/pageUrl 集中在 `data/project-data.js` 的 `window.PrdStore`（唯一数据源）。以下操作都在工作台完成，prompt 自动进「任务批处理站」，攒一批后可一键发给 AI。

### 添加标注
1. 切到顶部「编辑视图」，在中间原型上点击目标元素（悬停有蓝色高亮）
2. 填写标题与描述（支持 Markdown），点「保存并复制」
3. 将 prompt 发给 AI 执行：在页面元素上写 `data-prd-id`，并在 `project-data.js` 写入配置

### 编辑标注
1. 编辑视图下，hover 右侧标注卡片出现编辑按钮（或直接点击原型中已标注的元素）
2. 修改内容 →「保存并复制」→ 发 AI
3. 注意：AI 按"整对象替换"更新配置，不会出现字段丢失

### 删除标注
1. 编辑视图下，hover 卡片点删除按钮并确认
2. 预览立即删除，同时删除 prompt 已复制 → 发 AI
3. **AI 必须删两处**：`project-data.js` 中的配置 + HTML 元素上的 `data-prd-id` 属性。只删一半会不一致：只删配置 → 页面残留"未配置标注"徽章与警告卡片；只删属性 → store 残留孤儿配置（脏数据）

### 查看与走查
- 徽章默认常驻（蓝色小编号点，锚点右上角）；点击徽章或卡片即可滚动定位并脉冲高亮
- 右侧面板顶部「‹ 1/N ›」走查按钮逐条过标注；「全部高亮」一键总览
- hover 双向联动：悬停卡片 → 元素虚线高亮；悬停元素 → 对应卡片反向高亮
- 工具栏「隐藏标注」可随时收起全部徽章与高亮

## 🤖 自动化支持

在项目根目录下执行：

```bash
# 安装依赖
npm install

# 启动本地服务器（PM 编辑态推荐入口，浏览器自动打开 localhost）
npm start

# 启动后台监听服务（实时将 pages 目录下的新建页面同步到导航树，保留拖拽排序）
npm run dev
```

> **模式说明**：PM 跑 `npm start` 进入编辑态（localhost 自动识别）；研发拿到文件夹双击 `index.html` 进入交付态（file:// 自动识别）。也可通过 URL 参数强制切换：`?mode=preview` 强制交付态，`?mode=edit` 强制编辑态。交付态下标注徽章默认可见（供研发对照查看），点工具栏「隐藏标注」即可关闭。