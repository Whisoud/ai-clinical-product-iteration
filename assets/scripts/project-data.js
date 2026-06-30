// project-data.js
// 这是整个项目的数据中心，包含项目元信息、左侧导航树和所有的 PRD 标注数据。
// AI 在生成页面或修改需求时，只需且必须修改此文件。

// 0. 项目元信息（标题/版本号）
// 注意：index.html 中的 #project-title-display / #project-version-display 元素
// 由 main.js 启动时从此处读取并填充，AI 修改项目信息只需改此处
window.ProjectConfig = {
  title: "PM First Prototype",
  version: "v1.0.0"
};

// 1. 左侧导航树配置
window.navConfig = [
  {
    "id": "page-onboarding",
    "name": "新手引导",
    "url": "./pages/onboarding.html",
    "type": "page"
  }
];

// 2. 全局 PRD 标注数据字典
// 结构: { "prd-id": { title: "标题", desc: "Markdown 描述", pageUrl: "./pages/xxx.html" } }
// pageUrl 必填，用于 file:// 协议下降级时按页面过滤展示
// 注意：禁止在 pages/*.html 内通过 <script> 注入 PrdStore 数据，所有数据必须集中在此处
window.PrdStore = {
  // 演示数据：新手引导页面的可点 Demo
  "prd-demo-chart": {
    title: "核心指标趋势图",
    desc: "**数据来源**：实时读取 BI 数据仓库\n**交互说明**：\n- 鼠标悬停数据点显示具体数值\n- 支持图表放大与下载\n- 默认展示近7天数据",
    pageUrl: "./pages/onboarding.html"
  },
  "prd-demo-btn": {
    title: "数据导出操作",
    desc: "点击后调用导出接口，支持 `.csv` 和 `.xlsx` 格式。如果数据量超过 10万条，走异步下载逻辑并通过右上角全局消息提示。",
    pageUrl: "./pages/onboarding.html"
  }
};