// serve.js
// PM 启动本地静态服务器，用于编辑态开发。
// 用法：npm start 或 node scripts/serve.js
// 端口默认 3000，被占用则自动尝试 3001-3010

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_PORT = 3000;
const MAX_PORT_ATTEMPTS = 10;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function handleRequest(req, res) {
  // 解析 URL，去掉查询参数
  let urlPath = req.url.split('?')[0];
  
  // 默认入口：访问 / 时返回 index.html
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }
  
  // 防止路径穿越攻击
  const decodedPath = decodeURIComponent(urlPath);
  const filePath = path.join(PROJECT_ROOT, decodedPath);
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  
  // 如果相对路径以 .. 开头，说明试图访问项目根目录之外的文件
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // 检查文件是否存在
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    // 读取并返回文件
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      res.writeHead(200, {
        'Content-Type': getMimeType(filePath),
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
}

function startServer(port) {
  const server = http.createServer(handleRequest);
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < DEFAULT_PORT + MAX_PORT_ATTEMPTS) {
      console.log(`[Serve] 端口 ${port} 被占用，尝试 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(`[Serve] 启动失败: ${err.message}`);
      console.error(`[Serve] 请手动指定端口：PORT=8080 npm start`);
      process.exit(1);
    }
  });
  
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n==============================================`);
    console.log(`🚀 [Serve] PM 工作台已启动`);
    console.log(`📍 [Serve] 访问地址：${url}`);
    console.log(`🛑 [Serve] 按 Ctrl+C 停止服务`);
    console.log(`==============================================\n`);
    
    // 自动打开浏览器
    const platform = process.platform;
    let openCmd = '';
    if (platform === 'darwin') {
      openCmd = `open "${url}"`;
    } else if (platform === 'win32') {
      openCmd = `start "" "${url}"`;
    } else if (platform === 'linux') {
      openCmd = `xdg-open "${url}"`;
    }
    
    if (openCmd) {
      exec(openCmd, (err) => {
        if (err) {
          console.log(`[Serve] 浏览器未自动打开，请手动访问：${url}`);
        }
      });
    } else {
      console.log(`[Serve] 请手动访问：${url}`);
    }
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    server.close();
    console.log('\n[Serve] 服务已停止');
    process.exit(0);
  });
}

// 支持环境变量 PORT 指定端口
const customPort = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
startServer(customPort);
