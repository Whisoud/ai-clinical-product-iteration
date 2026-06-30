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
4. **双轨检查器 (Dual-purpose Inspector)**：
   - **模式一 (添加交互说明)**：点击页面元素即可挂载 PRD 标注，数据存储于全局 PrdStore 字典（`project-data.js`），不污染页面 HTML。
   - **模式二 (修改 UI/文案)**：点击元素即可生成精准的源码修改指令（包含标签名、class 和内容指纹），让 AI 像长了眼睛一样百发百中。
5. **任务批处理站 (Prompt Cart)**：无感拦截并暂存 PM 的多步操作指令，智能检测冲突，支持一键批量发给 AI。
6. **自动化目录同步**：后台运行 `npm run dev`，即可监听页面文件的增删改并自动同步到左侧导航树。
7. **双重交付模式**：支持 `localhost` 完整体验，也支持离线 `file://` 协议下的安全降级展示。

## 📁 核心目录结构与定义

项目采用了严格的物理隔离设计，以确保 AI 生成代码时不会污染工作台主框架。

```text
PM-First-Static-Framework/
├── 📄 index.html                # 【只读·框架级】工作台主入口（自动识别协议：localhost=编辑态，file://=交付态）
├── 📄 AI_INSTRUCTIONS.md        # 【只读·框架级】严格约束 AI 行为的系统级提示词（PM 维护）
├── 📄 README.md                 # 【只读·框架级】架构总览与使用说明（PM 维护）
├── 📄 package.json              # 【只读·框架级】项目配置与自动化脚本依赖（整体严禁 AI 修改）
│
├── 📂 assets/                   # 工作台框架静态资源（引擎核心）
│   ├── 📂 scripts/
│   │   ├── 📄 project-data.js   # 【唯一数据源】左侧导航树与全局 PRD 字典数据
│   │   ├── 📄 main.js           # 【只读·框架级】工作台主干 UI 与交互引擎
│   │   ├── 📄 prd-renderer.js   # 【只读·框架级】沙箱通信与 PRD 标注渲染引擎
│   │   └── 📄 page-bridge.js    # 【只读·框架级】file:// 桥接脚本（pages/*.html 必须引入）
│   └── 📂 styles/
│       └── 📄 main.css          # 【只读·框架级】工作台全局与高亮交互样式
│
├── 📂 pages/                    # 🚀 【AI 演练场】业务页面沙箱
│   └── 📄 onboarding.html       # (示例) 单页流式新手引导
│   # 👆 AI 生成的所有 HTML 页面必须且只能存放在此目录下
│
├── 📂 docs/                     # 📚 全局文档沙箱
│   └── 📄 overview.html         # 全局业务说明、名词解释、权限规则等
│
└── 📂 scripts/                  # ⚙️ 【只读·框架级】Node.js 自动化脚本（PM 可执行，AI 不可修改）
    ├── 📄 watch.js              # 监听 pages 目录变动的服务
    ├── 📄 sync-nav.js           # 增量合并算法：自动同步物理文件到导航树
    └── 📄 serve.js              # PM 本地静态服务器（npm start 入口）
```

## 🛠️ 标准工作流 (SOP)

1. **初始化**：复制本模版文件夹作为新项目外壳。复制后建议清空 `pages/` 下的示例页面（`onboarding.html`）、删除 `project-data.js` 中的演示 PrdStore 数据，从空白开始（但保留 `navConfig` 的根节点结构与 `PrdStore = {}` 空对象）。
2. **写总览**：在 `docs/overview.html` 中编写全局业务说明。
3. **AI 生成**：在 `pages/` 下新建 HTML 文件，将 Prompt 发给 AI（如 Trae），由 AI 在沙箱内生成高保真 UI。
4. **打点标注**：在工作台的 `编辑视图` 下，直接鼠标点击生成的 UI 元素，添加 PRD 交互与业务规则。
5. **打包交付**：将整个文件夹发给开发，开发双击 `index.html` 即可。系统会自动识别 file:// 协议进入只读交付模式，无需任何配置。PM 自己开发时，运行 `npm start` 即可启动本地服务器进入编辑态。

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

> **模式说明**：PM 跑 `npm start` 进入编辑态（localhost 自动识别）；研发拿到文件夹双击 `index.html` 进入交付态（file:// 自动识别）。也可通过 URL 参数强制切换：`?mode=preview` 强制交付态，`?mode=edit` 强制编辑态。