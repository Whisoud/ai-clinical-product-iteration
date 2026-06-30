const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');

console.log(`\n==============================================`);
console.log(`👁️  [Watcher] 正在静默监听目录: ${pagesDir}`);
console.log(`✨  [Watcher] 您或 AI 在 pages/ 下的任何页面增删改，都将自动同步到左侧导航...`);
console.log(`==============================================\n`);

// 防抖函数，防止短时间内（如批量生成文件时）多次触发脚本执行
let timeout;
function triggerSync() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log(`[${new Date().toLocaleTimeString()}] ⚡️ 检测到页面变更，正在自动同步导航...`);
    
    // 执行原来的同步脚本
    exec('npm run sync-nav', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ [Watcher] 同步失败: ${error.message}`);
        return;
      }
      if (stderr && !stderr.toLowerCase().includes('warn')) {
        console.error(`⚠️ [Watcher] 警告: ${stderr}`);
      }
      console.log(`✅ [Watcher] 导航同步完成！请刷新浏览器查看最新导航树。`);
    });
  }, 800); // 800ms 防抖
}

// 监听文件新增、删除、内容变更（可能改了 <title>）以及文件夹的变更
const watcher = chokidar.watch(pagesDir, {
  ignored: /(^|[\/\\])\../, // 忽略隐藏文件，如 .DS_Store
  persistent: true,
  ignoreInitial: true // 忽略初始化时的批量添加事件
});

watcher
  .on('add', path => triggerSync())
  .on('unlink', path => triggerSync())
  .on('unlinkDir', path => triggerSync())
  .on('change', path => triggerSync());