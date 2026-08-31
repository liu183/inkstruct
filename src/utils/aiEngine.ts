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
};

/** 命令 → 返回文本模板 */
function buildOutput(ctx: AIGenContext): string {
  const { commandId, sceneTitle, pov, location, mood } = ctx;

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

    case 'ai-beat':
      return [
        `「${sceneTitle}」节拍建议:`,
        '',
        `◆ 节拍一:${pov}抵达${location},发现异样(疑)`,
        `◆ 节拍二:遭遇敌手,以古剑之力周旋(斗)`,
        `◆ 节拍三:敌手吐露关键信息,阴谋浮出水面(转)`,
        `◆ 节拍四:惊变突起,场景在悬念中收束(钩子)`,
      ].join('\n');

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

    default:
      return `【AI 正在围绕「${sceneTitle}」生成内容……】`;
  }
}

/** 流式生成器:按字符吐出文本,模拟真实 AI 打字效果 */
export async function* streamAIText(ctx: AIGenContext): AsyncGenerator<string> {
  const text = buildOutput(ctx);
  const chunkSize = 3;
  // 随机化速度,让"打字"更像真人
  const speed = 12 + Math.random() * 14;

  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, speed));
    yield text.slice(i, i + chunkSize);
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
