// page-bridge.js
// 桥接脚本：在业务页面（pages/*.html）中通过 <script src> 引入。
// 职责：扫描页面内的 data-prd-id 元素，通过 postMessage 向父页面（工作台外壳）上报位置；
//       监听父页面的 HIGHLIGHT 指令，给元素加高亮 class；
//       监听元素 mouseenter/leave，向父页面发 SHOW_CARD 消息。
// 这是工作台外壳的一部分，AI 严禁修改、禁止内联、禁止省略。
// 设计目的：file:// 协议下父页面无法访问 iframe.contentDocument（跨域拦截），
//           通过 postMessage 绕开同源策略限制，让 file:// 下也能实现标注联动。

(function() {
  'use strict';

  // 防止在顶层窗口（非 iframe）中执行
  if (window.top === window.self) return;

  // 注入高亮样式（页面内 CSS）
  const style = document.createElement('style');
  style.textContent = `
    .prd-hover-highlight {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px !important;
      transition: outline-color 0.2s ease;
      cursor: pointer;
    }
    .prd-hover-highlight.prd-hover-active {
      outline-color: #1d4ed8 !important;
      outline-width: 3px !important;
      background-color: rgba(59, 130, 246, 0.15) !important;
    }
  `;
  document.head ? document.head.appendChild(style) : document.documentElement.appendChild(style);

  // 已知的元素列表（用于 SHOW_CARD 事件）
  let knownElements = [];
  // 是否允许显示高亮（由父页面通过 SET_HIGHLIGHT_ENABLED 同步）
  let highlightEnabled = false;

  // 防抖：scroll/resize 时重新上报位置
  let reportTimer = null;
  function debounceReport() {
    if (reportTimer) clearTimeout(reportTimer);
    reportTimer = setTimeout(reportReady, 200);
  }

  // 扫描所有 data-prd-id 元素，上报位置
  function reportReady() {
    const prdElements = document.querySelectorAll('[data-prd-id]');
    const items = [];
    const newKnown = [];

    prdElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const id = el.getAttribute('data-prd-id');
      const text = (el.textContent || '').trim().substring(0, 40);

      items.push({
        id: id,
        rect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        text: text
      });
      newKnown.push({ el: el, id: id });

      // 绑定 mouseenter/leave（只绑一次）
      if (!el._prdBridgeBound) {
        el._prdBridgeBound = true;
        el.addEventListener('mouseenter', () => {
          // 仅在允许高亮时给元素加底色反馈
          if (highlightEnabled) {
            el.classList.add('prd-hover-highlight', 'prd-hover-active');
          }
          parent.postMessage({
            type: 'SHOW_CARD',
            id: id,
            action: 'show'
          }, '*');
        });
        el.addEventListener('mouseleave', () => {
          el.classList.remove('prd-hover-highlight', 'prd-hover-active');
          parent.postMessage({
            type: 'SHOW_CARD',
            id: id,
            action: 'hide'
          }, '*');
        });
      }
    });

    knownElements = newKnown;

    // 上报给父页面
    parent.postMessage({
      type: 'PRD_READY',
      pageUrl: location.pathname.split('/').slice(-2).join('/'),  // 例如 "pages/xxx.html"
      pageUrlFull: location.href,
      items: items
    }, '*');
  }

  // 监听父页面的 HIGHLIGHT 指令
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'HIGHLIGHT') {
      const el = document.querySelector(`[data-prd-id="${data.id}"]`);
      if (!el) return;

      if (data.action === 'show') {
        el.classList.add('prd-hover-highlight', 'prd-hover-active');
      } else if (data.action === 'hide') {
        el.classList.remove('prd-hover-highlight', 'prd-hover-active');
      }
    } else if (data.type === 'SET_HIGHLIGHT_ENABLED') {
      // 父页面同步标注显隐状态
      highlightEnabled = !!data.enabled;
      if (!highlightEnabled) {
        // 关闭时清除所有残留高亮
        document.querySelectorAll('.prd-hover-highlight, .prd-hover-active').forEach(el => {
          el.classList.remove('prd-hover-highlight', 'prd-hover-active');
        });
      }
    } else if (data.type === 'CLEAR_HIGHLIGHT') {
      // 父页面隐藏标注时，清除所有元素的 hover 高亮残留
      document.querySelectorAll('.prd-hover-highlight, .prd-hover-active').forEach(el => {
        el.classList.remove('prd-hover-highlight', 'prd-hover-active');
      });
    } else if (data.type === 'PRD_QUERY') {
      // 父页面主动查询（用于切换页面后立即请求）
      reportReady();
    }
  });

  // 页面加载完成后立即上报
  if (document.readyState === 'complete') {
    reportReady();
  } else {
    window.addEventListener('load', reportReady);
  }

  // 滚动/resize 时重新上报
  window.addEventListener('scroll', debounceReport, true);
  window.addEventListener('resize', debounceReport);
})();
