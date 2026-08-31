/**
 * 参考图处理工具:
 * 本地图片 → 等比压缩 → dataURL(可直接存入 store 并作为 <img src> 使用)
 * 纯前端实现,无需后端上传;压缩是为了避免大图撑爆内存。
 */

/** 将图片文件压缩为 dataURL(默认长边 512px,JPEG 质量 0.82) */
export function fileToDataURL(file: File, maxSize = 512, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error('图片解析失败'));
      img.onload = () => {
        // SVG / 小图直接使用原图,避免绘制失真
        if (file.type === 'image/svg+xml' || Math.max(img.width, img.height) <= maxSize) {
          resolve(src);
          return;
        }
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
