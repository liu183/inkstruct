import { ChevronDown, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import {
  INSPIRATION_DIRECTIONS, INSPIRATION_GENRES,
  type InspirationDirection, type InspirationGenre,
} from '../../types';
import type { InspirationConfig } from '../../types';
import { GENRE_AXES, type AxisSelections } from '../../data/genreProfiles';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** 灵感助手配置抽屉 */
export default function InspirationConfigPanel({ open, onClose }: Props) {
  const config = useProjectStore((s) => s.project.inspirationConfig);
  const update = useProjectStore((s) => s.updateInspirationConfig);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-96 flex-col border-l border-ink-700/70 bg-ink-900 shadow-2xl animate-slide-in-right">
        {/* 头部 */}
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          <SlidersHorizontal size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-slate-100">灵感助手配置</span>
          <button onClick={onClose} className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* 抽卡数量 */}
          <Setting label="每次抽卡数量" hint="一次抽取的灵感卡片数">
            <Segmented
              value={String(config.count)}
              options={[
                { value: '3', label: '3 张' },
                { value: '5', label: '5 张' },
                { value: '8', label: '8 张' },
              ]}
              onChange={(v) => update({ count: Number(v) as 3 | 5 | 8 })}
            />
          </Setting>

          {/* 题材档案 —— 每个题材专属的细粒度创作维度 */}
          <Setting
            label="题材档案"
            hint="选 1 个题材 → 展开它独有的创作参数(体系 / 出身 / 金手指 / 基调…);不选 = 不限"
          >
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_GENRES.map((g) => {
                const active = config.genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => {
                      const next = active
                        ? config.genres.filter((x) => x !== g)
                        : [...config.genres, g as InspirationGenre];
                      // 取消题材时同步清理其轴选项
                      const nextAxes = active
                        ? Object.fromEntries(
                                Object.entries(config.axisSelections).filter(([k]) => k !== g)
                              )
                        : config.axisSelections;
                      update({ genres: next, axisSelections: nextAxes as AxisSelections });
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] transition-all ${
                      active
                        ? 'bg-accent-500/15 font-medium text-accent-300 ring-1 ring-accent-500/40'
                        : 'bg-ink-800 text-slate-500 ring-1 ring-ink-700/60 hover:text-slate-300'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            {/* 选中题材的专属维度展开 */}
            {config.genres.map((g) => (
              <GenreAxisEditor key={g} genre={g} />
            ))}
            {config.genres.length === 0 && (
              <div className="text-[10px] text-slate-600">↑ 先选题材,这里将展开该题材的专业创作维度</div>
            )}
          </Setting>

          {/* 灵感风格方向 */}
          <Setting label="灵感风格方向" hint="不选 = 全风格混抽,选取后仅从这些风格生成">
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_DIRECTIONS.map((d) => {
                const active = config.directions.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => {
                      const next = active
                        ? config.directions.filter((x) => x !== d)
                        : [...config.directions, d as InspirationDirection];
                      update({ directions: next });
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] transition-all ${
                      active
                        ? 'bg-accent-500/15 font-medium text-accent-300 ring-1 ring-accent-500/40'
                        : 'bg-ink-800 text-slate-500 ring-1 ring-ink-700/60 hover:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Setting>

          {/* 脑洞程度 */}
          <Setting label="脑洞程度" hint={['克制 · 稳扎稳打', '平衡 · 常规套路之上', '放飞 · 越离谱越好'][config.wildness - 1]}>
            <div className="space-y-2">
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={config.wildness}
                onChange={(e) => update({ wildness: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>克制</span>
                <span>平衡</span>
                <span>放飞</span>
              </div>
            </div>
          </Setting>

          {/* Codex 联动 */}
          <Setting label="Codex 联动" hint="抽卡时融入世界档案中的角色与地点,让灵感贴合作品">
            <Switch checked={config.codexLinked} onChange={(v) => update({ codexLinked: v })} />
          </Setting>

          {/* 自动灵感 */}
          <div className="space-y-2 rounded-xl border border-ink-700/60 bg-ink-850/60 p-3">
            <Setting label="写作时自动灵感" hint="Write 页写作过程中,右下角随机弹出灵感提示卡" inline>
              <Switch checked={config.ambientEnabled} onChange={(v) => update({ ambientEnabled: v })} />
            </Setting>
            <div className={config.ambientEnabled ? '' : 'pointer-events-none opacity-40'}>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">弹出频率</div>
              <Segmented
                value={config.ambientFrequency}
                options={[
                  { value: 'low', label: '低 · 约 2 分钟' },
                  { value: 'medium', label: '中 · 约 1 分钟' },
                  { value: 'high', label: '高 · 约 30 秒' },
                ]}
                onChange={(v) => update({ ambientFrequency: v as InspirationConfig['ambientFrequency'] })}
              />
            </div>
          </div>

          {/* 卡片默认展开 */}
          <Setting label="默认展开思路提示" hint="新抽到的卡片自动显示展开思路">
            <Switch checked={config.showTips} onChange={(v) => update({ showTips: v })} />
          </Setting>
        </div>

        {/* 底部说明 */}
        <div className="border-t border-ink-700/60 px-4 py-3 text-[10px] leading-relaxed text-slate-600">
          配置会随项目一起保存。接入真实 LLM 后,以上参数将作为 prompt 条件发送给模型。
        </div>
      </aside>
    </div>
  );
}

function Setting({
  label,
  hint,
  inline,
  children,
}: {
  label: string;
  hint?: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={inline ? '' : 'space-y-2'}>
      <div className={inline ? 'flex items-center justify-between gap-3' : ''}>
        <div>
          <div className="text-xs font-semibold text-slate-200">{label}</div>
          {hint && <div className="mt-0.5 text-[10px] leading-relaxed text-slate-600">{hint}</div>}
        </div>
        {inline && <div className="shrink-0">{children}</div>}
      </div>
      {!inline && children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-ink-800 p-0.5 ring-1 ring-ink-700/60">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
            value === o.value
              ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-accent-500' : 'bg-ink-700 ring-1 ring-ink-600'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

/** 某题材的专属轴编辑器(题材档案展开后) */
function GenreAxisEditor({ genre }: { genre: InspirationGenre }) {
  const axisSelections = useProjectStore((s) => s.project.inspirationConfig.axisSelections);
  const update = useProjectStore((s) => s.updateInspirationConfig);
  const [collapsed, setCollapsed] = useState(false);

  const axes = GENRE_AXES[genre];
  const current = axisSelections[genre] ?? {};
  const hasAny = Object.values(current).some((v) => v.length > 0);

  const toggleAxisValue = (axisKey: string, value: string) => {
    const cur = current[axisKey] ?? [];
    const nextValues = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    const nextAxes: AxisSelections = {
      ...axisSelections,
      [genre]: { ...current, [axisKey]: nextValues },
    };
    update({ axisSelections: nextAxes });
  };

  const clearAll = () => {
    const nextAxes: AxisSelections = { ...axisSelections };
    delete nextAxes[genre];
    update({ axisSelections: nextAxes });
  };

  return (
    <div className="mt-2 rounded-lg border border-ink-700/50 bg-ink-850/50 p-2.5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-300"
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
          {genre} · {axes.length} 个维度
        </button>
        {hasAny && (
          <button
            onClick={clearAll}
            className="ml-auto text-[9px] text-slate-600 transition-colors hover:text-red-400"
          >
            清除
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="mt-2 space-y-2.5">
          {axes.map((axis) => {
            const selected = current[axis.key] ?? [];
            return (
              <div key={axis.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-medium text-slate-400">{axis.label}</span>
                  {axis.description && (
                    <span className="truncate text-[9px] text-slate-600" title={axis.description}>
                      {axis.description}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {axis.options.map((opt) => {
                    const active = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleAxisValue(axis.key, opt)}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] transition-all ${
                          active
                            ? 'bg-accent-500/20 font-medium text-accent-200 ring-1 ring-accent-500/40'
                            : 'bg-ink-800 text-slate-500 ring-1 ring-ink-700/40 hover:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
