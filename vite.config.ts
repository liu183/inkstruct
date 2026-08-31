import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 部署到 GitHub Pages 时(仓库子路径 /inkstruct/)使用子路径 base,
  // 本地开发/预览保持根路径,互不影响。也可通过 VITE_BASE_PATH 显式覆盖。
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS === 'true' ? '/inkstruct/' : '/'),
  server: {
    port: 5173,
    host: true,
  },
});
