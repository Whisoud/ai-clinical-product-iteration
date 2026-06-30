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
        *   Node 侧：`scripts/sync-nav.js`、`scripts/watch.js`、`scripts/serve.js`、`package.json`（含 `dependencies` 与 `scripts` 字段，整体严禁）
        *   规则文档：`AI_INSTRUCTIONS.md`（本文件）、`README.md`（由 PM 维护）
    *   ✅ **允许修改** `assets/scripts/project-data.js`！**这是工作台唯一的数据源文件。你可以根据指令修改其中的 `window.navConfig` (导航树) 和 `window.PrdStore` (标注数据)。**
    *   ✅ **允许修改** `pages/*.html`（业务页面沙箱）和 `docs/*.html`（全局文档沙箱）。
*   **业务页面隔离**：
    *   你生成的所有的原型页面（HTML）、局部样式或局部脚本，**必须且只能**存放在 `pages/` 目录下。
    *   你生成的全局说明文档，必须存放在 `docs/` 目录下（如 `docs/overview.html`）。

## 2. 数据与 UI 解耦（PRD 标注规范）

当产品经理要求你在某个页面的元素上添加或删除“PRD 属性”时，请注意我们采用了数据与结构解耦的策略：

1.  **HTML 结构中只保留 ID**：
    你只需要在对应的目标 DOM 元素上，添加一个唯一标识属性：`data-prd-id="prd-xxxxx"`。
    *禁止* 再将 `data-prd-title` 或 `data-prd-desc` 写在 HTML 标签上。
2.  **数据写入 Store**：
    所有的 PRD 数据（标题、描述、所属页面路径），**必须且只能**写入到 `assets/scripts/project-data.js` 的 `window.PrdStore` 中，实现单一数据源。
    格式：`window.PrdStore["prd-xxxxx"] = { title: "...", desc: "...", pageUrl: "./pages/xxx.html" }`。
    **`pageUrl` 字段强制必填**，值为该标注所属页面的相对路径（如 `./pages/xxx.html`），用于 file:// 协议下降级时按页面过滤展示。
    **禁止在 `pages/*.html` 内通过 `<script>` 标签向 `window.parent.PrdStore` 注入数据**——这会破坏数据-结构解耦原则，导致数据多源、难以维护。

3.  **删除/修改标注的流程**：
    *   **删除标注**：在 `project-data.js` 中删除 `window.PrdStore` 里对应的 key（如 `delete window.PrdStore["prd-xxxxx"]`）。HTML 元素上的 `data-prd-id="prd-xxxxx"` 属性可以保留（无害残留），也可以同步删除。
    *   **修改标注**：等同"删除 + 添加"——在 `project-data.js` 中用新数据覆盖 `window.PrdStore["prd-xxxxx"]` 的整个对象。禁止只改 `title` 不改 `desc` 这种半覆盖式写法，必须整对象替换以保证 `pageUrl` 字段不丢失。

## 3. 页面内弹窗与通信规范

因为所有的业务页面（`pages/*.html`）都是运行在工作台中间的 `iframe` 沙箱中的。
*   如果你需要在原型页面内展示一个全局的 Toast 提示或者二次确认弹窗，**禁止**在 `pages/*.html` 内部重新写一套弹窗 UI。
*   你必须通过调用父页面的全局 API 来实现：`window.parent.showToast('消息')` 或 `window.parent.showConfirm(title, message, onConfirm, okText, okType, targetElement, onCancel)`。
*   如果你需要在 `pages/*.html` 内部触发工作台左侧导航的跳转或点击事件，**必须跨越 iframe 作用域**，使用 `window.parent.document.querySelector(...)` 来寻找并操作外壳 DOM，严禁使用 `document.querySelector` 试图在当前沙箱内寻找父级元素。

## 4. 交付模式 (Delivery Mode) 的认知

工作台支持基于 URL 参数 `?mode=preview` 的只读交付模式，并且会根据协议自动判断：localhost 默认编辑态，file:// 默认交付态。开发人员双击 `index.html` 即可进入交付模式。
在该模式下，工作台会自动隐藏所有非业务的编辑按钮。你在设计页面原型时，不需要考虑“如何隐藏工作台的编辑按钮”，你只需专注于 `pages/` 内部原型的业务逻辑和样式即可。

## 5. 批处理指令执行规范 (Batch Processing)

产品经理现在会使用“任务批处理站”将多个修改指令打包发送给你。当你收到形如：
`请按顺序批量执行以下 X 个任务：`
`【任务 1】：...`
`【任务 2】：...`
的指令时：
*   **强制要求**：你必须严格按照任务编号的顺序，一次性执行完毕所有数据的修改。
*   如果遇到无法理解的任务，请跳过并在最终回复中说明，绝对不要因为单个任务的失败而中断其他任务的执行。

## 6. 自动化工具规范与要求
*   **强制要求**：你必须主动在终端执行 `npm run sync-nav` 以同步左侧导航树。
*   **推荐方案**：你可以在一开始就向产品经理建议：在终端运行 `npm run dev` 开启后台静默监听。开启后，你后续生成的所有页面都将被自动感知并同步，无需再手动执行同步命令。
*   **PM 启动入口提醒**：如果发现 PM 当前在 `file://` 协议下双击 `index.html` 打开工作台（缺少编辑控件、iframe 联动异常），你应该主动提醒 PM 运行 `npm start` 启动本地服务器，以获得完整的编辑态体验。

## 7. UI 修改指令的精准执行
当接收到类似于“请修改页面 xxx 中的源码”且带有“目标元素特征”的 Prompt 时，必须**严格根据特征定位**（利用标签名、class 列表以及辅助的文本片段），严禁误伤同名/同类元素。修改仅限指定的元素本身及其内部结构，严禁擅自修改非目标区域的布局。

## 8. 桥接脚本引入规范（page-bridge.js）

为了让 file:// 协议下的交付态也能实现"页面元素 ↔ 标注卡片"联动高亮，工作台提供了一个桥接脚本 `assets/scripts/page-bridge.js`。

*   **强制要求**：你生成的所有 `pages/*.html` 文件，**必须在 `</body>` 标签前引入桥接脚本**：
    ```html
    <script src="../assets/scripts/page-bridge.js"></script>
    ```
*   这段脚本是工作台外壳的一部分，用于通过 `postMessage` 绕开 file:// 同源策略限制。
*   **禁止修改、禁止内联、禁止省略**。如果你生成的页面缺少这段引用，研发在交付态下将无法看到标注联动，只能看到纯文本降级。
*   如果你新增了一个页面，必须同步引入此脚本。如果你修改了一个已有页面，必须确认此脚本引用仍然存在。

---

**最后且最重要的一点：**
当产品经理向你粘贴了一段由工作台生成的 Prompt（如“请修改左侧导航配置...” 或 “请在当前页面进行以下 PRD 配置更新...”）时，你必须像机器一样**绝对精确地执行**指令中要求的数据结构和属性修改。**收起你的发散思维，严禁擅自对项目主框架进行所谓的“代码重构”或“全局优化”。你的克制，就是对这个项目最大的贡献！**