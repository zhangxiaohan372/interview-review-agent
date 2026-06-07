import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import aiRouter from './routes/ai.js';

const app = express();

// 生产环境：前端静态文件由同一服务托管，不需要 CORS
// 开发环境：前端 Vite dev server 独立运行，需要 CORS
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

app.use(express.json({ limit: '1mb' }));

// API 路由
app.use('/api/ai', aiRouter);

// 生产环境：托管前端静态文件
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback：所有非 API 请求返回 index.html
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('[Static] 前端静态文件托管: ' + distPath);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] 面试复盘 Agent 已启动: http://localhost:${PORT}`);
  if (!fs.existsSync(distPath)) {
    console.log('[Server] 开发模式 — 请另开终端运行 npm run dev 启动前端');
  }
});
