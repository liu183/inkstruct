import { useMemo, useState } from 'react';
import {
  CalendarDays, Flame, NotebookPen, PenLine, Trash2, TrendingUp,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { totalWords as countWords } from '../../utils/structure';

const MOODS = ['顺畅', '卡壳', '突破', '满意', '疲惫', '灵感爆发'];

/** 今天 YYYY-MM-DD */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 创作日志:记录每天写了多少字、状态如何、想到什么
 */
export default function JournalWorkspace() {
  const project = useProjectStore((s) => s.project);
  const addJournalEntry = useProjectStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useProjectStore((s) => s.deleteJournalEntry);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const [date, setDate] = useState(today());
  const [words, setWords] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [note, setNote] = useState('');

  const entries = useMemo(
    () => [...project.journal].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [project.journal]
  );

  const stats = useMemo(() => {
    const total = entries.reduce((n, e) => n + e.words, 0);
    const dates = [...new Set(entries.map((e) => e.date))].sort();
    // 连续写作天数(从今天或最近一次日志往前数)
    let streak = 0;
    const set = new Set(dates);
    const cursor = new Date();
    if (!set.has(today())) cursor.setDate(cursor.getDate() - 1);
    for (;;) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (!set.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const last7 = entries
      .filter((e) => {
        const d = new Date(e.date).getTime();
        return Date.now() - d <= 7 * 86400000;
      })
      .reduce((n, e) => n + e.words, 0);
    return { total, days: dates.length, streak, last7 };
  }, [entries]);

  const submit = () => {
    if (!note.trim() && !words.trim()) {
      setStatusMessage('写点什么再记录吧');
      return;
    }
    addJournalEntry({
      date: date || today(),
      words: Number(words) || 0,
      note: note.trim(),
      mood,
    });
    setWords('');
    setNote('');
    setStatusMessage('已记录到创作日志');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 头部 */}
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <NotebookPen size={18} className="text-emerald-400" />
          <h1 className="text-lg font-semibold text-slate-100">创作日志</h1>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>
              日志{' '}
              <span className="font-mono text-xs font-semibold text-slate-300">{entries.length}</span> 条
            </span>
            <span>
              累计{' '}
              <span className="font-mono text-xs font-semibold text-slate-300">
                {stats.total.toLocaleString()}
              </span>{' '}
              字
            </span>
            <span className="flex items-center gap-1">
              <Flame size={11} className="text-orange-400" />
              连续{' '}
              <span className="font-mono text-xs font-semibold text-orange-300">{stats.streak}</span> 天
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500">
            <TrendingUp size={12} className="text-emerald-400" />
            近 7 天 {stats.last7.toLocaleString()} 字
            <span className="text-slate-700">·</span>
            全书 {countWords(project).toLocaleString()} 字
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          每天写完之后花一分钟记一笔,连更的天数会自己涨上去
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          {/* 新建日志 */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <PenLine size={13} />
              记一笔
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-slate-500">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-dark !py-1.5 text-[11px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-slate-500">今日字数</label>
                <input
                  type="number"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  placeholder="0"
                  className="input-dark !py-1.5 text-[11px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-slate-500">状态</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="input-dark !py-1.5 text-[11px]"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="今天写了什么?卡在哪?明天打算怎么接…"
              className="input-dark mt-2.5 w-full resize-none text-xs"
            />

            <div className="mt-2.5 flex items-center gap-2">
              <button onClick={submit} className="btn-primary">
                <PenLine size={13} />
                记录
              </button>
              <span className="text-[9px] text-slate-600">同一天可以记多条,字数会累计统计</span>
            </div>
          </div>

          {/* 日志列表 */}
          <div className="mt-6 space-y-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-xl border border-ink-700/50 bg-ink-850/60 p-4 transition-colors hover:border-ink-600"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={12} className="text-accent-400" />
                  <span className="font-mono text-[11px] text-slate-300">{entry.date}</span>
                  {entry.mood && (
                    <span className="rounded bg-accent-500/10 px-1.5 py-px text-[9px] text-accent-300 ring-1 ring-accent-500/20">
                      {entry.mood}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-emerald-400">
                    +{entry.words.toLocaleString()} 字
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('删除这条日志?')) deleteJournalEntry(entry.id);
                    }}
                    className="rounded p-1 text-slate-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {entry.note && (
                  <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-400">
                    {entry.note}
                  </p>
                )}
              </div>
            ))}

            {entries.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-700/50 bg-ink-900/30 px-4 py-10 text-center text-[11px] text-slate-600">
                还没有日志记录,写下第一篇吧
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
