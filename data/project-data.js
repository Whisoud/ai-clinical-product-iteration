// project-data.js
// 这是整个项目的数据中心，包含项目元信息、左侧导航树和所有的 PRD 标注数据。
// AI 在生成页面或修改需求时，只需且必须修改此文件。

// 0. 项目元信息（标题/版本号）
window.ProjectConfig = {
  title: "深思智医 · 临床诊疗版本迭代",
  version: "v1.0.1"
};

// 1. 左侧导航树配置
window.navConfig = [
  {
    "id": "group-clinical-diagnosis",
    "name": "临床辅助诊疗",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "page-auxiliary-diagnosis",
        "name": "辅助诊疗页面V1.0.1",
        "url": "./pages/Auxiliary_diagnosis.html",
        "type": "page"
      },
      {
        "id": "page-medicalrecord-generation",
        "name": "病历生成页面 v1.0.1",
        "url": "./pages/medicalrecord_generation.html",
        "type": "page"
      }
    ]
  },
  {
    "id": "group-knowledge-qa",
    "name": "临床循证知识问答",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "page-knowledge-qa-v102",
        "name": "知识问答页面 V1.0.1",
        "url": "./pages/Knowledge_Q&A_V1.0.1.html",
        "type": "page"
      }
    ]
  }
];

// 2. 全局 PRD 标注数据字典
window.PrdStore = {};

window.PrdStore["prd-mr38nk1r-2srzy"] = {
  title: "参考文献",
  desc: "**数据来源**\n\n- 展示上文中所有提到的文献并去重展示\n- 注意书名号，不要.md 后缀\n- 显示全部，不要省略，显示不下就折行\n\n**交互**\n\n- 点击后右侧弹出文献正文",
  pageUrl: "./pages/Auxiliary_diagnosis.html"
};

window.PrdStore["prd-mr2wh6tj-b1rco"] = {
  title: "诊疗方案建议",
  desc: "**内容** 新增诊疗方案建议模块\n\n**关联** 与诊断选择联动并流式输出\n\n**数据与交互** \n\n文献标识：鼠标移入后在文字上方展示文献弹窗（动态大小），移出消失。\n\n- 内容包含文献标题（注意书名号、不要.md 后缀）、文献片段、核心内容加粗",
  pageUrl: "./pages/Auxiliary_diagnosis.html"
};

window.PrdStore["prd-mr38qv2r-o10su"] = {
  title: "疾病预测",
  desc: "**数据来源**\n\n- 根据病历内容由大模型返回结果（多个）\n\n**数据与界面交互**\n\n- 默认按疾病收起，点击「详情」后，展开疾病对应的诊断依据（显示全部，不要省略，显示不下就折行）\n\n- 选中疾病后变动检验检查、用药剂诊疗方案内容\n\n- 文献标识：鼠标移入后在文字上方展示文献弹窗（动态大小），移出消失\n内容包含文献标题（注意书名号、不要.md 后缀）、文献片段、核心内容加粗",
  pageUrl: "./pages/Auxiliary_diagnosis.html"
};

window.PrdStore["prd-mremp5zx-allhs"] = {
  title: "诊疗方案建议",
  desc: "**数据与界面交互**\n\n- 选中疾病后展示针对性诊疗方案\n- 支持流式输出与文献标注联动",
  pageUrl: "./pages/medicalrecord_generation.html"
};

window.PrdStore["prd-mrempb8z-bcchg"] = {
  title: "疾病预测",
  desc: "**数据与界面交互**\n\n- 默认按疾病收起，点击「详情」后，展开疾病对应的诊断依据\n- 选中疾病后联动下方检验检查与用药建议",
  pageUrl: "./pages/medicalrecord_generation.html"
};

// ===== 以下为知识问答页面标注（pages/Knowledge_Q&A_V1.0.1.html） =====

window.PrdStore["prd-mt2k9x4q-7w3pz"] = {
  title: "输出内容",
  desc: "**数据与界面交互**\n\n- 流式输出（循证问答与病历诊疗共用同一渲染管线）\n\n- 文献标识：鼠标移入后在文字上方展示文献弹窗（动态大小），移出消失\n内容包含文献标题（注意书名号、不要.md 后缀）、文献片段、核心内容加粗",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2k9z8r-2m5vn"] = {
  title: "参考文献",
  desc: "**数据来源**\n\n- 展示上文中所有提到的文献并去重展示\n- 注意书名号，不要.md 后缀\n- 显示全部，不要省略，显示不下就折行\n\n**交互**\n\n- 点击后右侧弹出文献正文",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2ka16s-9q4jd"] = {
  title: "新建对话按钮",
  desc: "**交互**\n\n- 点击后中断当前输出：若当前会话已有内容，自动归档至历史会话「今天」分组顶部（同名会话置顶刷新，不重复归档）\n- 主区回到欢迎视图，会话栏标题复位为「新对话」\n- 当前已是新对话时点击，Toast 轻提示「当前已是新对话」",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2ka34t-5x8kf"] = {
  title: "历史会话入口",
  desc: "**交互**\n\n- 点击后历史会话面板从窗口右侧外弹，与文献详情抽屉互斥（同开时文献抽屉关闭）\n- 再次点击按钮 / 点击遮罩 / 点击面板右上角 X 均可收起面板",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2ka52u-1n6qs"] = {
  title: "历史会话面板",
  desc: "**数据来源**\n\n- 会话按时间分组展示：今天 / 昨天 / 7 天内 / 更早\n- 会话标题默认取首条提问摘要，一行截断，悬停显示删除按钮\n\n**交互**\n\n- 点击会话项：面板收起，主区加载该会话内容（含循证标识角标与参考文献列表，与实时会话一致），列表中当前项紫色高亮\n- 角标悬停显示文献浮窗，点击文献条目右侧弹出文献正文抽屉\n- 删除会话：二次确认后移除；若删除的是正在查看的会话，主区回到欢迎视图\n- 顶部搜索框为预留能力，本期不实现",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2ka70v-8r2mb"] = {
  title: "病历辅助诊疗入口",
  desc: "**内容** 欢迎区「试试这些」轮播中病历分析列的示例病历卡片，一键体验；支持在输入框直接粘贴病历文本\n\n**交互**\n\n- 点击示例病历：以病历卡片形式发起会话，思考过程为「解析病历→提取主诉与病史→检索循证证据→生成诊疗建议」（带转圈与耗时）\n- 输出按「初步诊断考虑（按可能性排序）→ 诊断依据 → 建议检查 → 诊疗建议」结构流式呈现，全程带文献角标\n\n**关联** 与辅助诊疗页（Auxiliary_diagnosis）为同一 AMI 案例，形成「问知识→粘病历做诊疗→生成病历」演示闭环",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2ka88w-3k9tc"] = {
  title: "输入区（多行自适应）",
  desc: "**内容** 输入框为多行自适应（最高 120px），placeholder 提示「输入医学问题，或直接粘贴病历…」\n\n**交互**\n\n- 支持直接粘贴长病历文本，输入框随内容自动增高",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-msfu6flz-gjmdd"] = {
  title: "思考过程",
  desc: "**时间规则**\n\n总计时器为前端计时，每条的时间后端返回\n\n**文案对应**\n\n正在分析问题 - 分析完成\n\n正在检索引用知识库 - 检索引用完成\n\n正在整理回答 - 整理完成",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

window.PrdStore["prd-mt2kb11x-5w8re"] = {
  title: "「试试这些」场景示例轮播",
  desc: "**数据来源** \n\n- 每个场景一列（循证问答=示例问题列表，病历分析=示例病历卡），纵向高度恒定，新增场景不增加欢迎区高度；场景副标题内联于列标题\n\n**交互**\n\n- 左右悬浮箭头按列翻页，到头自动置灰；支持触控板横滑与鼠标拖拽（拖拽超 5px 不触发点击）\n- 点击示例即发起对应会话（思考过程 + 流式输出 + 文献角标）",
  pageUrl: "./pages/Knowledge_Q&A_V1.0.1.html"
};

// 3. 全局需求说明文档（Markdown 格式）
window.OverviewContent = `# 深思智医 · 临床诊疗产品迭代全局需求说明

## 1. 整体业务场景与产品定位
本项目为深思智医临床诊疗系统的原型迭代，包含以下核心模块：
- **辅助诊疗**：AI 临床决策辅助系统（支持疾病预测、诊断依据及文献追踪）。
- **病历生成**：门诊病历智能生成与辅助诊疗抽屉联动。
- **知识问答**：临床循证医学问答。

## 2. 核心交互与界面规范
- **右侧抽屉**：点击“重新辅助诊疗”或展开结果时，右侧抽屉平滑滑出。
- **文献追踪**：鼠标悬停在文献标号上浮现文献弹窗，点击可展开原文抽屉。
- **需求标注**：在工作台顶部开启“显示标注”后，各组件悬浮展示标注卡片。`;