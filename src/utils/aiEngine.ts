/**
 * AI 模拟引擎 —— 开箱即用的流式文本生成器
 *
 * 说明:本项目为纯前端演示,内置一套"流式打字机"生成引擎,
 * 根据命令类型与场景上下文,实时产出一段网文风格的正文。
 *
 * 接入真实 LLM 的方式(替换 aiEngine 内部实现即可):
 *   - CodeBuddy Agent SDK:  const stream = query({ prompt, options: { model: 'claude-sonnet-4' } })
 *   - 任意 OpenAI 兼容 API: fetch('/api/chat') + SSE 流式解析
 */

export interface AIGenContext {
  commandId: string;
  sceneTitle: string;
  pov: string;
  location: string;
  mood: string;
  content: string;
  chapterTitle?: string;
  labels: string[];
  /* 用户在 AI 参数面板里调整的参数(可选,引擎会据此调整输出风格) */
  length?: 'short' | 'medium' | 'long' | 'xl';
  povTense?: 'third' | 'first';
  style?: 'classic' | 'modern' | 'concise' | 'ornate' | 'tense' | 'warm';
  userHint?: string;
  /* 生成节拍专用 */
  beatCount?: number;
  beatDensity?: 'tight' | 'balanced' | 'loose';
  beatFocus?: Array<'conflict' | 'character' | 'suspense' | 'emotion' | 'action'>;
}

export const AI_COMMAND_LABELS: Record<string, string> = {
  'ai-continue': '续写',
  'ai-generate': '生成',
  'ai-dialogue': '生成对话',
  'ai-describe': '生成描写',
  'ai-brainstorm': '头脑风暴',
  'ai-beat': '生成节拍',
  'ai-polish': '润色',
  'ai-expand': '扩写',
  'ai-condense': '压缩',
  'ai-rewrite': '改写',
  'ai-summarize': '总结',
  'ai-beat-expand': '扩写节拍',
};

/** 命令 → 返回文本模板 */
function buildOutput(ctx: AIGenContext): string {
  const { commandId, sceneTitle, pov, location, mood, length, povTense, style, userHint, beatCount, beatDensity, beatFocus } = ctx;

  const stylePrefix = style ? `[文风:${styleKey(style)}] ` : '';
  const hintSuffix = userHint ? `\n\n(用户要求:${userHint})` : '';
  const lenSuffix = length === 'short' ? '\n\n[精简版 · 约 150 字]' : length === 'long' ? '\n\n[扩展版 · 约 700 字]' : length === 'xl' ? '\n\n[完整扩展版 · 约 1200 字]' : '';

  // 视角/人称标记(占位,真实 LLM 接后可据此外显)
  void povTense;

  switch (commandId) {
    case 'ai-continue':
      return [
        `${pov}还没来得及细想,脚步声便已到了近前。${location}的雾气像是有生命一般,无声地向他围拢。`,
        '',
        '他握紧手中的剑柄——剑身微温,像是有回应似的,在他掌心里轻轻一颤。那一刻,沈墨尘忽然明白了一件事:从今夜起,他的命,不再由任何一段代码、任何一份 KPI 决定。',
        '',
        '「来吧。」他抬起头,眼底映着雾气深处那一点猩红的光,「这一世,我沈墨尘,自己说了算。」',
      ].join('\n');

    case 'ai-generate':
      return [
        `夜深了,${location}里只剩下一盏将熄的油灯。${pov}靠在斑驳的柱子上,看着灯花噼啪爆开,心里那根弦却怎么也松不下来。`,
        '',
        `这一夜,注定不会太平。`,
      ].join('\n');

    case 'ai-dialogue':
      return [
        `「你为什么要帮我?」沈墨尘盯着她,目光锐利。`,
        '',
        `苏晚晴脚步一顿,没有回头:「有人托我照看你。」`,
        '',
        `「谁?」`,
        '',
        `「你很快就会知道。」她顿了顿,「但那个人让我转告你一句话——」`,
        '',
        `她侧过头,月色落在她清冷的面容上:「剑,不是用来杀人的。是用来守的。」`,
      ].join('\n');

    case 'ai-describe':
      return [
        `${location}。`,
        '',
        `雾霭沉沉的谷底,寸草不生。嶙峋的怪石像是某种巨兽的獠牙,从黑土里参差刺出;空气中弥漫着一股铁锈与腐朽的气息,每一次呼吸都像是在吞刀片。`,
        '',
        `风穿过石缝,发出呜咽般的声响,仿佛整座深渊都在低语。${mood}——此刻连空气都是沉甸甸的。`,
      ].join('\n');

    case 'ai-brainstorm':
      return [
        `围绕「${sceneTitle}」,可考虑的走向:`,
        '',
        `1. 惊变:${pov}发现${location}的封印并非年久失修,而是被人刻意破坏——幕后黑手就藏在宗门内部,且已经盯上了他。`,
        `2. 反转:无名古剑的剑灵并非"守门人",而是千仞渊封印中的那一物;它救他,是因为它需要一个能带它离开封印的"钥匙"。`,
        `3. 情感:苏晚晴深夜来访,两人第一次交心;她告诉沈墨尘,他的杂役身份是有人刻意安排的——而那个人,就是玄机子。`,
        `4. 伏笔:血魔教少主秦无咎其实见过沈墨尘,在穿越之前。`,
      ].join('\n');

    case 'ai-beat': {
      const n = beatCount ?? 4;
      const density = beatDensity ?? 'balanced';
      const focus = beatFocus?.length ? beatFocus : ['conflict', 'character'];
      // 节拍戏剧功能:开端 / 推进 / 转折 / 高潮 / 收束(按密度分配)
      const arcs = density === 'tight'
        ? ['开端', '转折', '高潮', '收束'].slice(0, n).concat(Array(Math.max(0, n - 4)).fill('推进')).slice(0, n)
        : density === 'loose'
          ? ['铺设', '推进', '推进', '推进', '转折', '高潮', '收束'].slice(0, n)
          : ['开端', '推进', '转折', '高潮'].slice(0, n).concat(Array(Math.max(0, n - 4)).fill('推进')).slice(0, n);
      // 每行:序号 + 戏剧功能 + 关注点 + 一句话节拍描述
      const templates = [
        () => `${pov}抵达${location},带着悬念与不安,环境/心理初描`,
        () => `${pov}与某人物初次正面接触,关系/立场初显`,
        () => `${pov}的试探/小冲突,小爆点,埋线`,
        () => `${pov}在${location}陷入对抗,生死/信仰一搏`,
        () => `${pov}真相大白/错位,命运天平倾斜`,
        () => `${pov}作出关键抉择,人物弧光转向`,
        () => `${pov}暂时脱身/合谋,${location}局势重置`,
        () => `${pov}独处反思,情绪落点 + 下一卷钩子`,
      ];
      const focusText = focus.map(focusKey).join('、');
      const lines: string[] = [
        `「${sceneTitle}」节拍建议(共 ${n} 个 · 密度:${density} · 关注:${focusText}):`,
        '',
      ];
      arcs.forEach((arc, i) => {
        const tmpl = templates[i % templates.length]();
        lines.push(`◆ ${i + 1} · ${arc}:${tmpl}`);
      });
      if (userHint) lines.push('', `(用户要求:${userHint})`);
      return lines.join('\n');
    }

    case 'ai-polish':
      return [
        `沈墨尘是被一阵剧痛唤醒的。`,
        '',
        `后脑像被铁锤凿过,喉间腥甜翻涌。他抬手去摸,触到一手粘稠的温热——是血。残月从破败的屋顶漏下,照着斑驳的泥塑神像,也照着他身上那件洗得发白的粗布短褐。`,
        '',
        `这不是他的房间。他的房间在城东那间三十平的出租屋里,窗外永远是堵着的车流,闹钟会在早上七点准时把他叫醒,提醒他今天又要为老板的饼卖命。`,
        '',
        `「你醒了。」一个苍老的声音自识海深处响起,沙哑得像是从千年尘埃里扒出来的。`,
      ].join('\n');

    case 'ai-expand':
      return [
        `月黑风高,荒山古庙。`,
        '',
        `沈墨尘是被一阵剧痛唤醒的。后脑像是被人用铁锤凿过,喉咙里腥甜翻涌,他下意识伸手去摸,摸到一手粘稠的、带着铁锈味的温热液体——是血。残月从破败的屋顶漏进来,照着斑驳剥落的泥塑神像,神像低垂的眉眼悲悯而空洞,仿佛在看着这世间又一具无处安放的躯体。`,
        '',
        `他挣扎着坐起来,环顾四周:断了的香案,积灰的蒲团,角落里半人高的蛛网。空气里弥漫着腐朽的檀香和尘土的呛味。这绝不是他熟悉的、充斥着外卖盒与代码味道的出租屋。`,
      ].join('\n');

    case 'ai-condense':
      return [
        `沈墨尘自剧痛中醒来,发现自己穿越到了一具废柴杂役身上,正被血魔教弟子追杀。识海中的无名古剑残魂提醒他速走,话音未落,庙门已被人一脚踹开。`,
      ].join('\n');

    case 'ai-rewrite':
      return [
        `醒来时,后脑的钝痛比记忆里任何一次宿醉都要凶猛。`,
        '',
        `沈墨尘吐出一口带血的唾沫,环顾四周——破庙,蛛网,泥塑神像,还有月光。很好,很古典,很网文。`,
        '',
        `「你醒了。」一个苍老的声音在脑海里幽幽响起,「小子,你还有三息时间跑路,或者,留下来等死。」`,
        '',
        `门外,脚步声已经堵到了庙口。`,
      ].join('\n');

    case 'ai-summarize':
      return `场景「${sceneTitle}」:${pov}在${location}遭遇冲突,推动主线向前。本场完成"惊变"与"钩子"的双重任务,建议下一场景转入敌手视角,以增强压迫感。`;

    case 'ai-beat-expand':
      return [
        `${pov}在${location}压下翻涌的心绪,将面前这一步看得很重。`,
        '',
        `${sceneTitle}`,
        '',
        `他缓缓呼出一口浊气,指尖微颤——不是恐惧,而是某种久违的、蓄势待发的灼热。天边的暮色压得更低了,像是给这一夜下了最后通牒。`,
        '',
        `「该来的,总要来。」${pov}低声道,随即迈步向前,身后卷起的尘埃在昏光中散开。`,
      ].join('\n');

    default:
      return `【AI 正在围绕「${sceneTitle}」生成内容……】`;
  }
}

/** 流式生成器:按字符吐出文本,模拟真实 AI 打字效果 */
export async function* streamAIText(ctx: AIGenContext): AsyncGenerator<string> {
  const text = buildOutput(ctx);
  const chunkSize = 3;
  const speed = 12 + Math.random() * 14;

  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, speed));
    yield text.slice(i, i + chunkSize);
  }

  // 节拍生成不追加 suffix(节拍预览由面板独立解析行)
  if (ctx.commandId === 'ai-beat') return;

  // 用户额外要求 + 输出长度提示(流末尾)
  const suffixParts: string[] = [];
  if (ctx.userHint) suffixParts.push(`\n\n〔已应用用户要求:${ctx.userHint}〕`);
  if (ctx.length === 'short') suffixParts.push('\n\n〔精简版〕');
  else if (ctx.length === 'long') suffixParts.push('\n\n〔扩展版 · 约 700 字〕');
  else if (ctx.length === 'xl') suffixParts.push('\n\n〔完整扩展版 · 约 1200 字〕');
  const suffix = suffixParts.join('');
  if (!suffix) return;
  for (let i = 0; i < suffix.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, speed));
    yield suffix.slice(i, i + chunkSize);
  }
}

/** 节拍摘要生成(供 Write 页"生成节拍"按钮使用) */
export function buildBeatsFromScene(title: string, pov: string, location: string, mood: string): { summary: string }[] {
  return [
    { summary: `${pov}进入${location},${mood}氛围拉开序幕` },
    { summary: `遭遇转折事件,目标与阻碍浮出水面` },
    { summary: `冲突升级,${pov}被迫作出关键抉择` },
    { summary: `悬念收束,为下一场景埋下钩子` },
  ];
}

function styleKey(s: NonNullable<AIGenContext['style']>): string {
  return { classic: '古风典雅', modern: '现代简练', concise: '简洁紧凑', ornate: '华丽铺陈', tense: '紧张悬疑', warm: '温情感性' }[s];
}

function focusKey(f: string): string {
  return { conflict: '冲突', character: '人物', suspense: '悬念', emotion: '情感', action: '动作' }[f] ?? f;
}
