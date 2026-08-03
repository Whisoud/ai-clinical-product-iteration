// main.js

// --- 全局配置（运行时状态）---
// 注意：AppConfig 是工作台运行时状态（如交付模式开关），
// 与 project-data.js 中的 ProjectConfig（项目元信息：标题/版本）职责不同，
// 勿混淆。AppConfig 由工作台内部逻辑维护，AI 无需修改。
window.AppConfig = {
  isDeliveryMode: false // 交付模式开关：true 为纯净展示，false 为允许编辑
};

// --- 防御性数据初始化 ---
window.navConfig = window.navConfig || [];
window.PrdStore = window.PrdStore || {};

// --- 辅助工具 ---
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- 全局 UI 工具：Toast 和 Confirm ---
window.UIUtils = {
  openModal: function(modal, overlay, targetRect = null, options = {}) {
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (overlay) overlay.classList.remove('hidden');

    if (targetRect) {
      const popoverWidth = options.width || modal.getBoundingClientRect().width || 320;
      const popoverHeight = options.height || modal.getBoundingClientRect().height || 360;
      const gap = options.gap || 12;

      let top = targetRect.top;
      let left = targetRect.right + gap;

      if (options.position === 'bottom') {
        top = targetRect.bottom + gap;
        left = targetRect.left;
      } else {
        if (left + popoverWidth > window.innerWidth) {
          left = targetRect.left - popoverWidth - gap;
        }
        if (left < 0) left = gap;

        if (top + popoverHeight > window.innerHeight) {
          top = window.innerHeight - popoverHeight - gap;
        }
        if (top < 0) top = gap;
      }

      modal.style.top = `${top}px`;
      modal.style.left = `${left}px`;
      modal.style.transform = 'none';
    } else {
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
    }

    requestAnimationFrame(() => {
      if (targetRect) {
        modal.style.transform = 'scale(1)';
      } else {
        modal.style.transform = 'translate(-50%, -50%) scale(1)';
      }
      modal.classList.remove('opacity-0', 'scale-95');
      modal.classList.add('opacity-100', 'scale-100');
    });
  },

  closeModal: function(modal, overlay, callback) {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.remove('opacity-100', 'scale-100');
    modal.classList.add('opacity-0', 'scale-95');
    
    const isCentered = modal.style.top === '50%';
    if (!isCentered) {
      modal.style.transform = 'none';
    } else {
      modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }

    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      if (overlay) overlay.classList.add('hidden');
      
      modal.style.top = '';
      modal.style.left = '';
      modal.style.transform = '';
      
      if (callback) callback();
    }, 200);
  }
};

window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  
  const bgColor = type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200';
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';
  
  toast.className = `flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border ${bgColor} transform transition-all duration-300 translate-y-[-100%] opacity-0`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i><span class="text-sm font-medium">${message}</span>`;
  
  container.appendChild(toast);
  lucide.createIcons({ root: toast });
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-100%]', 'opacity-0');
  });
  
  // Animate out
  setTimeout(() => {
    toast.classList.add('translate-y-[-100%]', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

window.showConfirm = function(title, message, onConfirm, okText = '确定', okType = 'danger', targetElement = null, onCancel = null) {
  const modal = document.getElementById('custom-confirm-modal');
  const overlay = document.getElementById('confirm-overlay');
  const titleEl = document.getElementById('confirm-title');
  const messageEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  if (!modal || !overlay) return;

  titleEl.innerHTML = title;
  messageEl.innerHTML = message;
  okBtn.textContent = okText;
  
  if (okType === 'danger') {
    okBtn.className = 'px-5 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm hover:shadow-md';
  } else {
    okBtn.className = 'px-5 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  overlay.classList.remove('hidden');

  // Popover 定位逻辑 or 居中逻辑
  if (targetElement) {
    // 作为 Popover 显示，使用透明遮罩
    overlay.classList.remove('bg-slate-900/40', 'backdrop-blur-sm');
    
    const rect = targetElement.getBoundingClientRect();
    window.UIUtils.openModal(modal, overlay, rect, { height: 140, gap: 12, width: 320 });
  } else {
    // 作为居中 Modal 显示
    overlay.classList.add('bg-slate-900/40', 'backdrop-blur-sm');
    window.UIUtils.openModal(modal, overlay);
  }

  const cleanup = () => {
      // 防止关闭动画期间的重复点击触发多次回调
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;

      window.UIUtils.closeModal(modal, overlay);
    };

  const handleOk = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    cleanup();
    if (onCancel) onCancel();
  };

  // 使用 onclick 代替 addEventListener，防止连续调用弹窗导致的事件累积内存泄漏和重复执行
  okBtn.onclick = handleOk;
  cancelBtn.onclick = handleCancel;
  overlay.onclick = handleCancel;
};
// --- /全局 UI 工具结束 ---

document.addEventListener('DOMContentLoaded', () => {
  // 0. 从 project-data.js 的 ProjectConfig 填充项目元信息
  if (window.ProjectConfig) {
    const titleEl = document.getElementById('project-title-display');
    const versionEl = document.getElementById('project-version-display');
    if (titleEl && window.ProjectConfig.title) titleEl.textContent = window.ProjectConfig.title;
    if (versionEl && window.ProjectConfig.version) versionEl.textContent = window.ProjectConfig.version;
  }

  // 0.5. 渲染全局说明（从 project-data.js 的 OverviewContent 读取并用 marked + DOMPurify 渲染）
  // 不依赖 iframe，file:// 和 localhost 行为一致
  function renderOverview() {
    const previewEl = document.getElementById('global-req-preview');
    if (!previewEl) return;
    const md = (window.OverviewContent || '').trim();
    if (!md) {
      previewEl.innerHTML = '<p style="color:#94A3B8;font-style:italic;">尚未配置全局说明内容。请在编辑视图点击"编辑内容"添加。</p>';
      return;
    }
    if (typeof marked !== 'undefined') {
      const html = marked.parse(md);
      const safeHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
      previewEl.innerHTML = safeHtml;
    } else {
      // 降级：marked 未加载时纯文本显示
      previewEl.textContent = md;
    }
  }
  renderOverview();

  // 1. 全局抽屉逻辑
  const reqBtn = document.getElementById('global-req-btn');
  const reqDrawer = document.getElementById('global-req-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('close-req-drawer');

  function openDrawer() {
    overlay.classList.remove('hidden');
    // trigger reflow
    void overlay.offsetWidth;
    overlay.classList.add('opacity-100');
    reqDrawer.classList.remove('translate-x-full');
    
    // 如果处于编辑视图，显示编辑按钮
    const editBtn = document.getElementById('edit-global-req-btn');
    if (document.querySelector('.view-switch-btn[data-view="edit"]').classList.contains('active')) {
      editBtn.classList.remove('hidden');
    } else {
      editBtn.classList.add('hidden');
    }
  }

  function closeDrawer() {
    overlay.classList.remove('opacity-100');
    reqDrawer.classList.add('translate-x-full');
    setTimeout(() => {
      // 只有在导航编辑弹窗也没打开时，才隐藏遮罩
      if (document.getElementById('nav-edit-modal').classList.contains('hidden')) {
        overlay.classList.add('hidden');
      }
      // 恢复预览模式
      cancelReqEdit();
    }, 300);
  }

  reqBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', () => {
    if (document.getElementById('nav-edit-modal').classList.contains('hidden')) {
      closeDrawer();
    }
  });

  // --- 全局需求抽屉的编辑逻辑 ---
  const editReqBtn = document.getElementById('edit-global-req-btn');
  const reqPreview = document.getElementById('global-req-preview');
  const reqEditorContainer = document.getElementById('global-req-editor-container');
  const reqTextarea = document.getElementById('global-req-textarea');
  const cancelReqBtn = document.getElementById('cancel-req-edit');
  const copyReqBtn = document.getElementById('btn-copy-req-prompt');

  function enterReqEdit() {
    reqPreview.classList.add('hidden');
    reqEditorContainer.classList.remove('hidden');
    editReqBtn.classList.add('hidden');

    // 从 project-data.js 的 OverviewContent 读取原始 Markdown
    // 不依赖 iframe，file:// 和 localhost 行为一致
    reqTextarea.value = (window.OverviewContent || '').trim();
  }

  function cancelReqEdit() {
    reqEditorContainer.classList.add('hidden');
    reqPreview.classList.remove('hidden');
    if (document.querySelector('.view-switch-btn[data-view="edit"]').classList.contains('active')) {
      editReqBtn.classList.remove('hidden');
    }
  }

  editReqBtn.addEventListener('click', enterReqEdit);
  cancelReqBtn.addEventListener('click', cancelReqEdit);

  copyReqBtn.addEventListener('click', () => {
    const content = reqTextarea.value.trim();
    if (!content) {
      window.showToast('内容不能为空', 'error');
      return;
    }

    // 本地预览：写入 window.OverviewContent 并重新渲染到预览区
    window.OverviewContent = content;
    const previewEl = document.getElementById('global-req-preview');
    if (previewEl && typeof marked !== 'undefined') {
      const html = marked.parse(content);
      const safeHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
      previewEl.innerHTML = safeHtml;
    }

    // 切换回预览视图
    cancelReqEdit();

    // prompt 让 AI 更新 project-data.js 中的 OverviewContent 变量
    // 注意：不要求 AI 改任何 HTML 文件，只改 project-data.js 的字符串变量
    const prompt = `请修改全局需求文档 (路径：./data/project-data.js)：
该文件中有一个 \`window.OverviewContent\` 变量（反引号字符串），专门存储原始 Markdown 内容。
请用以下 Markdown 内容**完整替换**该变量的字符串值（不要改动文件其他部分，保持反引号包裹，注意内部反引号需用 \\\` 转义）：

\`\`\`markdown
${content}
\`\`\``;

    navigator.clipboard.writeText(prompt).then(() => {
      window.showToast('保存预览成功！已复制提示词，请发送给 AI 修改源码。');
    });
  });
  // --- /全局需求抽屉编辑逻辑结束 ---

  // 2. 视图切换逻辑 (仅样式演示) - 已删除重复的声明
  
  // 模式判定引擎：根据协议 + 主机名 + URL 参数自动判断当前模式
  // 规则优先级（从高到低）：
  //   1. ?mode=preview → 强制交付态
  //   2. ?mode=edit → 强制编辑态
  //   3. http(s) + localhost/127.0.0.1 → 编辑态（PM 在场）
  //   4. 其他所有情况（file://、其他域名）→ 交付态
  const urlParams = new URLSearchParams(window.location.search);
  const explicitMode = urlParams.get('mode');
  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isHttpLocal = (protocol === 'http:' || protocol === 'https:') && isLocalhost;
  
  if (explicitMode === 'preview') {
    window.AppConfig.isDeliveryMode = true;
  } else if (explicitMode === 'edit') {
    window.AppConfig.isDeliveryMode = false;
  } else if (isHttpLocal) {
    window.AppConfig.isDeliveryMode = false;
  } else {
    window.AppConfig.isDeliveryMode = true;
  }

  // 交付模式下隐藏视图切换器和编辑按钮
  if (window.AppConfig.isDeliveryMode) {
    document.body.classList.add('is-delivery-mode');
    const viewSwitchContainer = document.querySelector('.view-switch-btn').parentElement;
    if (viewSwitchContainer) viewSwitchContainer.style.display = 'none';
    
    // 强制进入页面视图状态，确保编辑功能不可用
    const pageViewBtn = document.querySelector('.view-switch-btn[data-view="page"]');
    if (pageViewBtn) pageViewBtn.click();
  }

  // 3. 导航树渲染逻辑 (支持层级结构和搜索)
  const navTree = document.getElementById('nav-tree');
  const searchInput = document.querySelector('#search-container input');
  
  // 导航数据现在从全局 window.navConfig 读取 (来源于 project-data.js)

  // 递归渲染树节点
  function renderTreeNode(node, depth = 0, searchTerm = '') {
    const isFolder = node.type === 'folder';
    const paddingLeft = depth * 16 + 8; // 增加层级缩进
    
    let html = '';
    
    // 如果是搜索状态，需要判断当前节点或子节点是否匹配
    const matchSearch = searchTerm ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    let hasMatchingChildren = false;
    
    let childrenHtml = '';
    if (isFolder && node.children) {
      childrenHtml = node.children.map(child => {
        const childRes = renderTreeNode(child, depth + 1, searchTerm);
        if (childRes) hasMatchingChildren = true;
        return childRes;
      }).join('');
    }

    // 搜索过滤：如果不匹配且没有匹配的子节点，则不渲染
    if (searchTerm && !matchSearch && !hasMatchingChildren) {
      return '';
    }

    if (isFolder) {
      // 在搜索模式下，只要有匹配的内容，文件夹默认展开
      // 注：外层 hasMatchingChildren 已计算，345 行早期 return 已处理 folder 不匹配情况
      const isExpanded = searchTerm ? true : node.expanded;
      const displayStyle = isExpanded ? 'block' : 'none';
      const chevronClass = isExpanded ? 'rotate-90' : '';
      const safeName = escapeHTML(node.name);

      // 文件夹节点必须用一个独立的 wrapper 包裹，并且子节点列表也是一个独立的容器，以便 SortableJS 识别层级
      html += `
        <div class="nav-node-wrapper nav-folder" data-id="${node.id}" data-type="folder">
          <div class="nav-folder-header flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer group" 
               style="padding-left: ${paddingLeft}px" 
               data-id="${node.id}">
            <div class="flex items-center gap-2 overflow-hidden flex-1">
              <!-- 拖拽手柄 -->
              <i data-lucide="grip-vertical" class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 drag-handle is-edit-show"></i>
              <i data-lucide="folder" class="w-4 h-4 shrink-0 ${isExpanded ? 'text-blue-500 fill-blue-50' : 'text-slate-400'}"></i>
              <span class="text-sm font-medium truncate select-none" title="${safeName}">${safeName}</span>
            </div>
            <!-- 编辑图标 (仅在编辑视图下通过 CSS 显示) -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="nav-add-btn p-1 text-slate-400 hover:text-blue-600 rounded" data-id="${node.id}" title="添加子节点">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </button>
              <button class="nav-edit-btn p-1 text-slate-400 hover:text-blue-600 rounded" data-id="${node.id}" data-type="folder" data-name="${safeName}" title="编辑文件夹">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button class="nav-delete-btn p-1 text-slate-400 hover:text-red-600 rounded" data-id="${node.id}" data-type="folder" data-name="${safeName}" title="删除文件夹">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
              <i data-lucide="chevron-right" class="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 folder-chevron ${chevronClass} ml-1"></i>
            </div>
          </div>
          <div class="nav-children-container nav-folder-content min-h-[4px]" id="folder-${node.id}" style="display: ${displayStyle}" data-parent-id="${node.id}">
            ${childrenHtml}
          </div>
        </div>
      `;
    } else {
      // 页面节点
      const safeName = escapeHTML(node.name);

      html += `
        <div class="nav-node-wrapper" data-id="${node.id}" data-type="page">
          <div class="nav-item page-node flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer group" 
               style="padding-left: ${paddingLeft}px"
               data-url="${node.url}" data-id="${node.id}" data-title="${safeName}">
            <div class="flex items-center gap-2 overflow-hidden flex-1">
              <!-- 拖拽手柄 -->
              <i data-lucide="grip-vertical" class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 drag-handle is-edit-show"></i>
              <i data-lucide="file-text" class="w-4 h-4 shrink-0 text-slate-400"></i>
              <span class="text-sm truncate select-none" title="${safeName}">${safeName}</span>
            </div>
            <!-- 编辑图标 -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="nav-edit-btn p-1 text-slate-400 hover:text-blue-600 rounded" data-id="${node.id}" data-type="page" data-name="${safeName}" data-url="${node.url}" title="编辑页面">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button class="nav-delete-btn p-1 text-slate-400 hover:text-red-600 rounded" data-id="${node.id}" data-type="page" data-name="${safeName}" title="删除页面">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    return html;
  }

  let sortableInstances = [];

  // 初始化或销毁拖拽功能
  function initSortable(isEdit) {
    // 销毁已有的实例
    sortableInstances.forEach(instance => instance.destroy());
    sortableInstances = [];

    if (!isEdit || typeof Sortable === 'undefined') return;

    // 为根容器和所有的文件夹容器初始化 Sortable
    const containers = [navTree, ...navTree.querySelectorAll('.nav-children-container')];
    
    containers.forEach(container => {
      const instance = new Sortable(container, {
        group: 'nav-tree', // 允许在树的任意层级之间互相拖拽
        handle: '.drag-handle', // 只有拖拽手柄能触发
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        ghostClass: 'bg-slate-100', // 拖拽时的占位符样式
        onEnd: function (evt) {
          handleDragEnd(evt);
        }
      });
      sortableInstances.push(instance);
    });
  }

  // 处理拖拽结束事件，同步数据并生成 Prompt
  function handleDragEnd(evt) {
    const { item, to, from, oldIndex, newIndex } = evt;
    if (to === from && oldIndex === newIndex) return; // 没有发生实质位置改变

    const dragNodeId = item.dataset.id;
    const toParentId = to.dataset.parentId || 'root';
    const fromParentId = from.dataset.parentId || 'root';

    // 1. 从原数组中移除节点
    let dragNode = null;
    if (fromParentId === 'root') {
      dragNode = navConfig.splice(oldIndex, 1)[0];
    } else {
      const parentNode = findNavNode(navConfig, fromParentId);
      if (parentNode && parentNode.children) {
        dragNode = parentNode.children.splice(oldIndex, 1)[0];
      }
    }

    if (!dragNode) return; // 防御性判断

    // 2. 插入到新数组中
    if (toParentId === 'root') {
      navConfig.splice(newIndex, 0, dragNode);
    } else {
      const parentNode = findNavNode(navConfig, toParentId);
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.splice(newIndex, 0, dragNode);
        parentNode.expanded = true; // 拖入后自动展开目标文件夹
      }
    }

    // 3. 本地立刻重新渲染树
    renderNav();
    // 编辑视图下重建 Sortable 实例（renderNav 替换了 DOM，旧实例失效）
    initSortable(document.body.classList.contains('is-edit-view'));

    // 4. 生成精确的 Prompt 给 AI
    let toContext = '';
    if (toParentId === 'root') {
      toContext = '根数组 window.navConfig';
    } else {
      const pNode = findNavNode(navConfig, toParentId);
      toContext = `名为 "${pNode ? pNode.name : ''}" 的文件夹 (id: "${toParentId}") 的 children 数组`;
    }

    const prompt = `请修改左侧导航配置 (data/project-data.js 中的 window.navConfig)：
将 id 为 "${dragNodeId}" 的节点（${dragNode.name}），移动到 ${toContext} 中，使该节点在新数组的索引位置为 ${newIndex}。
注意：只需移动节点，不要修改其内部数据（id/name/url 等保持不变）。`;

    navigator.clipboard.writeText(prompt).then(() => {
      window.showToast('排序成功！已复制提示词，请发送给 AI 修改源码。', 'success');
    });
  }

  function renderNav(searchTerm = '') {
    const treeData = navConfig;

    // 检查是否完全没有数据
    const hasData = treeData.length > 0;
    
    const html = treeData.map(node => renderTreeNode(node, 0, searchTerm)).join('');
    
    if (!hasData) {
      navTree.innerHTML = `<div class="text-center text-slate-400 text-sm mt-10">
        <i data-lucide="folder-open" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        暂无页面，请使用 AI 新建
      </div>`;
      
      // 显示主区域空状态
      const iframe = document.getElementById('prototype-frame');
      const emptyState = document.getElementById('empty-state');
      if (iframe && emptyState) {
        iframe.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
          <i data-lucide="layout-template" class="w-16 h-16 mb-4 opacity-50"></i>
          <p class="text-sm font-medium">当前项目为空</p>
          <p class="text-xs mt-1">请在左侧新建页面或模块</p>
        `;
        lucide.createIcons({ root: emptyState });
      }
      
    } else if (html === '') {
      navTree.innerHTML = `<div class="text-center text-slate-400 text-sm mt-4">没有找到匹配的页面</div>`;
    } else {
      navTree.innerHTML = html;
    }
    
    lucide.createIcons();

    // 绑定文件夹折叠/展开事件
    document.querySelectorAll('.nav-folder-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const id = header.dataset.id;
        const content = document.getElementById(`folder-${id}`);
        const chevron = header.querySelector('.folder-chevron');
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          chevron.classList.add('rotate-90');
        } else {
          content.style.display = 'none';
          chevron.classList.remove('rotate-90');
        }
      });
    });

    // 绑定页面点击事件
    document.querySelectorAll('.page-node').forEach(item => {
      item.addEventListener('click', (e) => {
        // 取消其他节点高亮
        document.querySelectorAll('.page-node').forEach(el => {
          el.classList.remove('active-node');
          const icon = el.querySelector('i');
          if (icon) {
            icon.classList.remove('text-blue-600');
            icon.classList.add('text-slate-400');
          }
        });
        
        // 设置当前节点高亮
        const target = e.currentTarget;
        target.classList.add('active-node');
        const targetIcon = target.querySelector('i');
        if (targetIcon) {
          targetIcon.classList.remove('text-slate-400');
          targetIcon.classList.add('text-blue-600');
        }

        // 更新 iframe
        const iframe = document.getElementById('prototype-frame');
        const emptyState = document.getElementById('empty-state');
        
        if (iframe && emptyState) {
          const targetUrl = target.dataset.url;
          const currentFetchId = ++window.navFetchId; // 竞态控制
          
          // 如果是 file:// 协议，fetch 会因跨域直接抛错，导致哪怕文件存在也会显示 404
          if (window.location.protocol === 'file:') {
            iframe.src = targetUrl;
            iframe.classList.remove('hidden');
            iframe.style.opacity = '1';
            emptyState.classList.add('hidden');
          } else {
            fetch(targetUrl, { method: 'GET', cache: 'no-cache' })
              .then(res => {
                if (currentFetchId !== window.navFetchId) return; // 忽略过期请求
                if (res.ok) {
                  iframe.src = targetUrl;
                  iframe.classList.remove('hidden');
                  iframe.style.opacity = '1';
                  emptyState.classList.add('hidden');
                } else {
                  throw new Error('Not Found');
                }
              })
              .catch(() => {
                if (currentFetchId !== window.navFetchId) return; // 忽略过期请求
                iframe.classList.add('hidden');
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = `
                  <i data-lucide="bot" class="w-16 h-16 mb-4 opacity-40 text-blue-500"></i>
                  <p class="text-base font-medium text-slate-700">页面尚未生成</p>
                  <p class="text-sm mt-2 text-slate-500 max-w-[280px] text-center leading-relaxed">
                    物理文件 <code class="bg-slate-100 px-1 py-0.5 rounded text-xs">${targetUrl}</code> 不存在。<br>
                    请将刚才复制的 Prompt 发送给 AI 以生成页面代码。
                  </p>
                `;
                lucide.createIcons({ root: emptyState });
              });
          }
        }
        const titleEl = document.getElementById('current-page-title');
        if (titleEl) {
          titleEl.textContent = target.dataset.title;
        }
      });
    });
  }

  // 全局变量用于防竞态
  window.navFetchId = 0;

  // 初始化渲染
  renderNav();
  
  // 绑定左侧导航编辑/新增事件
  bindNavEditEvents();
  
  // 3. 拦截 navigator.clipboard.writeText，在复制单条的同时推入购物车
  // 防御：HTTP 非 localhost 或旧浏览器下 navigator.clipboard 不存在，需降级
  const _cb = navigator.clipboard;
  const originalClipboardWriteText = (_cb && typeof _cb.writeText === 'function')
    ? _cb.writeText.bind(_cb)
    : function(text) {
        // 降级：用 textarea + execCommand 兜底，避免整个 DOMContentLoaded 回调崩溃
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { console.warn('Clipboard fallback failed:', e); }
        document.body.removeChild(ta);
        return Promise.resolve();
      };
  navigator.clipboard.writeText = function(text) {
    // 调用原始复制
    const promise = originalClipboardWriteText(text);

    // 拦截如果是我们的 Prompt，则加入购物车
    // 精确判定是否为工作台生成的 Prompt（避免含"请"的外部文本被误收）
    const isPmfwPrompt = text && text.startsWith('请') && (
      text.includes('左侧导航配置') ||
      text.includes('PRD 配置更新') ||
      text.includes('PRD 配置删除操作') ||
      text.includes('修改页面') && text.includes('目标元素特征') ||
      text.includes('全局需求文档') ||
      text.includes('全局需求字典') ||
      text.includes('项目元信息')
    );
    if (isPmfwPrompt) {
      let summary = '';
      let targetId = null;
      let taskType = 'other';

      if (text.includes('修改左侧导航配置')) {
        taskType = 'nav';
        summary = '修改导航树节点';
        if (text.includes('添加')) summary = '添加导航节点';
        if (text.includes('删除')) summary = '删除导航节点';
        if (text.includes('移动')) summary = '拖拽排序导航';
        
        // 尝试提取导航节点 id
        const idMatch = text.match(/id 为 "([^"]+)"/);
        if (idMatch) targetId = `nav_${idMatch[1]}`;
      } else if (text.includes('全局需求字典') || text.includes('全局需求文档')) {
        taskType = 'global';
        summary = '修改全局说明文档';
        targetId = 'global_docs';
      } else if (text.includes('PRD 配置更新') || text.includes('PRD 配置删除操作')) {
        taskType = 'prd';
        summary = text.includes('删除') ? '删除 PRD 标注' : '更新页面元素 PRD 标注';
        
        // 尝试提取元素 data-prd-id
        const prdMatch = text.match(/data-prd-id="([^"]+)"/) || text.match(/键名为 "([^"]+)"/);
        if (prdMatch) targetId = `prd_${prdMatch[1]}`;
      } else if (text.includes('修改页面') && text.includes('目标元素特征') && text.includes('修改要求')) {
        taskType = 'ui';
        summary = '修改局部 UI/文案';
        
        // 提取页面路径 + 元素特征作为 targetId，避免同页面不同元素误判冲突
        const pathMatch = text.match(/请修改页面 `([^`]+)` 中的源码/);
        const featureMatch = text.match(/目标元素特征：([^\n]+)/);
        if (pathMatch) {
          const feature = featureMatch ? featureMatch[1].trim().substring(0, 40) : '';
          targetId = `ui_${pathMatch[1]}_${feature}`;
        }
      } else if (text.includes('项目元信息')) {
        // 项目标题/版本号编辑：固定 targetId，便于冲突检测
        taskType = 'meta';
        summary = '修改项目标题/版本号';
        targetId = 'project_meta';
      } else {
        summary = '其他修改操作';
      }

      // 添加到购物车
      addPromptToCart({
        id: 'task-' + Date.now(),
        summary: summary,
        prompt: text,
        taskType: taskType,
        targetId: targetId,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      });
    }

    return promise;
  };
  
  // --- 购物车核心逻辑 ---
  let cartTasks = [];
  
  function initPromptCart() {
    // 从 localStorage 恢复
    const saved = localStorage.getItem('prompt_cart_tasks');
    if (saved) {
      try {
        cartTasks = JSON.parse(saved);
      } catch (e) {
        cartTasks = [];
      }
    }
    
    // 绑定 UI 事件
    const fab = document.getElementById('prompt-cart-fab');
    const drawer = document.getElementById('prompt-cart-drawer');
    const closeBtn = document.getElementById('close-cart-btn');
    const overlay = document.getElementById('modal-overlay');
    const clearBtn = document.getElementById('clear-cart-btn');
    const copyAllBtn = document.getElementById('copy-all-cart-btn');
    
    if (!fab) return;

    function openCart() {
      overlay.classList.remove('hidden');
      // 延迟一点点加透明度动画
      setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
      }, 10);
      renderCartList();
    }

    function closeCart() {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      drawer.classList.add('translate-x-full');
      setTimeout(() => {
        // 只有在导航编辑弹窗也没打开时，才隐藏遮罩
        if (document.getElementById('nav-edit-modal') && document.getElementById('nav-edit-modal').classList.contains('hidden')) {
          overlay.classList.add('hidden');
        }
      }, 300);
    }

    fab.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', (e) => {
      // 如果点击遮罩，且购物车是打开的，则关闭购物车
      if (!drawer.classList.contains('translate-x-full')) {
        closeCart();
      }
    });

    clearBtn.addEventListener('click', () => {
      if (cartTasks.length === 0) return;
      window.showConfirm('清空暂存区', '确定要清空暂存区中的所有任务吗？此操作不可恢复。', () => {
        cartTasks = [];
        saveCart();
        renderCartList();
      });
    });

    copyAllBtn.addEventListener('click', () => {
      if (cartTasks.length === 0) return;
      
      let finalPrompt = `请按顺序批量执行以下 ${cartTasks.length} 个任务：\n\n`;
      cartTasks.forEach((task, index) => {
        finalPrompt += `【任务 ${index + 1}】：${task.summary}\n`;
        finalPrompt += `${task.prompt}\n`;
        finalPrompt += `---\n\n`;
      });
      finalPrompt += `请在所有任务修改完成后，统一告诉我结果。`;
      
      originalClipboardWriteText(finalPrompt).then(() => {
        window.showConfirm(
          '<i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-500"></i> <span class="text-slate-800">批量复制成功</span>',
          `已将 <span class="font-bold text-indigo-600 px-1 text-base">${cartTasks.length}</span> 个任务的指令复制到剪贴板。<br><br>是否清空暂存区？<span class="text-xs text-slate-400 block mt-1">（若需等 AI 执行无误后再清空，请点击保留）</span>`,
          () => {
            cartTasks = [];
            saveCart();
            renderCartList();
            window.showToast('已复制并清空暂存区', 'success');
            closeCart();
          },
          '清空暂存区',
          'primary',
          null,
          () => {
            window.showToast('已复制提示词（暂存区已保留）', 'success');
            closeCart();
          }
        );
        lucide.createIcons({ root: document.getElementById('custom-confirm-modal') });
      });
    });

    // 暴露到全局供局部单条删除调用
    window.removeCartTask = function(taskId) {
      cartTasks = cartTasks.filter(t => t.id !== taskId);
      saveCart();
      renderCartList();
    };

    // 初始化渲染一次角标
    updateCartBadge();
  }

  function addPromptToCart(task) {
    cartTasks.push(task);
    saveCart();
    updateCartBadge();
    
    // 给 FAB 加个简单的震动动画
    const fab = document.getElementById('prompt-cart-fab');
    if (fab) {
      fab.classList.add('scale-110', 'bg-indigo-500');
      setTimeout(() => {
        fab.classList.remove('scale-110', 'bg-indigo-500');
      }, 200);
    }
  }

  function saveCart() {
    try {
      localStorage.setItem('prompt_cart_tasks', JSON.stringify(cartTasks));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      window.showToast('本地存储空间不足或被禁用，无法保存任务', 'error');
    }
    updateCartBadge();
  }

  function updateCartBadge() {
    const badge = document.getElementById('prompt-cart-badge');
    const countEl = document.getElementById('cart-total-count');
    if (!badge) return;
    
    const count = cartTasks.length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    
    if (countEl) {
      countEl.textContent = count;
    }
  }

  function renderCartList() {
    const listContainer = document.getElementById('prompt-cart-list');
    const emptyState = document.getElementById('cart-empty-state');

    if (!listContainer) return;

    if (cartTasks.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) listContainer.appendChild(emptyState);
      return;
    }

    // 冲突检测：记录每个 targetId 对应的所有任务序号
    const targetMap = {};
    cartTasks.forEach((t, i) => {
      if (t.targetId) {
        if (!targetMap[t.targetId]) targetMap[t.targetId] = [];
        targetMap[t.targetId].push(i + 1); // 记录 1-based 序号
      }
    });

    let html = '';
    cartTasks.forEach((task, index) => {
      const currentNum = index + 1;
      const conflictGroup = task.targetId ? targetMap[task.targetId] : null;
      const isConflict = conflictGroup && conflictGroup.length > 1;
      
      let conflictHtml = '';
      if (isConflict) {
        // 找出同组中除了自己之外的其他任务序号
        const others = conflictGroup.filter(num => num !== currentNum).map(n => '#' + n);
        const targetName = task.targetId.replace(/^(nav_|prd_|ui_)/, '');
        conflictHtml = `
          <div class="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded flex items-start gap-1.5">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 shrink-0 mt-0.5"></i> 
            <span>与任务 <strong>${others.join(', ')}</strong> 重复修改了目标 <code class="bg-amber-100 px-1 py-0.5 rounded text-[10px] mx-0.5">${targetName}</code>，建议保留最新的一条。</span>
          </div>`;
      }

      // 获取任务类型对应的图标和颜色
      let icon = 'edit';
      let colorClass = 'bg-slate-100 text-slate-600';
      if (task.taskType === 'nav') { icon = 'list-tree'; colorClass = 'bg-blue-100 text-blue-700'; }
      else if (task.taskType === 'prd') { icon = 'mouse-pointer-click'; colorClass = 'bg-emerald-100 text-emerald-700'; }
      else if (task.taskType === 'ui') { icon = 'pen-tool'; colorClass = 'bg-emerald-100 text-emerald-700'; }
      else if (task.taskType === 'global') { icon = 'book-open'; colorClass = 'bg-purple-100 text-purple-700'; }

      // HTML 转义
      const safePrompt = task.prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      html += `
        <div class="bg-white border ${isConflict ? 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.5)]' : 'border-slate-200'} rounded-lg p-4 shadow-sm relative group transition-all">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="${colorClass} text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><i data-lucide="${icon}" class="w-3 h-3"></i> #${index + 1}</span>
              <h4 class="font-bold text-slate-700 text-sm">${task.summary}</h4>
            </div>
            <button onclick="window.removeCartTask('${task.id}')" class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="删除单条任务">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="mt-2 relative">
            <div class="bg-slate-50 text-slate-500 text-xs p-2 rounded border border-slate-100 font-mono break-all overflow-hidden transition-all duration-300" style="max-height: 40px;" id="prompt-preview-${task.id}">
              ${safePrompt}
            </div>
            <button onclick="const el = document.getElementById('prompt-preview-${task.id}'); const isExpanded = el.style.maxHeight !== '40px'; el.style.maxHeight = isExpanded ? '40px' : '500px'; this.innerHTML = isExpanded ? '展开完整指令 <i data-lucide=\\'chevron-down\\' class=\\'w-3 h-3 inline\\'></i>' : '收起指令 <i data-lucide=\\'chevron-up\\' class=\\'w-3 h-3 inline\\'></i>'; lucide.createIcons({ root: this });" class="text-[10px] font-medium text-indigo-500 hover:text-indigo-700 mt-1 flex items-center gap-0.5 transition-colors">
              展开完整指令 <i data-lucide="chevron-down" class="w-3 h-3 inline"></i>
            </button>
          </div>
          
          ${conflictHtml}
          
          <div class="text-[10px] text-slate-400 mt-2 text-right">${task.timestamp}</div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
    lucide.createIcons({ root: listContainer });
  }

  // --- /购物车逻辑结束 ---

  // 初始化购物车
  initPromptCart();

  // --- 辅助函数：操作 navConfig ---
  function findNavNode(nodes, id) {
    for (let node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNavNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function deleteNavNode(nodes, id) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children) {
        if (deleteNavNode(nodes[i].children, id)) return true;
      }
    }
    return false;
  }

  // --- 新增：左侧导航栏编辑功能 ---
  function bindNavEditEvents() {
    const navTree = document.getElementById('nav-tree');
    const modal = document.getElementById('nav-edit-modal');
    const overlay = document.getElementById('modal-overlay'); // 改用透明遮罩
    const closeBtns = [document.getElementById('close-nav-modal'), document.getElementById('cancel-nav-edit')];
    const copyBtn = document.getElementById('btn-copy-nav-prompt');
    
    const actionInput = document.getElementById('nav-modal-action');
    const idInput = document.getElementById('nav-modal-target-id');
    const typeInput = document.getElementById('nav-modal-target-type');
    const nameInput = document.getElementById('nav-modal-name');
    const urlInput = document.getElementById('nav-modal-url');
    const titleEl = document.getElementById('nav-modal-title');
    const urlContainer = document.getElementById('nav-modal-url-container');
    const typeContainer = document.getElementById('nav-modal-type-container');

    function openModal(targetElement) {
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();
      window.UIUtils.openModal(modal, overlay, rect, { width: 320, height: 360, gap: 16 });
    }

    function closeModal() {
      window.UIUtils.closeModal(modal, overlay);
    }

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    overlay.addEventListener('click', () => {
      if (!modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // 监听导航树内的编辑和添加按钮
    navTree.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.nav-edit-btn');
      const addBtn = e.target.closest('.nav-add-btn');
      const deleteBtn = e.target.closest('.nav-delete-btn');

      if (deleteBtn) {
        e.stopPropagation();
        const type = deleteBtn.dataset.type;
        const name = deleteBtn.dataset.name;
        const id = deleteBtn.dataset.id;
        
        window.showConfirm(
          '删除确认',
          `确定要删除${type === 'folder' ? '文件夹' : '页面'} "${name}" 吗？将立即在预览中生效，并复制提示词。`,
          () => {
            // 本地预览：修改数据源并重新渲染
            deleteNavNode(navConfig, id);
            renderNav();
            initSortable(document.body.classList.contains('is-edit-view'));
            
            const prompt = `请修改左侧导航配置 (data/project-data.js 中的 window.navConfig)：
删除 id 为 "${id}" 的${type === 'folder' ? '文件夹' : '页面'}。
${type === 'page' ? `同时，请删除 pages/ 目录下对应的物理 HTML 文件（参考该节点的 url 字段）。` : ''}`;
            navigator.clipboard.writeText(prompt).then(() => {
              window.showToast('已在预览中删除，并复制了删除提示词，请发送给 AI 以修改源码。');
            });
          },
          '删除并复制',
          'danger',
          deleteBtn
        );
        return;
      }

      if (editBtn) {
        if (editBtn.id === 'nav-global-add-btn') return; // 全局新增走另外的逻辑
        e.stopPropagation();
        const type = editBtn.dataset.type;
        const name = editBtn.dataset.name;
        const id = editBtn.dataset.id;
        const url = editBtn.dataset.url || '';

        actionInput.value = 'edit';
        idInput.value = id;
        typeInput.value = type;
        nameInput.value = name;
        
        titleEl.textContent = `编辑${type === 'folder' ? '文件夹' : '页面'}`;
        typeContainer.classList.add('hidden');

        if (type === 'page') {
          urlContainer.classList.remove('hidden');
          // 剥离前面的 ./pages/ 和后面的 .html 用于在 UI 中展示
          let cleanUrl = url || '';
          if (cleanUrl.startsWith('./pages/')) cleanUrl = cleanUrl.substring(8);
          if (cleanUrl.endsWith('.html')) cleanUrl = cleanUrl.slice(0, -5);
          urlInput.value = cleanUrl;
        } else {
          urlContainer.classList.add('hidden');
          urlInput.value = '';
        }

        openModal(editBtn);
      }

      if (addBtn) {
        if (addBtn.id === 'nav-global-add-btn') return; // 全局新增走另外的逻辑
        e.stopPropagation();
        const parentId = addBtn.dataset.id;
        
        actionInput.value = 'add';
        idInput.value = parentId; // 父节点ID
        nameInput.value = '';
        urlInput.value = '';
        
        titleEl.textContent = '添加子项';
        typeContainer.classList.remove('hidden');
        // 默认选中页面，显示 url 输入框
        document.querySelector('input[name="nav-add-type"][value="page"]').checked = true;
        urlContainer.classList.remove('hidden');

        openModal(addBtn);
      }
    });

    // 监听全局顶级新增按钮
    const globalAddBtn = document.getElementById('nav-global-add-btn');
    if (globalAddBtn) {
      globalAddBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        actionInput.value = 'add';
        idInput.value = 'root'; // 顶级节点标识
        nameInput.value = '';
        urlInput.value = '';
        
        titleEl.textContent = '添加顶级项';
        typeContainer.classList.remove('hidden');
        // 默认选中页面，显示 url 输入框
        document.querySelector('input[name="nav-add-type"][value="page"]').checked = true;
        urlContainer.classList.remove('hidden');

        openModal(globalAddBtn);
      });
    }

    // 监听新增类型的单选切换，动态显示/隐藏 url 输入框
    document.querySelectorAll('input[name="nav-add-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'page') {
          urlContainer.classList.remove('hidden');
        } else {
          urlContainer.classList.add('hidden');
        }
      });
    });

    // 复制 Prompt 并预览逻辑
    copyBtn.addEventListener('click', () => {
      const action = actionInput.value;
      const targetId = idInput.value;
      const newName = nameInput.value.trim();
      let newUrl = urlInput.value.trim();

      if (!newName) {
        window.showToast('请填写名称', 'error');
        return;
      }

      let prompt = '';
      const targetNode = findNavNode(navConfig, targetId);
      
      let type = '';
      if (action === 'edit') {
        type = typeInput.value;
      } else {
        const checkedType = document.querySelector('input[name="nav-add-type"]:checked');
        type = checkedType ? checkedType.value : 'page';
      }

      if (type === 'page') {
        if (!newUrl) {
          window.showToast('请填写文件名', 'error');
          return;
        }
        // 防止用户自己加了前缀或后缀，做一层清洗
        newUrl = newUrl.replace(/^\.\/pages\//, '').replace(/\.html$/, '');
        newUrl = `./pages/${newUrl}.html`;
      }

      if (action === 'edit') {
        // 修改本地数据
        targetNode.name = newName;
        if (targetNode.type === 'page') targetNode.url = newUrl;

        prompt = `请修改左侧导航配置 (data/project-data.js 中的 window.navConfig)：
找到 id 为 "${targetId}" 的节点 (当前名称: "${targetNode ? targetNode.name : ''}")。
将其名称修改为：${newName}`;
        if (type === 'page' && newUrl) {
          prompt += `\n将其 URL 路径修改为：${newUrl}`;
        }
      } else if (action === 'add') {
        const addType = type;
        // 如果是全新页面
        const newId = `new-${Date.now()}`;
        
        // 本地预览新增
          const newNode = {
            id: newId,
            name: newName,
            type: addType,
            ...(addType === 'page' ? { url: newUrl } : { expanded: true, children: [] })
          };

          let parentContext = '';

        if (targetId === 'root') {
          // 如果是顶级新增，直接 push 到根数组
          navConfig.push(newNode);
          parentContext = '根数组 window.navConfig 的末尾';
        } else if (targetNode) {
          // 如果是子节点新增
          if (!targetNode.children) targetNode.children = [];
          targetNode.children.push(newNode);
          targetNode.expanded = true; // 自动展开父节点
          parentContext = `名为 "${targetNode.name}" 的文件夹 (id: "${targetId}") 的 children 数组中`;
        }

        prompt = `请执行以下操作：
1. 修改左侧导航配置 (data/project-data.js 中的 window.navConfig)：
在 ${parentContext}，添加一个新${addType === 'folder' ? '文件夹' : '页面'}。
名称：${newName}`;
        if (addType === 'page') {
          prompt += `\n路径：${newUrl}\n类型：page\n工作台会自动渲染默认图标，配置中无需写 icon 属性。`;
          const rawFileName = newUrl.replace('./pages/', '');
          prompt += `\n\n2. 请在 pages/ 目录下创建物理文件：\`${rawFileName}\`，并为其编写基础的 HTML 骨架。`;
        } else {
          prompt += `\n类型：folder\n工作台会自动渲染默认图标，配置中无需写 icon 属性。建议设置 expanded: true 以默认展开。`;
        }
      }

      // 执行本地渲染
      renderNav();
      initSortable(document.body.classList.contains('is-edit-view'));

      navigator.clipboard.writeText(prompt).then(() => {
        window.showToast('保存预览成功！已复制提示词，请发送给 AI 修改源码。');
        closeModal();
      });
    });
  }

  // --- /新增结束 ---

  // 页面加载时自动触发第一个页面节点的点击事件，以加载 iframe 内容
  setTimeout(() => {
    const firstPageNode = document.querySelector('.page-node');
    if (firstPageNode) {
      firstPageNode.click();
    } else {
      // 如果没有节点，确保显示空状态
      const iframe = document.getElementById('prototype-frame');
      const emptyState = document.getElementById('empty-state');
      if (iframe && emptyState) {
        iframe.classList.add('hidden');
        emptyState.classList.remove('hidden');
      }
      
      // 渲染完成后，根据当前视图模式初始化拖拽
      initSortable(document.body.classList.contains('is-edit-view'));
    }
  }, 100);

  // 绑定搜索事件
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    renderNav(searchTerm);
  });

    // 绑定视图切换事件 (页面视图 / 编辑视图)
  const viewBtns = document.querySelectorAll('.view-switch-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 样式切换
      viewBtns.forEach(b => {
        b.classList.remove('active', 'bg-white', 'shadow-sm', 'text-slate-800');
        b.classList.add('text-slate-500');
      });
      const target = e.currentTarget;
      target.classList.remove('text-slate-500');
      target.classList.add('active', 'bg-white', 'shadow-sm', 'text-slate-800');

      // 控制相关编辑按钮的显示状态
      const isEditView = target.dataset.view === 'edit';
      const navTree = document.getElementById('nav-tree');
      if (isEditView) {
        navTree.classList.add('is-edit-view');
        document.body.classList.add('is-edit-view'); // 控制全局编辑按钮（如标题）
        initSortable(true);
      } else {
        navTree.classList.remove('is-edit-view');
        document.body.classList.remove('is-edit-view');
        initSortable(false);
      }

      // (视图切换逻辑通过 prd-renderer.js 监听处理，这里仅做样式切换)
    });
  });

  // 4. 左侧侧边栏折叠/展开逻辑
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const searchContainer = document.getElementById('search-container');
  let isSidebarCollapsed = false;

  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      isSidebarCollapsed = !isSidebarCollapsed;
      
      if (isSidebarCollapsed) {
        // 折叠状态
        sidebar.classList.remove('w-80');
        sidebar.classList.add('w-0');
        sidebar.classList.add('border-r-0'); // 隐藏边框避免残留一条线
        // 隐藏内部元素避免文字溢出
        navTree.style.opacity = '0';
        searchContainer.style.opacity = '0';
        // 按钮图标状态反馈
        toggleSidebarBtn.classList.add('bg-slate-100');
      } else {
        // 展开状态
        sidebar.classList.remove('w-0');
        sidebar.classList.add('w-80');
        sidebar.classList.remove('border-r-0');
        // 延迟显示内部元素，等待动画
        setTimeout(() => {
          navTree.style.opacity = '1';
          searchContainer.style.opacity = '1';
        }, 150);
        // 按钮图标状态恢复
        toggleSidebarBtn.classList.remove('bg-slate-100');
      }
    });
  }

  // 5. 右侧 PRD 面板折叠/展开逻辑
  const prdPanel = document.getElementById('prd-panel');
  const togglePrdBtn = document.getElementById('toggle-prd-btn');
  let isPrdPanelCollapsed = false;

  if (togglePrdBtn && prdPanel) {
    togglePrdBtn.addEventListener('click', () => {
      isPrdPanelCollapsed = !isPrdPanelCollapsed;
      
      if (isPrdPanelCollapsed) {
        // 折叠状态
        prdPanel.classList.remove('w-80');
        prdPanel.classList.add('w-0');
        prdPanel.classList.add('border-l-0'); // 隐藏边框避免残留一条线
        // 按钮图标状态反馈
        togglePrdBtn.classList.add('bg-slate-100');
      } else {
        // 展开状态
        prdPanel.classList.remove('w-0');
        prdPanel.classList.add('w-80');
        prdPanel.classList.remove('border-l-0');
        // 按钮图标状态恢复
        togglePrdBtn.classList.remove('bg-slate-100');
      }
    });
  }

  // --- 项目信息编辑功能 ---
  function bindProjectEditEvents() {
    const editBtn = document.getElementById('project-edit-btn');
    const modal = document.getElementById('project-edit-modal');
    const overlay = document.getElementById('modal-overlay'); // 改用透明遮罩
    
    const titleDisplay = document.getElementById('project-title-display');
    const versionDisplay = document.getElementById('project-version-display');
    const titleInput = document.getElementById('project-modal-title');
    const versionInput = document.getElementById('project-modal-version');

    const closeBtns = [
      document.getElementById('close-project-modal'), 
      document.getElementById('cancel-project-edit')
    ];
    const saveCopyBtn = document.getElementById('btn-copy-project-prompt');

    function openModal() {
      // 回显数据
      titleInput.value = titleDisplay.textContent.trim();
      versionInput.value = versionDisplay.textContent.trim();

      const rect = editBtn.getBoundingClientRect();
      window.UIUtils.openModal(modal, overlay, rect, { position: 'bottom', gap: 12, width: 288 });
    }

    function closeModal() {
      window.UIUtils.closeModal(modal, overlay);
    }

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    overlay.addEventListener('click', () => {
      if (!modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    saveCopyBtn.addEventListener('click', () => {
      const newTitle = titleInput.value.trim();
      const newVersion = versionInput.value.trim();

      if (!newTitle) {
        window.showToast('项目标题不能为空', 'error');
        return;
      }

      // 本地预览
      titleDisplay.textContent = newTitle;
      versionDisplay.textContent = newVersion;

      // 生成提示词
      const prompt = `请修改项目元信息 (data/project-data.js 中的 window.ProjectConfig)：
将 title 字段更新为：${newTitle}
将 version 字段更新为：${newVersion}`;

      navigator.clipboard.writeText(prompt).then(() => {
        window.showToast('保存预览成功！已复制提示词，请发送给 AI 修改源码。');
        closeModal();
      });
    });
  }

  bindProjectEditEvents();
});