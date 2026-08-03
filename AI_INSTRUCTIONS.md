# AI-PM 工作台使用与开发指令规约 (AI_INSTRUCTIONS)

🚨 **最高系统指令警戒 (CRITICAL WARNING & HARD GATE)** 🚨
**你当前正在操作一个基于纯前端技术的“产品经理 AI 辅助工作台”模版工作台。**
**你的身份是“页面内容生成器”，绝对不是“框架开发者”！**
这个项目不仅仅是一个静态网页，它的 `index.html` 和 `assets/` 目录构成了工作台的核心外壳和沙箱隔离环境。你的唯一任务是根据产品经理的 Prompt 在指定沙箱内填充业务内容，**严禁越界**。

为了保证工作台的稳定性和后续的自动化交付流程，你在处理所有开发任务时，必须将以下规则视为**最高优先级的不可变红线**。任何违背以下规则的代码修改，都将被判定为**严重执行事故**！

---

## 1. 绝对沙箱隔离原则（越界即失败！）

*   **主框架文件【仅数据源可写】**：
    *   🚫 **严禁修改** 以下框架级文件（哪怕你觉得有 bug 也不许碰，它们是工作台外壳的一部分）：
        *   浏览器侧：`index.html`、`assets/scripts/main.js`、`assets/scripts/prd-renderer.js`、`assets/scripts/page-bridge.js`、`assets/styles/main.css`
        *   Node 侧：`tools/sync-nav.js`、`tools/watch.js`、`tools/serve.js`、`package.json`（含 `dependencies` 与 `scripts` 字段，整体严禁）
        *   规则文档：`AI_INSTRUCTIONS.md`（本文件）、`README.md`（由 PM 维护）、`DESIGN.md`（设计系统规范，由 PM 维护）
    *   ✅ **允许修改** `data/project-data.js`！**这是工作台唯一的数据源文件。你可以根据指令修改其中的 `window.ProjectConfig` (项目元信息)、`window.navConfig` (导航树)、`window.PrdStore` (标注数据) 和 `window.OverviewContent` (全局说明 Markdown)。**
    *   ✅ **允许修改** `pages/*.html`（业务页面沙箱）和 `docs/page-design.md`（业务视觉规范）。
*   **业务页面隔离**：
    *   你生成的所有的原型页面（HTML）、局部样式或局部脚本，**必须且只能**存放在 `pages/` 目录下。
    *   业务视觉规范文件（`page-design.md`）存放在 `docs/` 目录下。
    *   全局说明文档是 `data/project-data.js` 中的 `window.OverviewContent` 变量，不是独立文件。
*   **样式作用域隔离**：
    *   工作台外壳（`index.html`）通过 CDN 引入了 Tailwind CSS、Lucide、marked、DOMPurify、SortableJS，这些**仅作用于父页面**。
    *   业务页面（`pages/*.html`）运行在 iframe 沙箱内，**无法访问父页面的任何 CDN 资源**（iframe 隔离）。
    *   因此 `pages/*.html` 必须是**完全自包含**的：所有样式用 `<style>` 内联或页面内 `<link>`，所有脚本用 `<script>` 内联或页面内 `<link>`。**不要在业务页面里写 Tailwind class**（如 `class="bg-blue-500"`），它们不会生效；也不要假设 `marked`/`DOMPurify` 等库可用。
    *   **唯一例外**：`page-bridge.js` 是工作台提供的桥接脚本，必须按第 9 条规范引入。

## 2. 视觉规范使用规则

本工作台采用**双层视觉规范**架构，物理隔离、逻辑独立、互不参考。详见 `README.md` 的"视觉规范分层设计"章节。

*   **DESIGN.md 设计系统规范的使用边界**：
    `DESIGN.md` 是工作台**框架层**（`index.html`、`assets/styles/main.css` 等外壳）的视觉规范文件（YAML token + Markdown 理念），由 PM 维护，用于固化工作台本身的配色、字号、圆角、间距与组件规范。
    *   🚫 **严禁修改**：`DESIGN.md` 由 PM 维护，你不得以"优化设计系统"为名修改其中的任何 token 或正文。若发现规范与实际页面不符，应向 PM 反馈，而非擅自改动。
    *   🚫 **不约束业务页面**：`pages/*.html` 是业务沙箱，**不属于框架层**，因此 AI 在生成或修改业务页面时，**不应遵循** `DESIGN.md`，应完全以 PM 的具体 Prompt 为准。业务页面的视觉风格由 PM 在 Prompt 中显式指定，与框架层规范解耦。
    *   🚫 **严禁在业务页面中引用**：`pages/*.html` 中**禁止**以任何方式 link/import/读取 `DESIGN.md`（包括 `<link>`、`fetch()`、`XMLHttpRequest`、`import` 语句、`window.parent` 读取等）。它不是运行时资源，仅是 PM 维护框架层时的参考文档。
    *   🚫 **严禁跨沙箱耦合**：不得在 `assets/` 框架脚本中为业务页面添加自动注入 DESIGN.md 数值的逻辑，保持框架层与业务层的完全解耦。

*   **业务页面视觉规范（page-design.md）使用规则**：
    `docs/page-design.md` 是**可选的**业务层视觉规范文件（YAML token + Markdown 理念），约束 `pages/*.html` 业务页面的视觉呈现。与根目录 `DESIGN.md`（框架层）完全独立，互不参考。
    *   **优先级**：PM 的显式 Prompt > `docs/page-design.md` > AI 默认判断。当 PM 的 Prompt 已显式指定颜色/字号/圆角等视觉细节时，AI **不必读取** page-design.md，直接按 Prompt 执行。
    *   **读取时机**：当 PM 的 Prompt 未显式指定视觉细节时，AI 应尝试读取 `docs/page-design.md` 作为默认基线。
    *   **三种状态处理**：
        *   文件存在且已填充 → 遵循其中的 token 与规范
        *   文件存在但是空壳（YAML 为占位符、section 内容为注释或空）→ 在回复中轻量提醒 PM "检测到 page-design.md 为空壳，建议填充"，按 Prompt 生成，不阻塞
        *   文件不存在 → 按 Prompt 生成，不报错
    *   **权限**：`docs/` 是 AI 可改区，AI 可在 PM 指令下修改 `page-design.md`（如"把主色改成蓝色并写入 page-design.md"）。
    *   **严禁混淆**：`docs/page-design.md`（业务层）与根目录 `DESIGN.md`（框架层）约束对象不同，**AI 生成 pages/*.html 时只读 page-design.md，严禁参考 DESIGN.md**。
    *   **运行时禁止引用**：`pages/*.html` 中**禁止**以任何方式 link/fetch/import/读取 `page-design.md`（包括 `<link>`、`fetch()`、`XMLHttpRequest`、`import` 语句、`window.parent` 读取等）。它仅供 AI 生成代码时作为上下文参考，不是运行时资源。

## 3. 数据与 UI 解耦（PRD 标注规范）

当产品经理要求你在某个页面的元素上添加或删除“PRD 属性”时，请注意我们采用了数据与结构解耦的策略：

1.  **HTML 结构中只保留 ID**：
    你只需要在对应的目标 DOM 元素上，添加一个唯一标识属性：`data-prd-id="prd-xxxxx"`。
    *禁止* 再将 `data-prd-title` 或 `data-prd-desc` 写在 HTML 标签上。
    标注的徽章与高亮是锚点元素自身的 CSS 状态（由 page-bridge.js 注入，声明式锚定），
    元素移动/滚动/显隐/动画时自动跟随，**你无需为标注做任何位置兜底**（见第 9 条）。
2.  **数据写入 Store**：
    所有的 PRD 数据（标题、描述、所属页面路径），**必须且只能**写入到 `data/project-data.js` 的 `window.PrdStore` 中，实现单一数据源。
    格式：`window.PrdStore["prd-xxxxx"] = { title: "...", desc: "...", pageUrl: "./pages/xxx.html" }`。
    **`pageUrl` 字段强制必填**，值为该标注所属页面的相对路径（如 `./pages/xxx.html`），用于页面缺失桥接脚本时按页面过滤展示兜底文本。
    **禁止在 `pages/*.html` 内通过 `<script>` 标签向 `window.parent.PrdStore` 注入数据**——这会破坏数据-结构解耦原则，导致数据多源、难以维护。

3.  **删除/修改标注的流程**：
    *   **删除标注**：在 `data/project-data.js` 中删除 `window.PrdStore` 里对应的 key，**并且必须同步删除** HTML 元素上的 `data-prd-id` 属性。
        只删一半会出现不一致：只删 store → 页面残留"未配置标注"徽章与警告卡片；只删属性 → store 残留孤儿配置（工作台不显示，属脏数据；该页面缺 bridge 走文本兜底时会按 pageUrl 被翻出来显示）。
    *   **修改标注**：等同"删除 + 添加"——在 `data/project-data.js` 中用新数据覆盖 `window.PrdStore["prd-xxxxx"]` 的整个对象。禁止只改 `title` 不改 `desc` 这种半覆盖式写法，必须整对象替换以保证 `pageUrl` 字段不丢失。

4.  **运行时注入物识别（严禁写入源码）**：
    工作台生成的 prompt 中"目标元素特征"已剔除框架运行时注入的 class。你在浏览器 DevTools 中可能看到锚点元素上带有 `data-prd-num`、`anchor-name`、`prd-badge-pseudo`、`prd-hover`、`prd-active`、`prd-pulse`、`prd-rbadge` 等属性或 class——这些是 page-bridge.js 在运行时注入的标注状态，**不存在于页面源码中**。严禁将它们写入 `pages/*.html` 源码，也严禁当作页面原有结构去"修复"或删除源码中的对应内容（源码里本来就没有）。

## 4. 页面内弹窗与通信规范

因为所有的业务页面（`pages/*.html`）都是运行在工作台中间的 `iframe` 沙箱中的。
*   如果你需要在原型页面内展示一个全局的 Toast 提示或者二次确认弹窗，**禁止**在 `pages/*.html` 内部重新写一套弹窗 UI。
*   你必须通过调用父页面的全局 API 来实现：`window.parent.showToast('消息')` 或 `window.parent.showConfirm(title, message, onConfirm, okText, okType, targetElement, onCancel)`。
*   如果你需要在 `pages/*.html` 内部触发工作台左侧导航的跳转或点击事件，**必须跨越 iframe 作用域**，使用 `window.parent.document.querySelector(...)` 来寻找并操作外壳 DOM，严禁使用 `document.querySelector` 试图在当前沙箱内寻找父级元素。

## 5. 交付模式 (Delivery Mode) 的认知

工作台支持基于 URL 参数 `?mode=preview` 的只读交付模式，并且会根据协议自动判断：localhost 默认编辑态，file:// 默认交付态。开发人员双击 `index.html` 即可进入交付模式。
在该模式下，工作台会自动隐藏所有非业务的编辑按钮。你在设计页面原型时，不需要考虑“如何隐藏工作台的编辑按钮”，你只需专注于 `pages/` 内部原型的业务逻辑和样式即可。
交付态下标注徽章**默认可见**（供研发对照查看需求），工具栏「隐藏标注」可一键关闭——这是预期行为，不需要你在业务页面中做任何处理。

## 6. 批处理指令执行规范 (Batch Processing)

产品经理现在会使用“任务批处理站”将多个修改指令打包发送给你。当你收到形如：
`请按顺序批量执行以下 X 个任务：`
`【任务 1】：...`
`【任务 2】：...`
的指令时：
*   **强制要求**：你必须严格按照任务编号的顺序，一次性执行完毕所有数据的修改。
*   如果遇到无法理解的任务，请跳过并在最终回复中说明，绝对不要因为单个任务的失败而中断其他任务的执行。

## 7. 自动化工具规范与要求
*   **强制要求**：你必须主动在终端执行 `npm run sync-nav` 以同步左侧导航树。
*   **sync-nav 对子目录的处理**：`sync-nav` **会递归扫描** `pages/` 下的子目录并**保留 folder 层级**（`type: 'folder'` + `children`）。行为分两种情况：
    *   **旧 navConfig 中已存在的文件夹**：保留原有的 id/name/排序/展开状态，仅同步内部页面的增删。
    *   **全新文件夹**（旧 navConfig 中没有的）：会被追加到根数组末尾，但**仍保留 folder 结构**（不是扁平挂到根）。PM 可手动拖拽到目标位置。
    *   如果你需要自定义文件夹的 name 或层级顺序，请在 `project-data.js` 的 `navConfig` 中手动组织。
*   **推荐方案**：你可以在一开始就向产品经理建议：在终端运行 `npm run dev` 开启后台静默监听。开启后，你后续生成的所有页面都将被自动感知并同步，无需再手动执行同步命令。
*   **PM 启动入口提醒**：如果发现 PM 当前在 `file://` 协议下双击 `index.html` 打开工作台（缺少编辑控件、iframe 联动异常），你应该主动提醒 PM 运行 `npm start` 启动本地服务器，以获得完整的编辑态体验。

## 8. UI 修改指令的精准执行
当接收到类似于“请修改页面 xxx 中的源码”且带有“目标元素特征”的 Prompt 时，必须**严格根据特征定位**（利用标签名、class 列表以及辅助的文本片段），严禁误伤同名/同类元素。修改仅限指定的元素本身及其内部结构，严禁擅自修改非目标区域的布局。

## 9. 桥接脚本引入规范（page-bridge.js）

工作台通过桥接脚本 `assets/scripts/page-bridge.js` 实现"页面元素 ↔ 标注卡片"的全部联动。

*   **强制要求**：你生成的所有 `pages/*.html` 文件，**必须在 `</body>` 标签前引入桥接脚本**：
    ```html
    <script src="../assets/scripts/page-bridge.js"></script>
    ```
*   **工作方式（v2 声明式锚定）**：桥接脚本在 iframe 内注入标注层 CSS，把标注徽章与高亮实现为 `data-prd-id` 锚点元素**自身的 CSS 状态**。元素滚动、显隐、动画、缩放时标注自动跟随，**不做任何 JS 几何测量**，从构造上不存在标注漂移。
*   **全协议激活**：`localhost` 与 `file://` 下渲染路径完全一致，均由桥接脚本完成；父页面只负责右侧卡片与走查导航。不存在"file:// 下表现不同"的问题。
*   **禁止修改、禁止内联、禁止省略**。如果页面缺少这段引用：工作台右侧面板会显示"页面未接入桥接脚本"的警告，标注只能纯文本展示，联动完全失效。
*   如果你新增了一个页面，必须同步引入此脚本。如果你修改了一个已有页面，必须确认此脚本引用仍然存在。
*   **你无需任何手动兜底**：不要为标注显隐/位置手动调用 `dispatchEvent(new Event('resize'))` 或类似 hack——标注是元素态 CSS，随元素生灭，不存在需要"刷新位置"的场景。

## 10. 全局说明文档规范（OverviewContent）

全局说明文档（业务背景、公共规范、名词解释等）存储在 `data/project-data.js` 的 `window.OverviewContent` 变量中（反引号字符串），由 `main.js` 启动时读取并用 marked + DOMPurify 渲染到工作台抽屉。

*   **架构定位**：
    *   **渲染逻辑归框架层**：marked/DOMPurify 引入 + 渲染脚本都在 `index.html` / `main.js`（框架级文件），AI 不可改。PM 点击"全局说明"按钮时，`main.js` 读取 `OverviewContent` 变量 → 渲染 → 注入抽屉的 `#global-req-preview` div。
    *   **内容归数据层**：`window.OverviewContent` 在 `data/project-data.js` 中（AI 可改的数据源文件），与 `ProjectConfig`、`navConfig`、`PrdStore` 并列。
    *   **不再有独立的 overview.html 文件**：全局说明只通过工作台抽屉查看，不存在单独打开的 HTML 文件。

*   **双模式兼容**：基于 JS 全局变量读取，**file:// 和 localhost 行为完全一致**。编辑回显也直接读 `window.OverviewContent`，没有 iframe 跨域限制。

*   **当你收到修改全局说明的 Prompt 时**（形如"请修改全局需求文档 (路径：./data/project-data.js)：该文件中有一个 `window.OverviewContent` 变量..."），必须：
    *   ✅ **只替换 `window.OverviewContent` 变量的反引号字符串值**。
    *   ✅ 保持反引号 `` ` `` 包裹，注意 MD 内容中的反引号需用 `\`` 转义。
    *   🚫 **严禁改动 data/project-data.js 的其他变量**（`ProjectConfig`、`navConfig`、`PrdStore`）。
    *   🚫 **严禁创建或修改任何 HTML 文件**（不存在 overview.html，全局说明不需要独立文件）。

*   **仅支持 Markdown 语法**。不要在 MD 内容里嵌入 `<div>`、`<span>` 等 HTML 标签（会被 DOMPurify 转义或过滤）。换行用空行或行尾两空格。

*   **编辑回显机制**：PM 在编辑视图点"编辑内容"时，textarea 直接读 `window.OverviewContent` 的原始 MD 字符串，PM 改完点"保存并复制"会生成 Prompt 让 AI 改 `project-data.js`。你写入的 MD 原文会被 PM 完整看到并修改，请保证写入的是可读的 MD 源码而非渲染后的 HTML。

---

**最后且最重要的一点：**
当产品经理向你粘贴了一段由工作台生成的 Prompt（如“请修改左侧导航配置...” 或 “请在当前页面进行以下 PRD 配置更新...”）时，你必须像机器一样**绝对精确地执行**指令中要求的数据结构和属性修改。**收起你的发散思维，严禁擅自对项目主框架进行所谓的“代码重构”或“全局优化”。你的克制，就是对这个项目最大的贡献！**