// prd-renderer.js
// 负责扫描 iframe 中的 data-prd 属性，并在右侧面板渲染交互说明

// 注意：window.PrdStore 的声明已移至 assets/scripts/project-data.js

document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('prototype-frame');
  const annotationList = document.getElementById('annotation-list');
  // 默认隐藏标注
  let showAnnotations = false;
  let isEditView = false;
  let currentTargetElement = null; // 当前正在被检查/编辑的 DOM 元素
  let currentPrdElements = []; // 当前 iframe 中被扫描到的带有标注的 DOM 元素数组

  // ========== postMessage 桥接（file:// 跨域降级方案） ==========
  // 当 file:// 协议下无法访问 iframe.contentDocument 时，通过 postMessage
  // 让 iframe 内的 page-bridge.js 上报元素位置，父页面据此画高亮框 + 卡片。
  let messageBridgeRegistered = false;
  let pendingFallbackTimer = null;
  let lastBridgeItems = null; // 最近一次收到的 items（供 scroll/resize 重画用）
  const bridgeHighlights = []; // 父页面画的高亮框（用于清理）
  let userToggled = false; // 用户是否手动操作过显示/隐藏标注按钮

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdown(text) {
    const safeText = (text || '').replace(/<([^>]+)>/g, '&lt;$1&gt;');
    if (typeof marked !== 'undefined') {
      const rawHtml = marked.parse(safeText);
      return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
    }
    return escapeHTML(safeText).replace(/\n/g, '<br/>').replace(/- (.*?)(<br\/>|$)/g, '• $1$2');
  }

  // 清理父页面画的所有桥接高亮框
  function clearBridgeHighlights() {
    bridgeHighlights.forEach(el => el.remove());
    bridgeHighlights.length = 0;
  }

  // 重画父页面高亮框（在父页面 DOM 上叠在 iframe 上方）
  function renderBridgeHighlights(items) {
    clearBridgeHighlights();
    const iframeRect = iframe.getBoundingClientRect();

    items.forEach((item, index) => {
      const num = index + 1;
      const data = window.PrdStore[item.id];
      if (!data) return;

      // 元素在视口外时不画
      if (item.rect.y + item.rect.height < 0 || item.rect.y > iframeRect.height) return;

      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: absolute;
        left: ${iframeRect.left + item.rect.x}px;
        top: ${iframeRect.top + item.rect.y}px;
        width: ${item.rect.width}px;
        height: ${item.rect.height}px;
        border: 2px dashed #3b82f6;
        border-radius: 4px;
        pointer-events: none;
        z-index: 1000;
        box-sizing: border-box;
        display: ${showAnnotations ? 'block' : 'none'};
      `;
      highlight.dataset.prdId = item.id;
      highlight.dataset.bridgeNum = num;

      const badge = document.createElement('div');
      badge.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        width: 20px;
        height: 20px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `;
      badge.innerText = num;
      highlight.appendChild(badge);

      document.body.appendChild(highlight);
      bridgeHighlights.push(highlight);
    });
  }

  // 从 PRD_READY 消息渲染高亮框 + 卡片
  function renderFromBridgeMessage(items) {
    if (pendingFallbackTimer) {
      clearTimeout(pendingFallbackTimer);
      pendingFallbackTimer = null;
    }

    // 默认隐藏标注（不论 file 还是 localhost）
    // 用户主动点"显示标注"按钮后才显示，切换页面时保持当前显隐状态

    lastBridgeItems = items; // 保存供 scroll/resize 重画使用
    renderBridgeHighlights(items);

    // iframe 上报 PRD_READY 说明 page-bridge.js 已就绪，立即同步标注显隐状态
    // 避免因时序问题（消息早于 listener 注册）导致 highlightEnabled 不同步
    if (iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'SET_HIGHLIGHT_ENABLED',
          enabled: !!showAnnotations
        }, '*');
      } catch (e) {}
    }

    // 过滤出 PrdStore 中有数据的 items
    const validItems = items.filter(item => window.PrdStore[item.id]);

    if (validItems.length === 0) {
      annotationList.innerHTML = `
        <div class="text-center text-slate-400 text-sm mt-10">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          当前页面暂无标注说明
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    let listHTML = '';

    validItems.forEach((item, index) => {
      const num = index + 1;
      const data = window.PrdStore[item.id];
      const title = escapeHTML(data.title || '');
      const desc = data.desc || '暂无详细说明';

      listHTML += `
        <div class="prd-card bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group mb-3" data-prd-id="${item.id}" data-id="${num}">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
              ${num}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-slate-800 truncate mb-1">${title}</h3>
              <div class="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none prd-desc-content">
                ${renderMarkdown(desc)}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    annotationList.innerHTML = listHTML;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 绑定卡片 mouseenter/leave → 向 iframe 发 HIGHLIGHT
    const cards = annotationList.querySelectorAll('.prd-card');
    cards.forEach(card => {
      const prdId = card.dataset.prdId;
      card.addEventListener('mouseenter', () => {
        if (!showAnnotations) return;
        card.classList.add('active-highlight');
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'HIGHLIGHT',
            id: prdId,
            action: 'show'
          }, '*');
        }
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('active-highlight');
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'HIGHLIGHT',
            id: prdId,
            action: 'hide'
          }, '*');
        }
      });
    });
  }

  // 注册全局 message 监听器（只注册一次）
  function setupMessageBridge() {
    if (messageBridgeRegistered) return;
    messageBridgeRegistered = true;

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      // 检查来源是否是当前 iframe
      if (iframe && event.source !== iframe.contentWindow) return;

      if (data.type === 'PRD_READY') {
        renderFromBridgeMessage(data.items || []);
      } else if (data.type === 'SHOW_CARD') {
        // 元素 mouseenter → 高亮对应卡片（仅显示标注时联动）
        if (!showAnnotations) return;
        const cards = annotationList.querySelectorAll('.prd-card');
        cards.forEach(card => {
          if (card.dataset.prdId === data.id) {
            if (data.action === 'show') {
              card.classList.add('active-highlight');
              card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              card.classList.remove('active-highlight');
            }
          }
        });
      }
    });

    // 父页面 scroll/resize 时重画高亮框（位置依赖父页面坐标系）
    let redrawTimer = null;
    function debounceRedraw() {
      if (redrawTimer) clearTimeout(redrawTimer);
      redrawTimer = setTimeout(() => {
        // 用最近一次的 items 重画——存到闭包变量
        if (lastBridgeItems) renderBridgeHighlights(lastBridgeItems);
      }, 100);
    }
    window.addEventListener('scroll', debounceRedraw, true);
    window.addEventListener('resize', debounceRedraw);
  }
  // ========== /postMessage 桥接结束 ==========

  // 监听视图切换事件 (从 main.js 派发或者直接监听按钮)
  const viewBtns = document.querySelectorAll('.view-switch-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      isEditView = target.dataset.view === 'edit';
      
      if (isEditView) {
        annotationList.classList.add('is-edit-view');
      } else {
        annotationList.classList.remove('is-edit-view');
      }
      // 同步 iframe 内部变量
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          iframeWindow.isEditView = isEditView;
        }
      } catch(e) {}
    });
  });

  // 监听显示/隐藏标注按钮
  const toggleBtn = document.getElementById('toggle-annotation-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      userToggled = true; // 用户手动操作后，不再自动开启标注
      showAnnotations = !showAnnotations;
      const span = toggleBtn.querySelector('span');
      if (showAnnotations) {
        span.textContent = '隐藏标注';
        toggleBtn.classList.remove('text-slate-500', 'bg-slate-100');
        toggleBtn.classList.add('text-blue-600', 'bg-blue-50');
      } else {
        span.textContent = '显示标注';
        toggleBtn.classList.remove('text-blue-600', 'bg-blue-50');
        toggleBtn.classList.add('text-slate-500', 'bg-slate-100');
      }
      toggleAnnotations(showAnnotations);
    });
  }

  // 监听 iframe 加载完成
  iframe.addEventListener('load', () => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      // 动态向 iframe 内部注入主样式表，确保 .prd-inspector-hover 等编辑态样式生效
      if (iframeDoc && !iframeDoc.getElementById('pm-framework-style')) {
        const link = iframeDoc.createElement('link');
        link.id = 'pm-framework-style';
        link.rel = 'stylesheet';
        link.href = '../assets/styles/main.css';
        iframeDoc.head.appendChild(link);
      }
      // 注入高亮框定位所需的 body reset
      // 确保 body 无默认 margin 且 position:relative，让 .prd-annotation-highlight
      // 的 absolute 定位锚点是 body，坐标计算 (rect + scroll) 才准确
      if (iframeDoc && !iframeDoc.getElementById('pm-highlight-anchor')) {
        const style = iframeDoc.createElement('style');
        style.id = 'pm-highlight-anchor';
        style.textContent = `body { margin: 0 !important; position: relative !important; }`;
        iframeDoc.head.appendChild(style);
      }
    } catch(e) {
      console.warn('无法向 iframe 注入样式:', e);
    }

    // 每次加载新页面，重新扫描
    scanAndRenderAnnotations();
    // 绑定 DOM Inspector 事件
    bindInspectorEvents();
    // 恢复标注的显示/隐藏状态
    toggleAnnotations(showAnnotations);
  });

  // ========== DOM Inspector 核心逻辑 ==========
  function bindInspectorEvents() {
    try {
      const iframeWindow = iframe.contentWindow;
      const iframeDoc = iframe.contentDocument || iframeWindow.document;
      
      // 初始化 iframe 内部的 isEditView 变量
      iframeWindow.isEditView = isEditView;

      // 鼠标移动时高亮任意元素
      iframeDoc.body.addEventListener('mouseover', (e) => {
        if (!iframeWindow.isEditView) return;
        
        // 排除掉已经生成的标注框和遮罩
        if (e.target.classList.contains('prd-annotation-highlight') || e.target.classList.contains('prd-annotation-badge')) {
          return;
        }

        e.stopPropagation();
        e.target.classList.add('prd-inspector-hover');
      });

      iframeDoc.body.addEventListener('mouseout', (e) => {
        if (!iframeWindow.isEditView) return;
        e.target.classList.remove('prd-inspector-hover');
      });

      // 点击任意元素打开编辑弹窗
      iframeDoc.body.addEventListener('click', (e) => {
        if (!iframeWindow.isEditView) return;

        // 阻止默认点击事件（比如跳转链接）
        e.preventDefault();
        e.stopPropagation();

        const targetElement = e.target;
        targetElement.classList.remove('prd-inspector-hover');

        // 计算 iframe 内部元素相对于外部窗口的绝对坐标
        const iframeRect = iframe.getBoundingClientRect();
        const tRect = targetElement.getBoundingClientRect();
        const sourceRect = {
          top: iframeRect.top + tRect.top,
          bottom: iframeRect.top + tRect.bottom,
          left: iframeRect.left + tRect.left,
          right: iframeRect.left + tRect.right
        };

        openPopover(targetElement, sourceRect);
      });

    } catch (e) {
      console.warn('Cannot bind inspector events to iframe.');
    }
  }

  // 弹窗控制逻辑
  function openPopover(targetElement, sourceRect) {
    currentTargetElement = targetElement;

    // 优先从全局 Store 中读取数据，如果不存在则退级尝试从 data 属性读取（兼容旧版数据）
    const elementId = targetElement.getAttribute('data-prd-id');
    let title = '';
    let desc = '';

    const typeSelectorContainer = document.getElementById('modal-type-selector-container');
    const titleContainer = document.getElementById('modal-title-container');
    const labelTitle = document.getElementById('modal-label-title');
    const labelDesc = document.getElementById('modal-label-desc');
    const radioPrd = document.querySelector('input[name="modal-action-type"][value="prd"]');

    if (elementId && window.PrdStore[elementId]) {
      title = window.PrdStore[elementId].title || '';
      desc = window.PrdStore[elementId].desc || '';
    } else {
      title = targetElement.getAttribute('data-prd-title') || '';
      desc = targetElement.getAttribute('data-prd-desc') || '';
    }

    document.getElementById('modal-input-title').value = title;
    document.getElementById('modal-input-desc').value = desc;

    // UI 状态重置与绑定
    if (elementId) {
      // 如果是编辑已有的标注，强制隐藏类型选择器，固定为 prd 类型
      typeSelectorContainer.classList.add('hidden');
      radioPrd.checked = true;
      updateModalUIForType('prd');
    } else {
      // 新点击的元素，显示选择器，默认选择 prd
      typeSelectorContainer.classList.remove('hidden');
      radioPrd.checked = true;
      updateModalUIForType('prd');
    }

    const popover = document.getElementById('annotation-modal');
    const overlay = document.getElementById('modal-overlay');

    window.UIUtils.openModal(popover, overlay, sourceRect, { width: 320, height: 360, gap: 16 });
  }

  // 监听单选框变化，动态改变表单文案
  document.querySelectorAll('input[name="modal-action-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateModalUIForType(e.target.value);
    });
  });

  function updateModalUIForType(type) {
    const titleContainer = document.getElementById('modal-title-container');
    const labelTitle = document.getElementById('modal-label-title');
    const labelDesc = document.getElementById('modal-label-desc');
    const inputTitle = document.getElementById('modal-input-title');
    const inputDesc = document.getElementById('modal-input-desc');

    if (type === 'ui') {
      titleContainer.classList.add('hidden'); // 修改 UI 时不需要标题
      labelDesc.textContent = '修改指令 (告诉 AI 怎么改)';
      inputDesc.placeholder = '例如：把这里的按钮文案改成"立即购买"，颜色改成红色...';
      inputDesc.rows = 7;
    } else {
      titleContainer.classList.remove('hidden');
      labelTitle.textContent = '标题 (必填)';
      labelDesc.textContent = '描述 (支持 Markdown)';
      inputTitle.placeholder = '如：核心指标看板';
      inputDesc.placeholder = '描述具体的逻辑...';
      inputDesc.rows = 5;
    }
  }

  const closeModal = () => {
    const popover = document.getElementById('annotation-modal');
    const overlay = document.getElementById('modal-overlay');
    window.UIUtils.closeModal(popover, overlay, () => {
      currentTargetElement = null;
    });
  };

  document.getElementById('close-annotation-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-annotation').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);

  // 合并的 保存并复制 逻辑
  document.getElementById('save-annotation').addEventListener('click', () => {
    if (!currentTargetElement) return;

    const actionType = document.querySelector('input[name="modal-action-type"]:checked').value;
    const title = document.getElementById('modal-input-title').value.trim();
    const desc = document.getElementById('modal-input-desc').value.trim();

    if (actionType === 'prd' && !title) {
      window.showToast('请填写标注标题', 'error');
      return;
    }

    if (actionType === 'ui' && !desc) {
      window.showToast('请填写修改指令', 'error');
      return;
    }

    // 获取当前 iframe 的页面路径
    const iframe = document.getElementById('prototype-frame');
    let currentPagePath = iframe ? iframe.getAttribute('src') : '当前页面';
    // 路径归一化：确保以 ./pages/ 开头，避免 AI 收到 'pages/xxx.html' 这种相对路径歧义
    if (currentPagePath && currentPagePath !== '当前页面' && !currentPagePath.startsWith('./') && !currentPagePath.startsWith('/')) {
      currentPagePath = './' + currentPagePath;
    }
    
    // 获取元素的 CSS 选择器特征 (用于 AI 定位)
    const tagName = currentTargetElement.tagName.toLowerCase();
    const classList = Array.from(currentTargetElement.classList)
      .filter(c => c !== 'prd-inspector-hover')
      .join(' ');
    const idAttr = currentTargetElement.id ? `#${currentTargetElement.id}` : '';
    const elementFeature = `${tagName}${idAttr}${classList ? ` class 包含 "${classList}"` : ''}`;

    if (actionType === 'ui') {
      // ===== UI 修改逻辑 =====
      // 获取元素的文本内容片段作为上下文辅助
      let textContext = currentTargetElement.textContent.trim().substring(0, 20);
      if (textContext) textContext = ` (当前文本内容大致为: "${textContext}...")`;

      const prompt = `请修改页面 \`${currentPagePath}\` 中的源码：
目标元素特征：${elementFeature}${textContext}
修改要求：${desc}`;

      navigator.clipboard.writeText(prompt).then(() => {
        window.showToast('UI 修改指令已复制，请发给 AI 执行。', 'success');
        closeModal();
      });
      return;
    }

    // ===== PRD 标注逻辑 =====
    // 生成或获取唯一 ID
    let elementId = currentTargetElement.getAttribute('data-prd-id');
    if (!elementId) {
      elementId = 'prd-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
      currentTargetElement.setAttribute('data-prd-id', elementId);
    }

    // 1. 预览：将数据写入内存 Store（pageUrl 必填，用于 file:// 降级时按页面过滤）
    window.PrdStore[elementId] = { title, desc, pageUrl: currentPagePath };
    
    // 清理可能存在的旧 data 属性
    currentTargetElement.removeAttribute('data-prd-title');
    currentTargetElement.removeAttribute('data-prd-desc');
    currentTargetElement.removeAttribute('data-prd-type');

    // 重新扫描并渲染
    scanAndRenderAnnotations();
    showAnnotations = true;
    const toggleBtn = document.getElementById('toggle-annotation-btn');
    if (toggleBtn) {
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = '隐藏标注';
      toggleBtn.classList.remove('text-slate-500', 'bg-slate-100');
      toggleBtn.classList.add('text-blue-600', 'bg-blue-50');
    }
    toggleAnnotations(showAnnotations);

    // 2. 生成提示词并复制
    const prompt = `请在页面 \`${currentPagePath}\` 中进行以下 PRD 配置更新：
1. 在 HTML 的对应元素上添加 ID 标识：
   目标元素特征：${elementFeature}
   需要添加的属性：data-prd-id="${elementId}"
2. 在 assets/scripts/project-data.js 中更新全局 window.PrdStore 的配置：
   window.PrdStore["${elementId}"] = {
     title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
     desc: "${desc.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
     pageUrl: "${currentPagePath}"
   };`;

    navigator.clipboard.writeText(prompt).then(() => {
      window.showToast('保存预览成功！已复制提示词，请发给 AI。', 'success');
      closeModal();
    });
  });

  // ========== 原有渲染逻辑 ==========
  function toggleAnnotations(show) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const highlights = iframeDoc.querySelectorAll('.prd-annotation-highlight');
      highlights.forEach(el => {
        el.style.display = show ? 'block' : 'none';
      });

      // 右侧面板保持原样，不再根据 showAnnotations 置灰或禁用点击
      if (annotationList) {
        annotationList.style.opacity = '1';
        annotationList.style.pointerEvents = 'auto';
      }
    } catch (e) {
      console.warn('Cannot access iframe to toggle annotations.');
    }

    // file:// 桥接模式：高亮框画在父页面上，需同步显隐
    bridgeHighlights.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });

    // file:// 桥接模式：向 iframe 同步标注显隐状态
    // page-bridge.js 据此决定是否给元素加 hover 高亮 class
    if (iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'SET_HIGHLIGHT_ENABLED',
          enabled: !!show
        }, '*');
      } catch (e) {}
    }
  }

  function scanAndRenderAnnotations() {
    try {
      // 在 file:// 协议下，Chrome 会因为同源策略（null origin）阻止访问 iframe.contentDocument
      // 注意：其实只有在跨域或者完全不同的 file:// 时才拦截。
      // 在一些浏览器或者配置下，同一目录的 file:// iframe 是可以访问的！
      // 所以我们尝试获取，获取不到才进入 catch。
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) throw new Error('Cannot access iframe document');
      
      // 清理旧的高亮
      const oldHighlights = iframeDoc.querySelectorAll('.prd-annotation-highlight');
      oldHighlights.forEach(el => el.remove());

      // 查找所有带 data-prd-id 或兼容旧版 data-prd-title 的元素
      const prdElements = iframeDoc.querySelectorAll('[data-prd-id], [data-prd-title]');
      
      if (prdElements.length === 0) {
        annotationList.innerHTML = `
          <div class="text-center text-slate-400 text-sm mt-10">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            当前页面暂无标注说明
          </div>
        `;
        lucide.createIcons();
        return;
      }

      // escapeHTML / renderMarkdown 复用本文件顶层定义，不再在此重复声明

      // 如果有可用的 prdElements (非 file:// 协议，或者 file:// 下没被拦截)，正常渲染
      if (prdElements && prdElements.length > 0) {
        currentPrdElements = Array.from(prdElements);
        let listHTML = '';

        prdElements.forEach((el, index) => {
          const id = index + 1;
          const elementId = el.getAttribute('data-prd-id');
          let rawTitle = '';
          let rawDesc = '';

          if (elementId && window.PrdStore[elementId]) {
            rawTitle = window.PrdStore[elementId].title || '';
            rawDesc = window.PrdStore[elementId].desc || '暂无详细说明';
          } else {
            rawTitle = el.getAttribute('data-prd-title') || '';
            rawDesc = el.getAttribute('data-prd-desc') || '暂无详细说明';
          }

          const title = escapeHTML(rawTitle);
          const desc = rawDesc;

          // 1. 在 iframe 内绘制高亮框
          if (iframeDoc && iframeDoc.documentElement) {
            const rect = el.getBoundingClientRect();
            // 用 offsetTop/offsetLeft 链累加获取文档坐标，绕开 transform (如 reveal 动画) 对 getBoundingClientRect 的影响
            let docTop = 0, docLeft = 0;
            let node = el;
            while (node) {
              docTop += node.offsetTop;
              docLeft += node.offsetLeft;
              node = node.offsetParent;
            }
            const highlight = iframeDoc.createElement('div');
            highlight.className = 'prd-annotation-highlight';
            highlight.style.position = 'absolute';
            highlight.style.top = docTop + 'px';
            highlight.style.left = docLeft + 'px';
            highlight.style.width = rect.width + 'px';
            highlight.style.height = rect.height + 'px';
            highlight.style.display = showAnnotations ? 'block' : 'none';
            highlight.dataset.id = id;

            const badge = iframeDoc.createElement('div');
            badge.className = 'prd-annotation-badge';
            badge.innerText = id;
            highlight.appendChild(badge);

            iframeDoc.body.appendChild(highlight);
          }

          // 2. 在右侧面板生成卡片
        listHTML += `
          <div class="prd-card bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group mb-3" data-id="${id}">
            <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                ${id}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-semibold text-slate-800 truncate">${title}</h3>
                  <div class="flex items-center gap-2">
                    <button class="prd-edit-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity" data-index="${index}" title="编辑此标注">
                      <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button class="prd-delete-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity" data-index="${index}" title="删除此标注">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
                <div class="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none prd-desc-content">
                  ${renderMarkdown(desc)}
                </div>
              </div>
            </div>
          </div>
        `;
        });

        annotationList.innerHTML = listHTML;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // 3. 绑定交互事件
        const cards = annotationList.querySelectorAll('.prd-card');
        const highlights = iframeDoc ? iframeDoc.querySelectorAll('.prd-annotation-highlight') : [];
        const editBtns = annotationList.querySelectorAll('.prd-edit-btn');
        const deleteBtns = annotationList.querySelectorAll('.prd-delete-btn');

        cards.forEach(card => {
          card.addEventListener('mouseenter', () => {
            // 隐藏标注时不触发联动高亮
            if (!showAnnotations) return;
            card.classList.add('active-highlight');
            const targetId = card.dataset.id;
            highlights.forEach(h => {
              if (h.dataset.id === targetId) h.classList.add('active');
            });
          });

          card.addEventListener('mouseleave', () => {
            card.classList.remove('active-highlight');
            highlights.forEach(h => h.classList.remove('active'));
          });
        });

        highlights.forEach(h => {
          h.addEventListener('mouseenter', () => {
            h.classList.add('active');
            const targetId = h.dataset.id;
            cards.forEach(card => {
              if (card.dataset.id === targetId) {
                card.classList.add('active-highlight');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            });
          });

          h.addEventListener('mouseleave', () => {
            h.classList.remove('active');
            cards.forEach(card => card.classList.remove('active-highlight'));
          });

        // 允许在编辑视图下，直接点击高亮框来编辑对应的标注
        h.addEventListener('click', (e) => {
          if (isEditView) {
            e.stopPropagation();
            e.preventDefault();
            const index = parseInt(h.dataset.id, 10) - 1;
            const targetElement = currentPrdElements[index];

            if (!targetElement) return;

            const iframeRect = iframe.getBoundingClientRect();
            const hRect = h.getBoundingClientRect();
            const sourceRect = {
              top: iframeRect.top + hRect.top,
              bottom: iframeRect.top + hRect.bottom,
              left: iframeRect.left + hRect.left,
              right: iframeRect.left + hRect.right
            };

            openPopover(targetElement, sourceRect);
          }
        });
        });

        editBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            if (!isEditView) return;
            e.stopPropagation();

            const index = parseInt(btn.dataset.index, 10);
            const targetElement = currentPrdElements[index];

            if (!targetElement) return;

            targetElement.classList.remove('prd-inspector-hover');
            const btnRect = btn.getBoundingClientRect();
            openPopover(targetElement, btnRect);
          });
        });

        deleteBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            if (!isEditView) return;
            e.stopPropagation();

            const executeDelete = () => {
              const index = parseInt(btn.dataset.index, 10);
              const el = currentPrdElements[index];

              if (!el) return;

              const tagName = el.tagName.toLowerCase();
              const classList = Array.from(el.classList).filter(c => c !== 'prd-inspector-hover').join(' ');
              const elementId = el.getAttribute('data-prd-id');

              if (elementId && window.PrdStore[elementId]) {
                delete window.PrdStore[elementId];
              }
              el.removeAttribute('data-prd-id');
              el.removeAttribute('data-prd-title');
              el.removeAttribute('data-prd-desc');
              el.removeAttribute('data-prd-type');

              scanAndRenderAnnotations();
              toggleAnnotations(showAnnotations);
              
              const iframe = document.getElementById('prototype-frame');
              const currentPagePath = iframe ? iframe.getAttribute('src') : '当前页面';

              const prompt = `请在页面 \`${currentPagePath}\` 中进行以下 PRD 配置删除操作：
1. 在 HTML 中找到该元素并删除其 \`data-prd-id\` 属性（及任何遗留的 data-prd-* 属性）：
   目标元素特征：标签名为 ${tagName}，class 包含 "${classList}"
2. 在 assets/scripts/project-data.js 中，从 window.PrdStore 中删除键名为 "${elementId || '未知ID'}" 的配置。`;

              navigator.clipboard.writeText(prompt).then(() => {
                window.showToast('已在预览中删除，并复制了删除提示词，请发送给 AI 修改源码。', 'success');
              });
            };

            if (window.showConfirm) {
              window.showConfirm(
                '删除标注', 
                '确定要删除此标注吗？将立即在预览中生效，并复制提示词。', 
                executeDelete,
                '删除并复制',
                'danger',
                btn
              );
            } else {
              if (confirm('确定要删除此标注吗？将立即在预览中生效，并复制提示词。')) {
                executeDelete();
              }
            }
          });
        });
      }

    } catch (e) {
      console.warn('Cannot scan iframe for PRD attributes.', e);

      // 优雅降级：file:// 跨域拦截时，优先走 postMessage 桥接（与 page-bridge.js 通信）
      // 超时 2 秒未收到 PRD_READY 才走纯文本降级（兼容未引入 page-bridge.js 的旧页面）
      if (iframe && iframe.contentWindow) {
        setupMessageBridge();
        // 清理上次未完成的超时
        if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer);
        // 主动询问 iframe 是否就绪
        try {
          iframe.contentWindow.postMessage({ type: 'PRD_QUERY' }, '*');
        } catch (queryErr) {
          console.warn('Cannot query iframe via postMessage', queryErr);
        }
        // 2 秒后兜底走纯文本降级
        pendingFallbackTimer = setTimeout(() => {
          renderFileFallbackText();
        }, 2000);
      } else {
        renderFileFallbackText();
      }
    }
  }

  // file:// 纯文本降级（postMessage 桥接超时或 iframe 不可用时使用）
  function renderFileFallbackText() {
    // 通过左侧导航获取当前激活的 URL（例如 ./pages/test1.html）
    const activeNode = document.querySelector('.page-node.active-node');
    const currentUrl = activeNode ? activeNode.dataset.url : null;

    // 提取全局 Store 中的所有 PRD 数据，按当前页面 URL 过滤
    // 容错：无 pageUrl 字段的旧数据归入"全局标注"，在所有页面下都展示
    const storeKeys = Object.keys(window.PrdStore);
    const filteredKeys = storeKeys.filter(key => {
      const data = window.PrdStore[key];
      if (!data) return false;
      if (!data.pageUrl) return true;
      return data.pageUrl === currentUrl;
    });

    if (filteredKeys.length > 0) {
      let id = 1;
      let listHTML = `<div class="bg-amber-50 border border-amber-200 text-amber-700 p-2 text-xs rounded mb-4">
        <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
        当前为离线模式，已展示当前页面标注。
      </div>`;

      filteredKeys.forEach(key => {
        const data = window.PrdStore[key];
        const title = data.title ? String(data.title).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const desc = data.desc || '暂无详细说明';

        const safeDesc = desc.replace(/<([^>]+)>/g, '&lt;$1&gt;');
        let parsedDesc = safeDesc.replace(/\n/g, '<br/>').replace(/- (.*?)(<br\/>|$)/g, '• $1$2');
        if (typeof marked !== 'undefined') {
          const rawHtml = marked.parse(safeDesc);
          parsedDesc = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
        }

        listHTML += `
          <div class="prd-card bg-white border border-slate-200 rounded-lg p-3 relative overflow-hidden mb-3">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                ${id}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-slate-800 truncate mb-1">${title}</h3>
                <div class="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none prd-desc-content">
                  ${parsedDesc}
                </div>
              </div>
            </div>
          </div>
        `;
        id++;
      });
      annotationList.innerHTML = listHTML;
    } else {
      annotationList.innerHTML = `
        <div class="text-center text-slate-400 text-sm mt-10">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          当前页面暂无标注说明
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
});