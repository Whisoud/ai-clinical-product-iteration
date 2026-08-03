// prd-renderer.js (v2 · 声明式锚定 + 走查导览)
// 职责：右侧标注卡片面板、走查导航（上一条/下一条/全部高亮）、
//       标注增删改与 prompt 生成（编辑视图，仅同源）、DOM Inspector（仅同源）。
//
// 架构说明：
//   标注的定位与高亮完全由 iframe 内 page-bridge.js 以"元素态 CSS"实现，
//   本文件不做任何几何测量（无 getBoundingClientRect 坐标快照、无 MutationObserver /
//   transitionend / resize 位置补丁），localhost 与 file:// 走同一条渲染路径。
//   父页面与 iframe 只通过 postMessage 交换：标注清单、显隐/高亮指令、点击事件。

// 注意：window.PrdStore 的声明已移至 data/project-data.js

document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('prototype-frame');
  const annotationList = document.getElementById('annotation-list');
  const walkCounter = document.getElementById('walk-counter');
  const walkPrevBtn = document.getElementById('walk-prev');
  const walkNextBtn = document.getElementById('walk-next');
  const showAllBtn = document.getElementById('toggle-show-all-btn');
  const toggleBtn = document.getElementById('toggle-annotation-btn');

  // v2 默认开启标注：徽章常驻（量小不干扰），高亮框按需（走查脉冲/全部高亮）
  let showAnnotations = true;
  let showAll = false;
  let isEditView = false;
  let currentTargetElement = null; // 当前正在被检查/编辑的 DOM 元素（同源）
  let walkIds = [];                // 当前页面的标注 id 列表（文档顺序，与徽章编号一致）
  let walkIndex = -1;              // 走查当前位置（-1 = 未开始）
  let bridgeReady = false;         // 当前 iframe 的 page-bridge.js 是否已上报清单
  let fallbackTimer = null;

  // escapeHTML() 复用 main.js 中的全局定义（main.js 先于本文件加载，此处已可用）

  // 框架运行时注入的 class（bridge 徽章/高亮态、Inspector 悬浮）。
  // 生成 AI prompt 的"目标元素特征"时必须剔除——它们不在页面源码中，
  // 写进特征会误导 AI 定位（实测曾泄漏 prd-badge-pseudo）
  const FRAMEWORK_CLASSES = new Set(['prd-inspector-hover', 'prd-badge-pseudo', 'prd-hover', 'prd-active', 'prd-pulse']);
  function elementClassFeature(el) {
    return Array.from(el.classList).filter(c => !FRAMEWORK_CLASSES.has(c)).join(' ');
  }

  function renderMarkdown(text) {
    const safeText = (text || '').replace(/<([^>]+)>/g, '&lt;$1&gt;');
    if (typeof marked !== 'undefined') {
      const rawHtml = marked.parse(safeText);
      return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
    }
    return escapeHTML(safeText).replace(/\n/g, '<br/>').replace(/- (.*?)(<br\/>|$)/g, '• $1$2');
  }

  function postToFrame(msg) {
    try {
      if (iframe.contentWindow) iframe.contentWindow.postMessage(msg, '*');
    } catch (e) {}
  }

  // 同源可读 iframe DOM 时返回 document，否则（file:// 跨域）返回 null
  function getIframeDoc() {
    try {
      return iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document) || null;
    } catch (e) {
      return null;
    }
  }

  // ========== 卡片渲染 ==========
  function renderCards(ids) {
    walkIds = ids.slice();
    walkIndex = -1;

    if (!ids.length) {
      annotationList.innerHTML = `
        <div class="text-center text-slate-400 text-sm mt-10">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          当前页面暂无标注说明
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      updateWalkUI();
      return;
    }

    let listHTML = '';
    ids.forEach((id, index) => {
      const num = index + 1;
      const data = window.PrdStore[id];
      const safeId = escapeHTML(id);

      if (data) {
        const title = escapeHTML(data.title || '');
        const desc = data.desc || '暂无详细说明';
        listHTML += `
          <div class="prd-card bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group mb-3" data-prd-id="${safeId}">
            <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                ${num}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-semibold text-slate-800 truncate">${title}</h3>
                  <div class="flex items-center gap-2">
                    <button class="prd-edit-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity" data-prd-id="${safeId}" title="编辑此标注">
                      <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button class="prd-delete-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity" data-prd-id="${safeId}" title="删除此标注">
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
      } else {
        // 页面上有 data-prd-id 锚点，但 PrdStore 中没有配置 —— 显性暴露配置缺失
        listHTML += `
          <div class="prd-card bg-amber-50 border border-amber-200 rounded-lg p-3 relative overflow-hidden mb-3" data-prd-id="${safeId}">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold border border-amber-200">
                ${num}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-amber-800 truncate mb-1">未配置的标注</h3>
                <div class="text-xs text-amber-700 leading-relaxed">
                  页面存在 <code class="bg-amber-100 px-1 rounded">${safeId}</code> 锚点，但 data/project-data.js 的 PrdStore 中缺少对应配置。
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });

    annotationList.innerHTML = listHTML;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 绑定卡片交互
    annotationList.querySelectorAll('.prd-card').forEach((card, index) => {
      const prdId = card.dataset.prdId;

      card.addEventListener('mouseenter', () => {
        if (!showAnnotations) return;
        postToFrame({ type: 'PRD_HOVER', id: prdId });
      });
      card.addEventListener('mouseleave', () => {
        postToFrame({ type: 'PRD_HOVER', id: null });
      });
      card.addEventListener('click', () => {
        goWalk(index);
      });
    });

    // 编辑 / 删除（编辑视图且同源时可用）
    annotationList.querySelectorAll('.prd-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!isEditView) return;
        e.stopPropagation();
        const doc = getIframeDoc();
        if (!doc) {
          window.showToast('file:// 模式下编辑功能受限，请使用 npm start 启动本地服务器进行编辑', 'info');
          return;
        }
        const el = doc.querySelector('[data-prd-id="' + CSS.escape(btn.dataset.prdId) + '"]');
        if (!el) return;
        el.classList.remove('prd-inspector-hover');
        openPopover(el, btn.getBoundingClientRect());
      });
    });

    annotationList.querySelectorAll('.prd-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!isEditView) return;
        e.stopPropagation();
        const doc = getIframeDoc();
        if (!doc) {
          window.showToast('file:// 模式下编辑功能受限，请使用 npm start 启动本地服务器进行编辑', 'info');
          return;
        }
        const el = doc.querySelector('[data-prd-id="' + CSS.escape(btn.dataset.prdId) + '"]');
        if (!el) return;

        const executeDelete = () => {
          const tagName = el.tagName.toLowerCase();
          const classList = elementClassFeature(el);
          const elementId = el.getAttribute('data-prd-id');

          if (elementId && window.PrdStore[elementId]) {
            delete window.PrdStore[elementId];
          }
          el.removeAttribute('data-prd-id');
          el.removeAttribute('data-prd-title');
          el.removeAttribute('data-prd-desc');
          el.removeAttribute('data-prd-type');

          postToFrame({ type: 'PRD_RESCAN' });

          const currentPagePath = iframe ? iframe.getAttribute('src') : '当前页面';
          const prompt = `请在页面 \`${currentPagePath}\` 中进行以下 PRD 配置删除操作：
1. 在 HTML 中找到该元素并删除其 \`data-prd-id\` 属性（及任何遗留的 data-prd-* 属性）：
   目标元素特征：标签名为 ${tagName}，class 包含 "${classList}"
2. 在 data/project-data.js 中，从 window.PrdStore 中删除键名为 "${elementId || '未知ID'}" 的配置。`;

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
        } else if (confirm('确定要删除此标注吗？将立即在预览中生效，并复制提示词。')) {
          executeDelete();
        }
      });
    });

    updateWalkUI();
  }

  // ========== 走查导览 ==========
  function updateWalkUI() {
    if (walkCounter) walkCounter.textContent = (walkIndex + 1) + '/' + walkIds.length;
    const disabled = !walkIds.length;
    [walkPrevBtn, walkNextBtn].forEach(b => {
      if (!b) return;
      b.disabled = disabled;
      b.classList.toggle('opacity-40', disabled);
      b.classList.toggle('pointer-events-none', disabled);
    });
  }

  // 定位到第 i 条标注：iframe 内滚动 + 脉冲，面板内卡片置顶高亮
  function goWalk(i) {
    if (!walkIds.length) return;
    walkIndex = ((i % walkIds.length) + walkIds.length) % walkIds.length;
    const id = walkIds[walkIndex];

    if (!showAnnotations) setAnnotationsVisible(true);

    postToFrame({ type: 'PRD_SET_ACTIVE', id: id });
    postToFrame({ type: 'PRD_PULSE', id: id });

    annotationList.querySelectorAll('.prd-card').forEach(card => {
      const active = card.dataset.prdId === id;
      card.classList.toggle('walkthrough-active', active);
      if (active) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    updateWalkUI();
  }

  if (walkPrevBtn) walkPrevBtn.addEventListener('click', () => goWalk(walkIndex - 1));
  if (walkNextBtn) walkNextBtn.addEventListener('click', () => goWalk(walkIndex + 1));

  // ========== 标注显隐 / 全部高亮 ==========
  function setAnnotationsVisible(v) {
    showAnnotations = v;
    if (toggleBtn) {
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = v ? '隐藏标注' : '显示标注';
      toggleBtn.classList.toggle('text-blue-600', v);
      toggleBtn.classList.toggle('bg-blue-50', v);
      toggleBtn.classList.toggle('text-slate-500', !v);
      toggleBtn.classList.toggle('bg-slate-100', !v);
    }
    postToFrame({ type: 'PRD_SET_VISIBLE', enabled: v });
  }

  function setShowAll(v) {
    showAll = v;
    if (showAllBtn) {
      showAllBtn.classList.toggle('text-blue-600', v);
      showAllBtn.classList.toggle('bg-blue-50', v);
      showAllBtn.classList.toggle('text-slate-500', !v);
    }
    postToFrame({ type: 'PRD_SET_SHOW_ALL', enabled: v });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => setAnnotationsVisible(!showAnnotations));
  }
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => setShowAll(!showAll));
  }

  // ========== postMessage 接收（唯一渲染数据来源） ==========
  window.addEventListener('message', (event) => {
    if (!iframe || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'PRD_ANNOTATION_LIST') {
      bridgeReady = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      renderCards(data.ids || []);
      // 同步当前显隐状态给新加载的 iframe
      postToFrame({ type: 'PRD_SET_VISIBLE', enabled: showAnnotations });
      postToFrame({ type: 'PRD_SET_SHOW_ALL', enabled: showAll });
    } else if (data.type === 'PRD_ANCHOR_CLICK') {
      if (isEditView) {
        // 同源编辑由 Inspector 直接处理；file:// 下提示编辑受限
        if (!getIframeDoc()) {
          window.showToast('file:// 模式下编辑功能受限，请使用 npm start 启动本地服务器进行编辑', 'info');
        }
        return;
      }
      // 页面视图：点击徽章/锚点 = 走查到该条
      const i = walkIds.indexOf(data.id);
      if (i >= 0) goWalk(i);
    } else if (data.type === 'PRD_ANCHOR_HOVER') {
      // 元素 hover → 反向高亮对应卡片（编辑视图下同源由 Inspector 主导，联动仍保留）
      const cards = annotationList.querySelectorAll('.prd-card');
      cards.forEach(card => {
        if (card.dataset.prdId !== data.id) return;
        if (data.action === 'show') {
          card.classList.add('active-highlight');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          card.classList.remove('active-highlight');
        }
      });
    }
  });

  // ========== 视图切换 ==========
  document.querySelectorAll('.view-switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      isEditView = target.dataset.view === 'edit';

      if (isEditView) {
        annotationList.classList.add('is-edit-view');
      } else {
        annotationList.classList.remove('is-edit-view');
      }
      // 同步 iframe 内部变量（Inspector 用，仅同源有效）
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) iframeWindow.isEditView = isEditView;
      } catch (e) {}
    });
  });

  // ========== iframe 加载 ==========
  iframe.addEventListener('load', () => {
    bridgeReady = false;
    walkIds = [];
    walkIndex = -1;

    bindInspectorEvents();

    // 主动向桥接脚本索取标注清单（覆盖桥脚本先于 load 事件就绪的竞态）
    postToFrame({ type: 'PRD_QUERY' });

    // 2 秒未收到清单 → 判定页面未接入 page-bridge.js，走纯文本兜底并显性提示
    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (!bridgeReady) renderBridgeMissingFallback();
    }, 2000);
  });

  // ========== DOM Inspector（编辑视图点选元素，仅同源） ==========
  function bindInspectorEvents() {
    const iframeDoc = getIframeDoc();
    if (!iframeDoc || !iframeDoc.body) return;

    try {
      const iframeWindow = iframe.contentWindow;
      iframeWindow.isEditView = isEditView;

      iframeDoc.body.addEventListener('mouseover', (e) => {
        if (!iframeWindow.isEditView) return;
        e.stopPropagation();
        e.target.classList.add('prd-inspector-hover');
      });

      iframeDoc.body.addEventListener('mouseout', (e) => {
        if (!iframeWindow.isEditView) return;
        e.target.classList.remove('prd-inspector-hover');
      });

      iframeDoc.body.addEventListener('click', (e) => {
        if (!iframeWindow.isEditView) return;

        // 阻止默认点击事件（比如跳转链接）
        e.preventDefault();
        e.stopPropagation();

        const targetElement = e.target;
        targetElement.classList.remove('prd-inspector-hover');

        // 计算 iframe 内部元素相对于外部窗口的绝对坐标（用于弹窗定位）
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

  // ========== 弹窗控制逻辑 ==========
  function openPopover(targetElement, sourceRect) {
    currentTargetElement = targetElement;

    const elementId = targetElement.getAttribute('data-prd-id');
    let title = '';
    let desc = '';

    const typeSelectorContainer = document.getElementById('modal-type-selector-container');
    const radioPrd = document.querySelector('input[name="modal-action-type"][value="prd"]');

    if (elementId && window.PrdStore[elementId]) {
      title = window.PrdStore[elementId].title || '';
      desc = window.PrdStore[elementId].desc || '';
    }

    document.getElementById('modal-input-title').value = title;
    document.getElementById('modal-input-desc').value = desc;

    if (elementId) {
      // 编辑已有标注：隐藏类型选择器，固定为 prd 类型
      typeSelectorContainer.classList.add('hidden');
      radioPrd.checked = true;
      updateModalUIForType('prd');
    } else {
      // 新元素：显示选择器，默认 prd
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

  // ========== 保存并复制 ==========
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
    let currentPagePath = iframe ? iframe.getAttribute('src') : '当前页面';
    // 路径归一化：确保以 ./pages/ 开头，避免 AI 收到 'pages/xxx.html' 这种相对路径歧义
    if (currentPagePath && currentPagePath !== '当前页面' && !currentPagePath.startsWith('./') && !currentPagePath.startsWith('/')) {
      currentPagePath = './' + currentPagePath;
    }

    // 获取元素的 CSS 选择器特征 (用于 AI 定位；剔除框架注入的 class)
    const tagName = currentTargetElement.tagName.toLowerCase();
    const classList = elementClassFeature(currentTargetElement);
    const idAttr = currentTargetElement.id ? `#${currentTargetElement.id}` : '';
    const elementFeature = `${tagName}${idAttr}${classList ? ` class 包含 "${classList}"` : ''}`;

    if (actionType === 'ui') {
      // ===== UI 修改逻辑 =====
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
    let elementId = currentTargetElement.getAttribute('data-prd-id');
    if (!elementId) {
      elementId = 'prd-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
      currentTargetElement.setAttribute('data-prd-id', elementId);
    }

    // 1. 预览：将数据写入内存 Store（pageUrl 必填，用于桥缺失兜底时按页面过滤）
    window.PrdStore[elementId] = { title, desc, pageUrl: currentPagePath };

    // 清理可能存在的旧 data 属性
    currentTargetElement.removeAttribute('data-prd-title');
    currentTargetElement.removeAttribute('data-prd-desc');
    currentTargetElement.removeAttribute('data-prd-type');

    // 2. 让桥接脚本重扫（徽章即时出现），并确保标注可见
    postToFrame({ type: 'PRD_RESCAN' });
    setAnnotationsVisible(true);

    // 3. 生成提示词并复制
    const prompt = `请在页面 \`${currentPagePath}\` 中进行以下 PRD 配置更新：
1. 在 HTML 的对应元素上添加 ID 标识：
   目标元素特征：${elementFeature}
   需要添加的属性：data-prd-id="${elementId}"
2. 在 data/project-data.js 中更新全局 window.PrdStore 的配置：
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

  // ========== 桥缺失兜底（页面未引入 page-bridge.js） ==========
  function renderBridgeMissingFallback() {
    walkIds = [];
    walkIndex = -1;
    updateWalkUI();

    // 通过左侧导航获取当前激活的 URL（例如 ./pages/test1.html）
    const activeNode = document.querySelector('.page-node.active-node');
    const currentUrl = activeNode ? activeNode.dataset.url : null;

    // 按当前页面 URL 过滤 PrdStore；无 pageUrl 字段的旧数据归入"全局标注"
    const storeKeys = Object.keys(window.PrdStore);
    const filteredKeys = storeKeys.filter(key => {
      const data = window.PrdStore[key];
      if (!data) return false;
      if (!data.pageUrl) return true;
      return data.pageUrl === currentUrl;
    });

    let listHTML = `<div class="bg-amber-50 border border-amber-200 text-amber-700 p-2 text-xs rounded mb-4">
      <i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i>
      当前页面未接入桥接脚本 page-bridge.js，标注联动不可用（仅文本展示）。请在该页面 &lt;/body&gt; 前引入此脚本。
    </div>`;

    if (filteredKeys.length > 0) {
      filteredKeys.forEach((key, index) => {
        const data = window.PrdStore[key];
        const title = escapeHTML(data.title || '');
        const desc = data.desc || '暂无详细说明';

        listHTML += `
          <div class="prd-card bg-white border border-slate-200 rounded-lg p-3 relative overflow-hidden mb-3">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                ${index + 1}
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
    } else {
      listHTML += `
        <div class="text-center text-slate-400 text-sm mt-10">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          当前页面暂无标注说明
        </div>
      `;
    }

    annotationList.innerHTML = listHTML;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
});
