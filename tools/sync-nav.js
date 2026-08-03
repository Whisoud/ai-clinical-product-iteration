const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 修改为相对于项目根目录的正确路径
const pagesDir = path.join(__dirname, '..', 'pages');
const dataJsPath = path.join(__dirname, '..', 'data', 'project-data.js');

// 扫描 pages 目录
function scanPages(dir, relativePath = './pages') {
  let results = [];
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const children = scanPages(fullPath, `${relativePath}/${file}`);
        if (children.length > 0) {
          results.push({
            id: `folder-${file}`,
            name: file, // 默认使用文件夹名
            type: 'folder',
            expanded: true,
            children: children
          });
        }
      } else if (file.endsWith('.html')) {
        // 读取 HTML 标题
        const content = fs.readFileSync(fullPath, 'utf-8');
        const $ = cheerio.load(content);
        const title = $('title').text() || file.replace('.html', '');
        
        results.push({
          id: `page-${file.replace('.html', '')}`,
          name: title,
          url: `${relativePath}/${file}`,
          type: 'page'
        });
      }
    });
  } catch (error) {
    console.warn(`[SyncNav] Cannot read directory ${dir}: ${error.message}`);
  }
  return results;
}

// 提取当前 project-data.js 中的旧 navConfig 以尽量保留自定义名称和拖拽顺序
function extractOldNavConfig(dataJsContent) {
  const match = dataJsContent.match(/window\.navConfig\s*=\s*(\[[\s\S]*?\]);/);
  if (match && match[1]) {
    try {
      // 使用 Function 构造器解析旧配置（对象字面量非严格 JSON），避免 eval 的词法作用域访问风险
      // 注意：这里仅用于构建脚本内部，环境可控
      const configStr = match[1];
      const config = new Function('return ' + configStr)();
      return config;
    } catch (e) {
      console.warn('[SyncNav] Failed to parse old navConfig, using fresh scan.', e.message);
    }
  }
  return null;
}

function mergeConfigs(scanned, oldConfig) {
  if (!oldConfig || !Array.isArray(oldConfig) || oldConfig.length === 0) return scanned;
  
  // 建立被扫描到的（真实存在于物理磁盘的）节点的快速查找表
  const scannedUrlMap = {};
  const scannedIdMap = {};
  
  function buildScannedMaps(nodes) {
    nodes.forEach(node => {
      if (node.type === 'page' && node.url) scannedUrlMap[node.url] = node;
      if (node.type === 'folder' && node.id) scannedIdMap[node.id] = node;
      if (node.children) buildScannedMaps(node.children);
    });
  }
  buildScannedMaps(scanned);

  // 用来记录哪些 scanned 节点已经被合并过了
  const mergedUrls = new Set();
  const mergedIds = new Set();

  // 1. 遍历旧配置，保留其层级结构和顺序，但剔除已经在物理磁盘上被删除的页面
  function retainOldStructure(nodes) {
    return nodes.reduce((acc, oldNode) => {
      if (oldNode.type === 'page') {
        const matchedScanned = scannedUrlMap[oldNode.url];
        if (matchedScanned) {
          // 页面存在于物理磁盘：保留旧的 ID 和自定义 Name，标记为已合并
          acc.push({ ...matchedScanned, name: oldNode.name, id: oldNode.id });
          mergedUrls.add(oldNode.url);
        }
        // 如果物理磁盘上没有这个页面了（AI 删除了文件），则直接丢弃（不 push 到 acc）
      } else if (oldNode.type === 'folder') {
        const newFolder = { ...oldNode };
        if (oldNode.children) {
          newFolder.children = retainOldStructure(oldNode.children);
        }
        acc.push(newFolder);
        mergedIds.add(oldNode.id);
      }
      return acc;
    }, []);
  }

  const mergedConfig = retainOldStructure(oldConfig);

  // 2. 找出扫描到的、但是不在旧配置里的新节点（AI 新建的页面或文件夹）
  // 按照我们的增量策略，把它们追加到根数组的最末尾
  function appendNewNodes(nodes) {
    nodes.forEach(node => {
      if (node.type === 'page' && !mergedUrls.has(node.url)) {
        mergedConfig.push(node);
      } else if (node.type === 'folder' && !mergedIds.has(node.id)) {
        // 如果是全新的文件夹，需要递归过滤它里面可能已经被合并过的子节点（极少见情况）
        mergedConfig.push(node);
      } else if (node.type === 'folder' && node.children) {
        // 如果文件夹本身存在，但里面可能有新页面，这在前面的逻辑里没处理，我们需要补漏
        // 但为了简单和确定性，如果 AI 生成了新页面，统一扔到最外层让 PM 自己去拖拽
        appendNewNodes(node.children);
      }
    });
  }

  appendNewNodes(scanned);

  return mergedConfig;
}

function run() {
  console.log('[SyncNav] Scanning pages directory...');
  const scannedConfig = scanPages(pagesDir);
  
  if (scannedConfig.length === 0) {
    console.log('[SyncNav] No HTML files found in pages directory. Aborting.');
    return;
  }

  const dataJsContent = fs.readFileSync(dataJsPath, 'utf-8');
  const oldConfig = extractOldNavConfig(dataJsContent);
  
  const finalConfig = mergeConfigs(scannedConfig, oldConfig);
  
  // 替换 project-data.js 中的配置
  // 注意：需要使用格式化输出 JSON
  const configString = JSON.stringify(finalConfig, null, 2);
  const regex = /window\.navConfig\s*=\s*\[[\s\S]*?\];/;
  
  const newContent = dataJsContent.replace(regex, `window.navConfig = ${configString};`);
  
  if (newContent !== dataJsContent) {
    fs.writeFileSync(dataJsPath, newContent, 'utf-8');
    console.log('[SyncNav] Successfully updated window.navConfig in project-data.js!');
  } else {
    console.log('[SyncNav] No changes detected in window.navConfig or regex failed.');
  }
}

run();