import { ImageOff } from 'lucide-react';
import type { CodexEntry } from '../../types';
import { CODEX_TYPE_META } from '../../types';

/**
 * 档案头像/参考图:
 * - 已上传参考图 → 显示图片(圆形,带类型色描边)
 * - 无图 → 显示名称首字 + 类型色,保持视觉一致
 */
export default function CodexAvatar({
  entry,
  size = 40,
  className = '',
  rounded = 'full',
}: {
  entry: CodexEntry;
  /** 像素尺寸 */
  size?: number;
  className?: string;
  /** full=圆形头像(角色) / lg=圆角方形(地点物品) */
  rounded?: 'full' | 'lg';
}) {
  const meta = CODEX_TYPE_META[entry.type];
  const radius = rounded === 'full' ? '9999px' : '10px';
  const initial = entry.name.trim().slice(0, 1) || '?';

  if (entry.image) {
    return (
      <img
        src={entry.image}
        alt={entry.name}
        title={entry.name}
        className={`shrink-0 object-cover ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          border: `1.5px solid ${meta.color}66`,
        }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        color: meta.color,
        background: `${meta.color}1f`,
        border: `1.5px solid ${meta.color}55`,
        fontSize: Math.max(10, Math.round(size * 0.42)),
      }}
      title={entry.name}
    >
      {initial}
    </div>
  );
}

/** 空态占位:用于"未上传参考图"的提示场景 */
export function CodexAvatarPlaceholder({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center border border-dashed border-ink-600 text-slate-600"
      style={{ width: size, height: size, borderRadius: '9999px' }}
    >
      <ImageOff size={Math.round(size * 0.36)} />
    </div>
  );
}
