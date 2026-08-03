---
name: AI-PM Workbench
description: AI 时代产品经理的所见即所得原型工作台设计系统
version: alpha
colors:
  # 中性灰体系 - 工作台骨架
  primary: "#0F172A"        # slate-900  标题、核心正文
  secondary: "#475569"      # slate-600  次级文字、导航项
  tertiary: "#94A3B8"       # slate-400  辅助文字、占位符
  neutral: "#F8FAFC"        # slate-50   主背景
  surface: "#FFFFFF"        # 卡片、面板背景
  border: "#E2E8F0"         # slate-200  分隔线、边框
  border-subtle: "#F1F5F9"  # slate-100  次级分隔

  # 交互色 - 蓝色系（主操作）
  accent: "#2563EB"         # blue-600   主按钮、激活态
  accent-hover: "#1D4ED8"   # blue-700   悬浮态
  accent-light: "#EFF6FF"   # blue-50    激活背景、悬浮背景
  accent-ring: "#3B82F6"    # blue-500   标注高亮、focus ring

  # 强调色 - 靛蓝系（批处理站等独立子系统）
  highlight: "#4F46E5"      # indigo-600 任务批处理站主色
  highlight-hover: "#4338CA"# indigo-700
  highlight-light: "#EEF2FF"# indigo-50

  # 语义色
  success: "#059669"        # emerald-600 成功操作
  warning-bg: "#FFFBEB"     # amber-50    警告背景
  warning-border: "#FEF3C7" # amber-100
  warning-text: "#92400E"   # amber-800
  danger: "#EF4444"         # red-500     危险操作
  danger-hover: "#B91C1C"   # red-700
typography:
  h1:
    fontFamily: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.5
  h2:
    fontFamily: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.5
  body-md:
    fontFamily: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 0.75rem
    fontWeight: 500
    letterSpacing: 0.025em
rounded:
  sm: 4px    # 小元素（badge、tag）
  md: 6px    # 按钮、输入框
  lg: 8px    # 卡片、容器
  xl: 12px   # 弹窗、抽屉
  full: 9999px  # 圆形按钮、头像
spacing:
  xs: 4px    # p-1
  sm: 8px    # p-2
  md: 12px   # p-3
  lg: 16px   # p-4
  xl: 24px   # p-6
  2xl: 32px  # p-8
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    typography: "{typography.body-sm}"
  button-secondary-hover:
    backgroundColor: "{colors.neutral}"
  input-field:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    typography: "{typography.body-sm}"
  input-field-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  nav-item:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.body-sm}"
  nav-item-active:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-hover}"
    fontWeight: 500
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  modal:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  badge:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.body-sm}"
  annotation-highlight:
    outlineColor: "rgba(59, 130, 246, 0.4)"
    outlineStyle: dashed
    outlineWidth: 2px
    outlineOffset: "-2px  # 内嵌，防祖先 overflow 裁剪"
  annotation-highlight-active:
    outlineColor: "rgba(59, 130, 246, 0.9)"
    outlineStyle: solid
    outlineOffset: "-2px"
    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.12)"
  annotation-pulse:
    outlineColor: "rgba(59, 130, 246, 0.95)"
    outlineStyle: solid
    outlineOffset: "2px  # 外扩，瞬时寻路更醒目"
    ringShadow: "0 0 0 0 rgba(59, 130, 246, 0.45) → 0 0 0 12px rgba(59, 130, 246, 0)"
    duration: "0.7s × 3"
  annotation-badge:
    backgroundColor: "#3B82F6"
    textColor: "#FFFFFF"
    minWidth: "18px"
    height: "18px"
    fontSize: "11px"
    rounded: "{rounded.full}"
    placement: "锚点元素右上角内侧（4px 内缩，防 overflow 裁剪）"
    hover: "scale(1.15) + backgroundColor #2563EB（0.15s 过渡）"
---

## Overview

**Architectural Minimalism for Product Workflow.** 这是一个专为 AI 时代产品经理打造的原型工作台设计系统。视觉风格强调**专业、克制、信息密度高**，让 PM 在长时间使用中不疲劳，同时让交互元素一眼可辨。

核心设计理念：
- **中性灰为底**：slate 色系构建工作台骨架，避免视觉干扰
- **蓝色为交互主色**：所有可点击的主操作统一用 blue-600，建立肌肉记忆
- **靛蓝为子系统色**：批处理站等独立功能用 indigo 区分，避免与主交互混淆
- **语义色克制使用**：成功/警告/危险仅在必要时出现，不滥用

## Colors

调色板以高对比度中性灰 + 单一交互色 + 子系统强调色为核心。

### 中性灰体系（工作台骨架）
- **Primary (#0F172A, slate-900)**：标题与核心正文，提供最高可读性
- **Secondary (#475569, slate-600)**：次级文字、导航项，平衡可读性与视觉层级
- **Tertiary (#94A3B8, slate-400)**：辅助文字、占位符，弱化但不消失
- **Neutral (#F8FAFC, slate-50)**：主背景，比纯白柔和，长时间使用不刺眼
- **Surface (#FFFFFF)**：卡片、面板背景，与中性背景形成微妙层次
- **Border (#E2E8F0, slate-200)**：分隔线，提供结构感而不喧宾夺主

### 交互色（蓝色系 - 主操作）
- **Accent (#2563EB, blue-600)**：主按钮、激活态、focus ring
- **Accent-hover (#1D4ED8, blue-700)**：悬浮态，提供反馈
- **Accent-light (#EFF6FF, blue-50)**：激活背景、悬浮背景，柔和不刺眼
- **Accent-ring (#3B82F6, blue-500)**：标注高亮、 inspector 悬浮态

### 强调色（靛蓝系 - 独立子系统）
- **Highlight (#4F46E5, indigo-600)**：任务批处理站主色，与主交互色区分
- **Highlight-light (#EEF2FF, indigo-50)**：批处理站背景

### 语义色（克制使用）
- **Success (#059669, emerald-600)**：成功操作反馈
- **Warning**：amber 系（背景 #FFFBEB / 边框 #FEF3C7 / 文字 #92400E），用于提示信息
- **Danger (#EF4444, red-500)**：危险操作（删除、清空）

## Typography

字体系统基于 Tailwind 默认 `font-sans` 栈（系统字体优先），保证跨平台一致性与零字体加载成本。

- **h1 (1.125rem / 600)**：页面主标题、项目名称
- **h2 (0.875rem / 600)**：面板标题、区块标题
- **body-md (0.875rem / 400)**：正文、按钮文字、导航项
- **body-sm (0.75rem / 400)**：辅助文字、标签、提示
- **label-caps (0.75rem / 500)**：表单 label、metadata

字号整体偏小（0.75rem-1.125rem），因为这是**工作台而非营销页**，需要高信息密度。14px 是默认正文尺寸，符合工具类产品惯例（参考 Linear、Notion）。

## Layout

布局采用 **三栏式工作台结构**：

- **左栏 (320px)**：导航树（页面/模块目录）
- **中栏 (flex-1)**：原型预览区（iframe 沙箱）
- **右栏 (320px)**：PRD 标注面板

顶部 56px Header 包含项目标题、视图切换器、全局操作。所有面板可独立折叠。

间距遵循 **4px 基础网格**：
- 组件内部用 `sm` (8px) 或 `md` (12px)
- 组件之间用 `lg` (16px) 或 `xl` (24px)
- 区块之间用 `2xl` (32px)

## Elevation & Depth

阴影系统克制使用，主要通过**边框 + 微妙阴影**建立层次：

- **卡片**：`border + shadow-sm`（轻微阴影）
- **悬浮元素**：`shadow-md`（弹窗、下拉）
- **抽屉/模态**：`shadow-2xl`（顶层覆盖）
- **侧栏阴影**：单向 `shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]`（向内投射）

避免使用强阴影，保持工具类产品的"平"质感。

## Shapes

圆角系统分层明确：

- **sm (4px)**：小元素（badge、tag、annotation highlight）
- **md (6px)**：按钮、输入框、导航项
- **lg (8px)**：卡片、视图切换器容器
- **xl (12px)**：弹窗、抽屉头部
- **full**：圆形按钮（FAB）、头像、badge pill

## Components

### 按钮
- **Primary**：blue-600 背景 + 白字，用于主操作（保存、确认）
- **Secondary**：白底 + slate-600 字 + slate-200 边框，用于次要操作（取消）
- **Ghost**：透明背景 + slate-500 字，悬浮显 slate-100 背景，用于工具栏操作

### 输入框
默认 slate-100 背景（无强烈边框），focus 时切白底 + blue-500 边框 + blue-200 ring。这种"focus 才显形"的设计减少视觉噪音。

### 导航项
默认透明背景 + slate-600 字，激活态 blue-50 背景 + blue-700 字 + 500 字重。激活态用**背景色而非边框**标识，避免与边框冲突。

### 卡片
白底 + slate-200 边框 + lg 圆角 + lg 内边距。激活高亮时边框转 blue-400 + 蓝色阴影。

### 标注（声明式锚定，由 page-bridge.js 注入 iframe）
标注是锚点元素自身的 CSS 状态，不是覆盖层：编号徽章常驻（蓝色小圆点，锚点右上角内侧），高亮为蓝色 outline（hover 虚线 / 走查实线 / 点击定位时脉冲动画后消退）。透明度参数（0.4 / 0.65 / 0.9）经过调试，既可见又不遮挡底层 UI。

### 弹窗（Popover）
白底 + slate-200 边框 + xl 圆角 + 大阴影（`0_8px_30px_rgb(0,0,0,0.12)`）。头部带 slate-50/50 半透明背景区分内容区。

## Do's and Don'ts

> **适用范围**：本节规则**仅约束框架层**（`index.html`、`assets/styles/main.css` 等外壳）。业务页面（`pages/*.html`）的视觉规范由 `docs/page-design.md` 约束，与本节无关。

### ✅ Do
- **保持配色克制**：每屏最多出现一种语义色（除警告提示外）
- **优先用背景色而非边框表达状态**：激活态用 accent-light 背景，不用蓝色左边框
- **遵循 4px 间距网格**：所有 padding/margin 必须是 4 的倍数
- **使用系统字体栈**：不引入外部字体，保证零加载成本
- **用 showToast 替代 alert**：所有反馈走统一 toast 系统
- **iframe 内的页面通过 window.parent 调用外壳 API**：保持沙箱隔离

### 🚫 Don't
- **不要在业务页面 (pages/*.html) 中使用 indigo 色**：indigo 是工作台外壳的批处理站专用色
- **不要使用强阴影**：工具类产品应保持"平"质感
- **不要引入外部 CSS 框架**：项目已锁定 Tailwind CDN，不重复造轮子
- **不要修改框架级文件的样式**（index.html、main.css、main.js 等）：只允许在 pages/ 沙箱内创作
- **不要在 pages/*.html 内重写弹窗/toast UI**：必须调用 window.parent.showToast / showConfirm
- **不要用纯黑 (#000000)**：始终用 slate-900 (#0F172A) 作为最深色
- **不要在大面积使用纯白背景**：主背景用 slate-50，只有卡片/面板用纯白
