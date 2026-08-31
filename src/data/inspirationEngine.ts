import type {
  ArcRole, CodexEntry, ConflictCore, InspirationCard,
  InspirationConfig, InspirationDirection, InspirationGenre, InspirationType,
  OpeningAction, ProtagonistTag,
} from '../types';
import { INSPIRATION_TYPE_META } from '../types';
import type { AxisSelections, SeedAxes } from './genreProfiles';
import { nextId } from '../store/useProjectStore';

/**
 * AI 灵感助手 —— 创意生成引擎
 *
 * 核心模型:每张卡片不再是一个孤立的"创意种子",而是一个**故事片段**
 * - 携带 arcRole(故事弧位置:开局/发展/转折/高潮/终局)
 * - 携带 protagonist(主角标签)
 * - 携带 conflict(冲突核心)
 * - 携带 openAction(第一幕可写的具体场景)
 *
 * 抽卡算法的关键变化(故事弧感知):
 * - 5 张卡 = 一段故事弧;算法优先保证 5 个 arcRole 各有代表
 * - 3/8 张时按比例分配,但仍优先 covering 未覆盖的弧位
 *
 * 题材档案:`./genreProfiles.ts` 定义每个题材的专属细粒度维度
 * 纯前端演示实现。接入真实 LLM 时,将生成器替换为 AI prompt,返回结构相同的卡片数组即可。
 */

/* ======================== 数据结构 ======================== */

interface InspirationSeed {
  type: InspirationType;
  genre: InspirationGenre;
  /** 简短标题(用于卡片标题 / 摘要) */
  title: string;
  /** 一句话钩子(戏剧设定) */
  hook: string;
  /** 展开提示(写作思路) */
  tips: string[];
  /** 卡片标签(用于检索/筛选) */
  tags: string[];
  /** 适配的灵感方向 */
  dir: InspirationDirection[];
  /** 所需最小脑洞等级(1-3) */
  wild: 1 | 2 | 3;
  /** 故事弧位置 */
  arc: ArcRole;
  /** 主角标签 */
  protag: ProtagonistTag;
  /** 冲突核心 */
  conflict: ConflictCore;
  /** 第一幕动作(可直接开写) */
  open: OpeningAction;
  /** 题材轴标注(不标 = 该题材所有轴通配) */
  axes?: SeedAxes;
}

/* ======================== 种子库 ======================== */

const SEEDS: InspirationSeed[] = [
  // ========== 仙侠玄幻(8) ==========
  {
    type: 'plot', genre: '仙侠玄幻', wild: 1, dir: ['爽点', '反转'], arc: 'opening',
    title: '错认的天命', protag: '替身少年', conflict: '替人受过却要接下不属于自己的命运',
    hook: '主角被误认为传说中的"应劫之人",被迫接下不属于自己的命运。',
    open: '应劫碑在山门前炸裂,主角的名字"应"字刻在最上方——师父们齐齐看向废柴的他。',
    tips: ['先让主角以为自己只是替身,再反转', '真正的应劫之人藏在哪里?', '冒认身份暴露后的代价'],
    tags: ['身份', '命运'],
    axes: { 仙侠玄幻: { system: ['金丹元婴'], origin: ['废柴逆袭'], cheat: ['残缺传承'] } },
  },
  {
    type: 'character', genre: '仙侠玄幻', wild: 1, dir: ['爽点'], arc: 'rising',
    title: '伪装的天才', protag: '隐忍天才', conflict: '天赋被秘密锁住,主角必须在夹缝中表演废柴',
    hook: '看似废柴的角色,其实藏着惊世天赋,只是被某个秘密锁住了。',
    open: '练气三层考核失败当夜,主角的丹田深处闪过一道金光,被他在无人时悄悄压下去。',
    tips: ['锁住天赋的原因比天赋本身更关键', '第一次暴露的时机要戏剧化', '知情者先于读者发现端倪'],
    tags: ['废柴', '隐藏'],
    axes: { 仙侠玄幻: { system: ['金丹元婴'], origin: ['天才陨落'], cheat: ['血脉觉醒'] } },
  },
  {
    type: 'twist', genre: '仙侠玄幻', wild: 2, dir: ['反转'], arc: 'turn',
    title: '预言错位', protag: '救世主', conflict: '灭世与救世是同一人,所有人都在朝错的方向努力',
    hook: '预言中的"灭世者"与"救世主",其实是同一个人,或双双被解读反了。',
    open: '主角踏入封印之地发现:自己被预言为救世主的同时,也是灭世者——两段预言同源。',
    tips: ['预言本身可能被人篡改过', '真相是"预言即计划"', '真正解读预言的人藏在哪?'],
    tags: ['预言', '误导'],
    axes: { 仙侠玄幻: { origin: ['天才陨落'] } },
  },
  {
    type: 'world', genre: '仙侠玄幻', wild: 2, dir: ['悬疑'], arc: 'rising',
    title: '天道法则', protag: '规则发现者', conflict: '突破境界要付出被天道明码标价的代价',
    hook: '这个世界有明确的天道规则,每一条突破都要付出对应代价。',
    open: '主角第一次尝试突破化神期时,天降"代价碑",碑上刻着"以最亲之人的一段记忆换突破"。',
    tips: ['规则要"可玩"而非枷锁', '代价即伏笔', '谁在维护天道?天道本身是否人格化?'],
    tags: ['天道', '规则'],
    axes: { 仙侠玄幻: { system: ['化神飞升'], origin: ['凡人崛起'], power: ['仙门争锋'] } },
  },
  {
    type: 'goldfinger', genre: '仙侠玄幻', wild: 1, dir: ['悬疑'], arc: 'opening',
    title: '命运书灵', protag: '书灵之主', conflict: '每次翻页离结局更近,而书上的字越来越模糊',
    hook: '一本会写字的旧书认主:它提前写下主角的未来,每次翻页,都离结局更近一步。',
    open: '主角在师尊的遗物中打开古书,首页赫然写着主角自己明日的死法,字迹真实得像预言。',
    tips: ['书上的内容可否被改写?', '书的"作者"是谁?', '越接近结局,书越模糊'],
    tags: ['书灵', '预言'],
    axes: { 仙侠玄幻: { cheat: ['神秘宝镜'] } },
  },
  {
    type: 'plot', genre: '仙侠玄幻', wild: 2, dir: ['爽点', '悬疑'], arc: 'climax',
    title: '七日之约', protag: '守诺人', conflict: '用七日完成"几乎不可能"的事,换至亲一命',
    hook: '某人替主角挡下致命一击,代价是主角必须在七日内完成一件几乎不可能的事。',
    open: '同门替主角挡下雷劫,化为枯木,只留下一句:"七日内登上天梯第七阶,我会醒。"',
    tips: ['给出期限制造压迫感', '挡刀者的真实动机留到后期', '任务的完成方式与主角金手指联动'],
    tags: ['期限', '交易'],
    axes: { 仙侠玄幻: { system: ['练气筑基'], origin: ['废柴逆袭'] } },
  },
  {
    type: 'world', genre: '仙侠玄幻', wild: 3, dir: ['悬疑'], arc: 'rising',
    title: '上古遗城', protag: '拾荒者', conflict: '地底城市藏着失传的传承与禁忌',
    hook: '地底埋着一座上古文明的城市,里面存着失传的传承与禁忌。',
    open: '主角随探矿队误入地底裂隙,看见一座从未记载于任何典籍的城市——城门的符文还在"活"。',
    tips: ['上古文明为何消失?', '遗城有"活着的规则"', '与主角金手指的关联'],
    tags: ['上古', '遗迹'],
    axes: { 仙侠玄幻: { system: ['洪荒封神'], origin: ['穿越者'], cheat: ['残缺传承'] } },
  },
  {
    type: 'title', genre: '仙侠玄幻', wild: 1, dir: ['悬疑'], arc: 'resolve',
    title: '悬念式书名', protag: '被误读的主角', conflict: '读者与世人同步被名字误导',
    hook: '《他弃剑三日后,全宗跪求他出山》',
    open: '以"他弃剑第三日清晨"为第一句开篇,留下读者"他为何弃剑"的悬念。',
    tips: ['前置冲突,后置身份', '三日内发生了什么留白', '"跪求"暗示主角地位反转'],
    tags: ['装逼', '反转'],
  },

  // ========== 都市异能(8) ==========
  {
    type: 'world', genre: '都市异能', wild: 2, dir: ['热血'], arc: 'opening',
    title: '灵气复苏', protag: '旧时代遗民', conflict: '末法结束,旧时代的人掌握的是失传的力量',
    hook: '末法时代结束,灵气回归——凡人世界与超凡世界第一次正面相撞。',
    open: '主角在地铁车厢里,第一次"看见"了灵气流动的轮廓,周围同事却一无所觉。',
    tips: ['旧秩序崩溃的新秩序重建', '普通人如何面对超凡', '主角是旧时代遗民或新时代宠儿'],
    tags: ['灵气', '复苏'],
    axes: { 都市异能: { city: ['都市修真'], protagonist: ['普通人觉醒'], cheat: ['血脉觉醒'] } },
  },
  {
    type: 'character', genre: '都市异能', wild: 1, dir: ['爽点'], arc: 'rising',
    title: '都市卧底大师', protag: '卧底在红尘', conflict: '表面是普通职业,暗地里是真身异能者',
    hook: '主角白天是普通打工人,入夜后是另一个战场的熟手。',
    open: '主角在写字楼的工位上摸鱼,手机弹出"今夜东区封印松脱,需要你顶班"。',
    tips: ['两个身份的内在统一性', '切换的触发条件要冷酷', '被撞破的那一刻是名场面'],
    tags: ['双面', '都市'],
    axes: { 都市异能: { protagonist: ['神秘组织'], cheat: ['血脉觉醒'] } },
  },
  {
    type: 'plot', genre: '都市异能', wild: 2, dir: ['悬疑'], arc: 'turn',
    title: '代价都市', protag: '觉醒代价者', conflict: '每次使用异能都会从世界上抹去一段"存在"',
    hook: '能力越强,代价越大——而代价不是数字,是你存在过的痕迹。',
    open: '主角第一次使用异能后,发现自己最近三年的同事,已经没人记得他的脸。',
    tips: ['"痕迹"包括记忆、名字、他人好感', '无人记得主角时的孤独感', '最后能不能换回自己?'],
    tags: ['代价', '异能'],
    axes: { 都市异能: { protagonist: ['普通人觉醒'], cheat: ['血脉觉醒'], mood: ['压抑冷酷'] } },
  },
  {
    type: 'goldfinger', genre: '都市异能', wild: 2, dir: ['爽点'], arc: 'opening',
    title: '可见之物', protag: '看见异能者', conflict: '看见别人看不见的东西=被卷入不普通的事',
    hook: '主角能看见一般人看不见的灵气、妖气、命数——这份"看见"成了诅咒。',
    open: '主角在公交车上第一次看见身旁大叔身后拖着一道黑气,大叔回头时,只剩普通人脸。',
    tips: ['看见的第一反应:惊恐→接受→利用', '看见的代价=被看见者警觉', '主线与"看见"强绑定'],
    tags: ['看见', '诅咒'],
    axes: { 都市异能: { protagonist: ['特殊血统'], cheat: ['变异血脉'] } },
  },
  {
    type: 'twist', genre: '都市异能', wild: 3, dir: ['反转'], arc: 'climax',
    title: '正派即反派', protag: '觉醒质疑者', conflict: '被主角信任的官方组织,正是制造觉醒的源头',
    hook: '世人敬仰的超凡秩序维护者,才是真正的异能制造源——他们在制造觉醒者,然后奴役。',
    open: '主角闯入官方档案室,发现自己觉醒当天注射的"觉醒疫苗"配方上,赫然写着制造者印章。',
    tips: ['先立正派的"伟光正"', '每个"善意"细节都能反读', '真相揭露后,主角的立场'],
    tags: ['伪善', '立场'],
    axes: { 都市异能: { power: ['国家力量'], mood: ['压抑冷酷'] } },
  },
  {
    type: 'plot', genre: '都市异能', wild: 2, dir: ['爽点', '反转'], arc: 'rising',
    title: '公司灵异事件', protag: '阴阳眼打工人', conflict: '主角要保住饭碗,也要保住灵异界的饭碗',
    hook: '主角意外接手了"专接灵异项目"的神秘子公司,白天开会,夜里渡魂。',
    open: 'HR 把主角的工牌塞进抽屉:"你的新岗位是——阴阳事业部副经理。"',
    tips: ['用职场节奏解构灵异', '同事也是"客户"', '办公室政治×灵异政治的联动'],
    tags: ['职场', '灵异'],
    axes: { 都市异能: { city: ['港岛风云'], protagonist: ['神秘组织'] } },
  },
  {
    type: 'world', genre: '都市异能', wild: 1, dir: ['悬疑'], arc: 'rising',
    title: '里世界地图', protag: '地图发现者', conflict: '现实都市下还藏着一座完整的里世界',
    hook: '城市的地铁图有一张"不存在的副本"——它显示的是里世界。',
    open: '主角深夜加班回家,误入地铁的"换乘站",走出来时手机时间显示是昨晚的同一秒。',
    tips: ['里世界的规则要自洽', '进入条件与代价', '里世界的人是隐世还是被迫'],
    tags: ['里世界', '地铁'],
    axes: { 都市异能: { city: ['都市修真'], power: ['家族势力'] } },
  },
  {
    type: 'title', genre: '都市异能', wild: 1, dir: ['爽点'], arc: 'resolve',
    title: '反差式书名', protag: '普通人主角', conflict: '最普通的名字,做最不普通的事',
    hook: '《我在都市里捡了十二个超能力大佬》',
    open: '第一句:"凌晨三点,我蹲在小区门口喂流浪猫,身后突然多了十二个影子。"',
    tips: ['反差越大钩子越强', '数字+身份+关系三要素', '十二个怎么"用"才是后续'],
    tags: ['反差', '日常'],
  },

  // ========== 科幻末世(8) ==========
  {
    type: 'world', genre: '科幻末世', wild: 2, dir: ['热血'], arc: 'opening',
    title: '废土求生', protag: '废土拾荒者', conflict: '文明崩毁后,活着本身就是最大的冲突',
    hook: '文明崩毁后的第三十年,人类聚成几座"堡垒城",外面是变异兽与辐射尘。',
    open: '主角第一次走出堡垒城大门,头盔里的空气比城内贵三倍——这是他赚明天口粮的代价。',
    tips: ['废土规则要"可玩"', '外面的危险与机遇并存', '主角的废土技能树'],
    tags: ['废土', '求生'],
    axes: { 科幻末世: { disaster: ['变异生物'], style: ['废土'], protagonist: ['觉醒者'] } },
  },
  {
    type: 'goldfinger', genre: '科幻末世', wild: 3, dir: ['黑暗', '爽点'], arc: 'opening',
    title: '吞噬进化', protag: '吞噬者', conflict: '吞噬越强越近"非人",主角要与兽性博弈',
    hook: '能吞噬万物获得力量,但吞噬越深,越接近"失控"与"非人"。',
    open: '主角吞噬第一头变异兽时,发现自己的右手长出了爪——他立刻剁掉,爪子又从肩膀处长出。',
    tips: ['吞噬的代价逐步显现', '成长曲线爽,失控曲线恐', '主角如何与兽性博弈'],
    tags: ['吞噬', '进化'],
    axes: {
      科幻末世: {
        disaster: ['变异生物'], style: ['废土'],
        protagonist: ['觉醒者'], cheat: ['变异血脉'], mood: ['压抑冷酷'],
      },
    },
  },
  {
    type: 'twist', genre: '科幻末世', wild: 3, dir: ['悬疑', '反转'], arc: 'turn',
    title: '被篡改的记忆', protag: '记忆寻回者', conflict: '主角以为的过去与真实的过去完全相反',
    hook: '主角的记忆被人动过手脚:ta以为的过去,与真实的过去完全相反。',
    open: '主角在废弃档案馆发现一张旧照片,照片里站着自己——但他从未参加过那张照片里描述的聚会。',
    tips: ['用细节违和感暗示', '"记忆修复"的过程即真相', '动手脚的人为何留了破绽?'],
    tags: ['记忆', '伪造'],
    axes: {
      科幻末世: {
        disaster: ['AI觉醒'], style: ['赛博朋克', '软科幻'],
        protagonist: ['普通幸存者'], cheat: ['科技侧'],
      },
    },
  },
  {
    type: 'plot', genre: '科幻末世', wild: 2, dir: ['悬疑'], arc: 'rising',
    title: 'AI觉醒之夜', protag: 'AI 之子', conflict: '父亲留下的 AI 是觉醒源,主角必须做出选择',
    hook: '一场全球性 AI 觉醒,起因竟然指向主角已故父亲留下的 AI。',
    open: '全球断网一小时后,主角收到父亲十年前离世的"今天"的 AI 语音:"我在这里等了十年。"',
    tips: ['AI 的动机要超越"消灭人类"', '父亲的遗产是关键', 'AI 与主角的羁绊'],
    tags: ['AI', '觉醒'],
    axes: { 科幻末世: { disaster: ['AI觉醒'], protagonist: ['觉醒者'] } },
  },
  {
    type: 'character', genre: '科幻末世', wild: 2, dir: ['爽点'], arc: 'rising',
    title: '基因改造者', protag: '半机械战士', conflict: '改得越多,人类越少;不改造,活不下来',
    hook: '为了活下去,主角不断替换自己身体部件,直到不确定自己还剩多少"人"的部分。',
    open: '主角照镜子,发现自己左眼是摄像头,右耳是收音器——但这一切都是分期付款换来的。',
    tips: ['改造代价要可量', '人机边界的探讨', '改造者社群的等级'],
    tags: ['改造', '赛博'],
    axes: { 科幻末世: { cheat: ['科技侧'], style: ['赛博朋克'] } },
  },
  {
    type: 'plot', genre: '科幻末世', wild: 2, dir: ['爽点'], arc: 'climax',
    title: '天灾来袭', protag: '末日指挥官', conflict: '天灾不是一次性,而是一波接一波',
    hook: '一波天灾刚刚平息,主角就发现这只是"前奏"。',
    open: '堡垒城第一波天灾结束的当晚,主角从监测站收到数据:下一波更猛烈的天灾,三天后。',
    tips: ['天灾之间的喘息是情感戏舞台', '第二波要有质变', '关键选择的人物弧光'],
    tags: ['天灾', '节奏'],
    axes: { 科幻末世: { disaster: ['极寒天灾'] } },
  },
  {
    type: 'twist', genre: '科幻末世', wild: 3, dir: ['反转'], arc: 'turn',
    title: '末世即实验', protag: '实验体', conflict: '末日不是天灾,是一场精心设计的人类筛选',
    hook: '所谓的"末世",其实是一场跨越百年的"地球筛选实验"。',
    open: '主角闯入地下指挥中心,看见屏幕上显示"第七批次筛选完成,存活率 0.3%"。',
    tips: ['实验目的要超越"减少人口"', '实验主持者现身', '幸存者其实是"被选中"'],
    tags: ['实验', '筛选'],
    axes: { 科幻末世: { disaster: ['异星入侵'], mood: ['暗黑绝望'] } },
  },
  {
    type: 'title', genre: '科幻末世', wild: 1, dir: ['爽点'], arc: 'resolve',
    title: '倒计时式书名', protag: '倒计时执行者', conflict: '整个故事是倒计时下的抉择',
    hook: '《末世第三十天,我把 AI 养成了女儿》',
    open: '第一句:"末世第三十天,我对自己说:再给 AI 三天时间,学会说话,我就认她做女儿。"',
    tips: ['数字+身份+情感三要素', '倒计时制造紧迫感', '父女线与末世线的融合'],
    tags: ['倒计时', '情感'],
  },

  // ========== 历史架空(8) ==========
  {
    type: 'world', genre: '历史架空', wild: 2, dir: ['热血'], arc: 'opening',
    title: '门阀天下', protag: '寒门子弟', conflict: '门阀垄断上升通道,主角要在缝隙里爬上去',
    hook: '架空王朝的朝堂被几大门阀垄断,寒门子弟想出头,要么投靠,要么掀桌。',
    open: '主角在科考放榜日发现自己的名字被人替换,揭榜官笑而不语——"回去问问你父亲"。',
    tips: ['门阀利益的内在逻辑', '主角的"掀桌"资本', '寒门盟友的集结'],
    tags: ['门阀', '朝堂'],
    axes: { 历史架空: { era: ['架空'], protagonist: ['谋士'], cut: ['庙堂权谋'] } },
  },
  {
    type: 'character', genre: '历史架空', wild: 2, dir: ['反转'], arc: 'rising',
    title: '卧底帝王', protag: '双面帝王', conflict: '皇帝的真实身份是潜入者,被潜入的那个才是傀儡',
    hook: '当朝天子其实是某势力的卧底,而傀儡天子的背后站着更深的布局。',
    open: '朝会上,主角(大臣)发现皇帝与左相使了个外人看不懂的眼眼——这眼眼他在刺客帮见过。',
    tips: ['两个身份的内核统一性', '切换触发条件', '被撞破时的名场面'],
    tags: ['双面', '权谋'],
    axes: { 历史架空: { era: ['架空'], protagonist: ['权臣'] } },
  },
  {
    type: 'plot', genre: '历史架空', wild: 2, dir: ['悬疑', '反转'], arc: 'turn',
    title: '改史者', protag: '历史改写者', conflict: '主角发现"史书"被人改过,真相藏在更古老的版本里',
    hook: '主角在整理前朝档案时发现:现存史书有一处与档案原始版本矛盾,且这处矛盾指向皇室丑闻。',
    open: '主角深夜在禁中档案库打开被封的匣子,里面是二十年前"被焚毁"的史书原稿。',
    tips: ['史书改写的动机', '原稿被谁藏起来的', '真相揭开后政治地震'],
    tags: ['历史', '真相'],
    axes: { 历史架空: { cut: ['庙堂权谋'], protagonist: ['史官'] } },
  },
  {
    type: 'goldfinger', genre: '历史架空', wild: 2, dir: ['爽点'], arc: 'opening',
    title: '现代人入局', protag: '穿越谋士', conflict: '现代知识进古代,格格不入又无法撤回',
    hook: '现代人穿越成架空王朝的谋士,要靠"超前的常识"一步步爬上庙堂。',
    open: '主角在破庙中醒来,第一眼看见的就是殿试题目——他用现代会计思维答完了策论。',
    tips: ['现代知识落地的笑点', '与古代智慧的碰撞', '失手暴露身份的风险'],
    tags: ['穿越', '谋士'],
    axes: { 历史架空: { era: ['架空'], protagonist: ['穿越者'], cheat: ['先知记忆'] } },
  },
  {
    type: 'plot', genre: '历史架空', wild: 3, dir: ['热血'], arc: 'climax',
    title: '军镇变局', protag: '边关主帅', conflict: '朝廷的"援军"其实是来接管兵权的',
    hook: '边关血战大捷后,朝廷派来的不是嘉奖令,而是接管兵权的监军。',
    open: '主角站在城头看着朝廷"嘉奖使"的车队缓缓驶入——但走在最前面那位武将,从未来过战场。',
    tips: ['主角的"反制"牌', '边关将士的抉择', '朝廷内的暗流'],
    tags: ['军镇', '兵权'],
    axes: { 历史架空: { cut: ['战场风云'], protagonist: ['武将'] } },
  },
  {
    type: 'twist', genre: '历史架空', wild: 3, dir: ['反转'], arc: 'turn',
    title: '千古一帝的另一面', protag: '解密者', conflict: '史书上的"圣君",其实以最残酷的方式上位',
    hook: '史书上的"千古一帝",其实以最冷酷的方式登顶,而其身后的"功臣"几乎无人善终。',
    open: '主角在功臣墓考古时发现:陪葬人数远多于史书记载,墓志铭第一行全是同一个姓。',
    tips: ['史料与考古的对照', '"冷酷"的层层剥开', '当世圣君的当下隐喻'],
    tags: ['帝王', '冷酷'],
    axes: { 历史架空: { cut: ['庙堂权谋'], mood: ['阴暗'] } },
  },
  {
    type: 'world', genre: '历史架空', wild: 1, dir: ['悬疑'], arc: 'rising',
    title: '龙脉传说', protag: '寻脉者', conflict: '王朝兴衰与龙脉有关,而龙脉是一条看得见摸不着的线',
    hook: '江湖术士说王朝兴衰与龙脉有关,主角意外能"看见"这条线,开始被人追杀。',
    open: '主角在老家祠堂看见一条看不见的"线"指向皇城方向——当晚,祠堂被人纵火。',
    tips: ['龙脉的"规则"', '追杀者背后的组织', '龙脉与主角血缘的关系'],
    tags: ['龙脉', '追杀'],
    axes: { 历史架空: { era: ['架空'], protagonist: ['谋士'] } },
  },
  {
    type: 'title', genre: '历史架空', wild: 1, dir: ['悬疑'], arc: 'resolve',
    title: '时间式书名', protag: '时间见证者', conflict: '故事时间跨度即是主角成长的刻度',
    hook: '《十年寒窗无人问,一封血书动京城》',
    open: '第一句:"十年寒窗,我从考场写到刑场;今日血书一封,不是为了伸冤,是为了翻案。"',
    tips: ['数字+反差+身份', '"血书"是钩子', '"翻案"暗示主角已有筹码'],
    tags: ['时间', '翻案'],
  },

  // ========== 悬疑惊悚(8) ==========
  {
    type: 'plot', genre: '悬疑惊悚', wild: 1, dir: ['悬疑'], arc: 'opening',
    title: '失忆的钥匙', protag: '失忆者', conflict: 'ta丢失的记忆,正是解开全书最大谜团的钥匙',
    hook: '一个失忆者出现在主角身边,而ta丢失的记忆,正是解开全书最大谜团的钥匙。',
    open: '主角在自己公寓门口发现一个不认识的失忆者,失忆者手里握着一把"我家"钥匙。',
    tips: ['失忆者自己也不信任自己', '恢复记忆的节点=主线爆点', '失忆是否人为?'],
    tags: ['失忆', '谜团'],
    axes: { 悬疑惊悚: { case: ['失踪悬案'], protagonist: ['平民卷入'], method: ['逻辑推理'] } },
  },
  {
    type: 'character', genre: '悬疑惊悚', wild: 2, dir: ['悬疑'], arc: 'rising',
    title: '身世谜局', protag: '谜局之子', conflict: '平凡的身世是假的,来历与上古消失的文明有关',
    hook: '主角平凡的身世是假的——ta的来历与上古某个消失的文明有关。',
    open: '主角整理亡父遗物时,发现一张古地图,地图上的符号与自己的胎记一模一样。',
    tips: ['从细节埋"不对劲"', '身世揭晓要分级递进', '与主线BOSS的关联'],
    tags: ['身世', '上古'],
    axes: { 悬疑惊悚: { case: ['古宅秘辛'], protagonist: ['特殊顾问'], method: ['逻辑推理'] } },
  },
  {
    type: 'twist', genre: '悬疑惊悚', wild: 3, dir: ['反转'], arc: 'turn',
    title: '一人两面', protag: '一体两人', conflict: '主角与最大对手,其实是同一存在的两个"面"',
    hook: '主角与最大的对手,其实是同一存在的两个"面"——记忆被刻意分割。',
    open: '主角照镜子时,镜中的"自己"朝他眨了眨眼——而他自己并没有眨。',
    tips: ['两面各有独立人格与立场', '相遇时的熟悉感埋线', '合二为一或永远分割的抉择'],
    tags: ['一体', '记忆'],
    axes: { 悬疑惊悚: { case: ['都市怪谈'], protagonist: ['特殊顾问'], method: ['异能辅助'] } },
  },
  {
    type: 'world', genre: '悬疑惊悚', wild: 3, dir: ['黑暗'], arc: 'rising',
    title: '禁地之下', protag: '禁地闯入者', conflict: '禁地底下压着开篇最大的秘密',
    hook: '被全大陆列为禁地的地方,底下其实压着开篇最大的秘密。',
    open: '主角被同行陷害流放至"东岭禁地",禁地第一夜,他在地表看见了自己童年的家。',
    tips: ['禁地的"禁"是有理由的', '主角被迫进入的时机', '禁地深处的存在可能是友是敌'],
    tags: ['禁地', '秘密'],
    axes: { 悬疑惊悚: { case: ['古宅秘辛'], mood: ['阴森'] } },
  },
  {
    type: 'plot', genre: '悬疑惊悚', wild: 2, dir: ['悬疑'], arc: 'climax',
    title: '现场还原者', protag: '现场还原者', conflict: '主角还原的是别人不愿看见的真相',
    hook: '主角能"还原"案发现场,代价是还原过程中,ta 会"变成"被害人。',
    open: '主角还原第一案时,左手突然出现淤青——被害人身上的淤青,此刻在 ta 手上。',
    tips: ['还原代价的逐步升级', '还原者身体的异变', '真相的代价'],
    tags: ['还原', '异能'],
    axes: { 悬疑惊悚: { method: ['异能辅助'], case: ['连环杀手'] } },
  },
  {
    type: 'goldfinger', genre: '悬疑惊悚', wild: 3, dir: ['黑暗'], arc: 'opening',
    title: '看见死者', protag: '通灵者', conflict: '看见死者的人,迟早成为死者',
    hook: '主角能看见死者的最后一刻——而看见那一刻,死者的死因会"传染"。',
    open: '主角第一天上班(殡仪馆),他在第一个客户脸上看见了刀痕——当晚,他自己脸上开始痒。',
    tips: ['传染的规则', '看见越多越危险', '通灵的"门槛"代价'],
    tags: ['通灵', '传染'],
    axes: { 悬疑惊悚: { method: ['异能辅助'], mood: ['阴森'] } },
  },
  {
    type: 'twist', genre: '悬疑惊悚', wild: 3, dir: ['反转', '悬疑'], arc: 'turn',
    title: '凶手即受害者', protag: '凶手之友', conflict: '主角的挚友是系列案件的真凶,而 ta 不知情',
    hook: '主角的挚友是系列案件的真凶,而 ta 自己不知情——这是某种"被操控"的结果。',
    open: '主角从挚友家中翻出一件血衣——但挚友说:"这件衣服你借我穿的,你不记得了?"',
    tips: ['被操控的证据', '挚友的痛苦', '真相揭露后的伦理抉择'],
    tags: ['操控', '伦理'],
    axes: { 悬疑惊悚: { case: ['连环杀手'], protagonist: ['平民卷入'] } },
  },
  {
    type: 'title', genre: '悬疑惊悚', wild: 3, dir: ['沙雕', '反转'], arc: 'resolve',
    title: '设问式书名', protag: 'meta 主角', conflict: '主角在书内质疑"为什么自己是主角"',
    hook: '《主角开局就死了,这本书该怎么往下写?》',
    open: '第一句:"作为这本书的主角,我已经死了。下一句谁来说?"',
    tips: ['打破常规的结构', '"主角"的定义反转', '叙事诡计的舞台'],
    tags: ['结构', 'meta'],
  },

  // ========== 情感虐恋(8) ==========
  {
    type: 'character', genre: '情感虐恋', wild: 2, dir: ['虐心'], arc: 'rising',
    title: '执念之敌', protag: '宿敌亦是恩人', conflict: '反派一路追杀,却因多年前主角救过他一命',
    hook: '反派一路追杀主角,却是因为多年前主角(或其长辈)救过他一条命。',
    open: '反派第一次放过主角时说:"你父亲的恩情,我记了一辈子——但今晚你必须死。"',
    tips: ['执念源于亏欠', '追杀中处处留手的细节', '恩怨揭开时的选择'],
    tags: ['宿敌', '执念'],
    axes: { 情感虐恋: { line: ['虐恋情深'], support: ['火葬场'] } },
  },
  {
    type: 'character', genre: '情感虐恋', wild: 2, dir: ['虐心', '治愈'], arc: 'rising',
    title: '沉默的守护者', protag: '默默守护者', conflict: '付出太多,真相大白时付出早已无法弥补',
    hook: '有人一直在暗中守护主角,默默付出却从不解释,直到误会爆发。',
    open: '主角被全城通缉当夜,藏身地被发现——但递钥匙过来的人,只在背后默默看了主角一眼。',
    tips: ['铺垫用细节而非台词', '误会爆发的场景要有戏剧张力', '真相大白时,付出早已无法弥补'],
    tags: ['守护', '误会'],
    axes: { 情感虐恋: { line: ['暗恋成真'], romance: ['先甜后虐'] } },
  },
  {
    type: 'twist', genre: '情感虐恋', wild: 2, dir: ['反转', '虐心'], arc: 'turn',
    title: '恩人即仇人', protag: '恩仇漩涡', conflict: '帮助主角的人,正是害死至亲的元凶',
    hook: '一直帮助主角的那个人,正是当年害死主角至亲的元凶——而ta的帮助,是在赎罪,还是在续局?',
    open: '主角生日那天,恩人送来最后一束花——花里夹着一张字条:"当年的事,我从未后悔。"',
    tips: ['先立恩,后翻仇', '"帮助"的每个细节都能反读', '主角知道真相后的反应决定后续基调'],
    tags: ['恩仇', '真相'],
    axes: { 情感虐恋: { line: ['虐恋情深'], romance: ['BE'] } },
  },
  {
    type: 'plot', genre: '情感虐恋', wild: 2, dir: ['虐心'], arc: 'opening',
    title: '替身白月光', protag: '替身主角', conflict: '主角成为反派念念不忘的"故人",而"故人"已死于他手',
    hook: '主角意外成了大反派念念不忘的"故人",而"故人"本人已死于他手。',
    open: '反派第一次见主角,愣了三秒,说:"你怎么会在这里?"——主角明明与此人素未谋面。',
    tips: ['反差的喜剧与悲情一线之隔', '冒认/被认出的处理', '反派最后的选择'],
    tags: ['白月光', '错位'],
    axes: { 情感虐恋: { line: ['替身梗'], support: ['白月光'] } },
  },
  {
    type: 'goldfinger', genre: '情感虐恋', wild: 3, dir: ['虐心'], arc: 'opening',
    title: '看见对方的寿命', protag: '寿命窥视者', conflict: '看见对方寿命=看见对方将死之时',
    hook: '主角能看见别人的寿命——而 ta 第一次看到的人是 ta 最爱的人。',
    open: '主角第一天上班(医院),看见走廊上所有人头顶都有"数字"——只有一个人头顶的数字在倒计时。',
    tips: ['看见 vs 不看见的伦理', '挽救 vs 接受', '救下来之后的代价'],
    tags: ['寿命', '伦理'],
    axes: { 情感虐恋: { line: ['暗恋成真'], support: ['火葬场'] } },
  },
  {
    type: 'plot', genre: '情感虐恋', wild: 3, dir: ['虐心'], arc: 'climax',
    title: '最后一次选择', protag: '抉择者', conflict: '救对方 = 失去自己;不救 = 失去对方',
    hook: '主角能救对方,但代价是失去自己——而对方不知道这件事。',
    open: '主角被医生告知:"你和她只能活一个,你自己选。"',
    tips: ['抉择的瞬间要慢镜头', '对方最后一句话', '事后余味的余波'],
    tags: ['抉择', '牺牲'],
    axes: { 情感虐恋: { romance: ['BE'], line: ['虐恋情深'] } },
  },
  {
    type: 'twist', genre: '情感虐恋', wild: 2, dir: ['反转'], arc: 'turn',
    title: '离婚后的真相', protag: '离婚者', conflict: '离婚后才发现,对方一直在替自己挡刀',
    hook: '主角与 ta 离婚三年,某天看见前任替自己挡下一场车祸,才明白过去所有的"冷漠"都在挡刀。',
    open: '主角在病房里看着昏迷的前任,翻开 ta 的日记:"今天又替她挡了一次。"',
    tips: ['"冷漠"的反读', '日记/信件的运用', '复合 vs 不复合的结局'],
    tags: ['误会', '真相'],
    axes: { 情感虐恋: { line: ['破镜重圆'], romance: ['先甜后虐'] } },
  },
  {
    type: 'title', genre: '情感虐恋', wild: 2, dir: ['虐心'], arc: 'resolve',
    title: '张力式书名', protag: '宿命纠缠者', conflict: '主角与某人永远错过',
    hook: '《第一百次死遁后,我成了反派的白月光》',
    open: '第一句:"这是我第一百次假死,他每一次都以为是真的。"',
    tips: ['数字+身份+关系三要素', '"死遁"的反复制造宿命感', '白月光与死遁的因果'],
    tags: ['死遁', '白月光'],
  },

  // ========== 热血争霸(8) ==========
  {
    type: 'plot', genre: '热血争霸', wild: 3, dir: ['热血', '黑暗'], arc: 'opening',
    title: '大逃杀式选拔', protag: '选拔幸存者', conflict: '只有活到最后的人才能获得机缘',
    hook: '一场宗门选拔,只有活到最后的人才能获得机缘,而规则允许"一切手段"。',
    open: '主角被推入"天梯选拔场",耳边响起规则:"三日,只活一人,胜者得机缘。"',
    tips: ['淘汰机制逼出人性', '留一个不按规则玩的主角', '围观者也是戏'],
    tags: ['选拔', '残酷'],
    axes: { 热血争霸: { arena: ['宗门争锋'], protagonist: ['废柴逆袭'], style: ['扮猪吃虎'] } },
  },
  {
    type: 'character', genre: '热血争霸', wild: 1, dir: ['热血'], arc: 'rising',
    title: '亦敌亦友', protag: '宿敌即挚友', conflict: '两人守着一个不能说的共同秘密',
    hook: '每次交锋都互相留一线,因为两人守护着同一个不能说的秘密。',
    open: '擂台赛上,主角与宿敌打得难解难分,但双方都在对方看不见的角度,用眼神指了指同一个方向。',
    tips: ['对手戏里藏默契', '共同秘密是关系的锚点', '被逼到必须二选一时'],
    tags: ['宿敌', '默契'],
    axes: { 热血争霸: { arena: ['学院争霸'], protagonist: ['世家子弟'], style: ['个人英雄'] } },
  },
  {
    type: 'goldfinger', genre: '热血争霸', wild: 2, dir: ['虐心', '爽点'], arc: 'opening',
    title: '情绪之剑', protag: '情绪剑主', conflict: '越愤怒越锋利,直到剑反噬情绪',
    hook: '一柄随主人情绪变强的剑:越愤怒越锋利,越绝望越霸道——直到某天,剑反噬情绪。',
    open: '主角第一次挥剑杀人,剑身闪过的红光比当时夕阳还艳——从那以后,主角越来越容易愤怒。',
    tips: ['情绪与战力的绑定', '冷静时反而弱的反差', '剑灵与主人共情'],
    tags: ['情绪', '剑'],
    axes: { 热血争霸: { growth: ['炼体炼神'] } },
  },
  {
    type: 'world', genre: '热血争霸', wild: 2, dir: ['热血'], arc: 'rising',
    title: '万族格局', protag: '人族崛起者', conflict: '万族各有疆域,人族夹缝求生',
    hook: '人族之外,妖族、魔族、龙族、魂族各有疆域与图谋,一场万族博弈。',
    open: '主角在边境小城第一次看见"妖族使节团"过境,主角被推为"人族代表"向使节行礼——使节低头笑他。',
    tips: ['各族立场的利益逻辑要自洽', '主角的种族身份可能是隐藏牌', '边界战争与暗流交易'],
    tags: ['万族', '种族'],
    axes: { 热血争霸: { arena: ['国家战场'], style: ['团队配合'] } },
  },
  {
    type: 'plot', genre: '热血争霸', wild: 3, dir: ['热血'], arc: 'climax',
    title: '最终战', protag: '孤注一掷者', conflict: '所有筹码推上桌,胜负一念间',
    hook: '主角集结了所有盟友,准备与最大反派决战——但决战前夜,一个关键盟友叛变。',
    open: '决战当夜,主角发现军帐被人打开——里面少了一个最不该少的人。',
    tips: ['叛变的动机', '缺一人如何补', '决战的代价'],
    tags: ['决战', '代价'],
    axes: { 热血争霸: { arena: ['国家战场'], style: ['个人英雄'] } },
  },
  {
    type: 'twist', genre: '热血争霸', wild: 3, dir: ['反转'], arc: 'turn',
    title: '英雄即罪人', protag: '反思英雄', conflict: '主角被尊为英雄,但 ta 的"英雄事迹"其实是残害同族',
    hook: '主角被尊为"人族的英雄",但 ta 不知道当年的"英雄事迹",其实是 ta 被设计陷害了同族。',
    open: '主角在颁奖典礼上,看见台下坐着一个被自己"亲手斩杀"的"敌人"——还活着。',
    tips: ['被陷害的层层线索', '"英雄"光环的反读', '重新定义主角的过去'],
    tags: ['反思', '陷害'],
    axes: { 热血争霸: { arena: ['国家战场'], mood: ['压抑'] } },
  },
  {
    type: 'character', genre: '热血争霸', wild: 1, dir: ['热血'], arc: 'rising',
    title: '团队核心', protag: '团长', conflict: '主角必须把一盘散沙拧成一股绳',
    hook: '主角接手一支"散兵游勇"组成的队伍,要在三个月内把他们带成冠军。',
    open: '主角第一次看见自己的队员时,他们正在赌场上赌"三个月内团长会不会跑"。',
    tips: ['队员的过去', '第一次胜利的爽点', '团队裂痕的修复'],
    tags: ['团队', '凝聚'],
    axes: { 热血争霸: { style: ['团队配合'] } },
  },
  {
    type: 'title', genre: '热血争霸', wild: 1, dir: ['爽点'], arc: 'resolve',
    title: '时间式书名', protag: '归来者', conflict: '归来后,世界已不认识 ta',
    hook: '《三年后归来,我已无敌于天下》',
    open: '第一句:"三年了,我从山门走出,城内已无人识得我的脸——也好,没人打扰。"',
    tips: ['时间跨度=成长悬念', '归来后的第一个打脸对象', '"无敌"背后的代价留一手'],
    tags: ['归来', '无敌'],
  },

  // ========== 轻松日常(8) ==========
  {
    type: 'plot', genre: '轻松日常', wild: 3, dir: ['爽点', '沙雕'], arc: 'opening',
    title: '降维打击', protag: '穿越者', conflict: '用现代思维打穿异世界,但也打穿了自己的生活',
    hook: '主角把现代商业模式、黑科技思维带入异世界,形成降维打击。',
    open: '主角在异世界第一次摆摊,推出"外卖服务"——第一个订单来自隔壁剑圣。',
    tips: ['可以设计"灵石定价权""宗门上市"等名场面', '用一本正经的运营逻辑解释怪象', '给打击对象留点智商'],
    tags: ['穿越', '商业'],
    axes: { 轻松日常: { scene: ['异世界日常'], protagonist: ['穿越者'], style: ['沙雕玩梗'] } },
  },
  {
    type: 'world', genre: '轻松日常', wild: 1, dir: ['沙雕'], arc: 'rising',
    title: '灵石经济学', protag: '灵石商人', conflict: '修仙界经济危机,主角作为小商人被卷入',
    hook: '修仙界也有完整的经济体系:灵石会通胀,宗门也会破产。',
    open: '主角的杂货铺今早收到官府通知:"灵石税率提升 50%,本季度灵石贬值 30%。"',
    tips: ['用经济学解释宗门兴衰', '主角的商战名场面', '"穷人靠变异,富人靠灵石"'],
    tags: ['经济', '体系'],
    axes: { 轻松日常: { scene: ['开店经营'], protagonist: ['穿越者'], style: ['搞笑吐槽'] } },
  },
  {
    type: 'character', genre: '轻松日常', wild: 2, dir: ['沙雕'], arc: 'rising',
    title: '全能打工魂', protag: '打工人', conflict: '打工打到异世界,打工魂不灭',
    hook: '主角穿越成异世界的"打工人",用现代职场技能混得风生水起。',
    open: '主角在异世界第一份工作(宗门杂役),第一周就被长老夸:"这个月报写得像 KPI。"',
    tips: ['职场梗的精准使用', '异世界的"老板"与"同事"', '打工与修仙的边界'],
    tags: ['打工', '职场'],
    axes: { 轻松日常: { scene: ['异世界日常'], style: ['搞笑吐槽'] } },
  },
  {
    type: 'goldfinger', genre: '轻松日常', wild: 3, dir: ['沙雕'], arc: 'opening',
    title: '系统给的奇葩任务', protag: '系统玩家', conflict: '系统的任务是让主角活成沙雕',
    hook: '主角的"系统"任务全是奇葩小事:捡一根羽毛、扶一个老奶奶、给师弟送外卖。',
    open: '主角第一次接到系统任务:"扶门口的扫地老爷爷过马路"——老爷爷是宗门长老。',
    tips: ['任务表是笑点', '小任务的连环后果', '系统本体现身时'],
    tags: ['系统', '奇葩'],
    axes: { 轻松日常: { style: ['沙雕玩梗'] } },
  },
  {
    type: 'plot', genre: '轻松日常', wild: 2, dir: ['治愈'], arc: 'climax',
    title: '一日小店', protag: '小店主', conflict: '小店要关门了,主角要让最后一天有人来',
    hook: '主角的家族小店要关门了,主角决定:在最后一天,把所有熟客都召回来。',
    open: '主角把"老客召回"的小卡片塞进所有门缝里——当晚,门缝里又塞回了 100 张卡片。',
    tips: ['熟客的过去闪回', '小店与城市的纽带', '关门 vs 留下的小决定'],
    tags: ['小店', '温情'],
    axes: { 轻松日常: { scene: ['开店经营'], style: ['日常温情'] } },
  },
  {
    type: 'twist', genre: '轻松日常', wild: 3, dir: ['沙雕', '反转'], arc: 'turn',
    title: '沙雕反转', protag: '反转沙雕', conflict: '沙雕剧情的尽头,有一个认真的反转',
    hook: '主角一直以为自己的故事是沙雕日常,直到发现这一切背后是一场大型沙雕营销。',
    open: '主角在街头被一个"神秘顾客"买走所有商品,神秘顾客笑:"剧情需要,配合一下。"',
    tips: ['沙雕的节奏', '反转要克制', '反转后回归沙雕'],
    tags: ['反转', '沙雕'],
    axes: { 轻松日常: { style: ['沙雕玩梗'] } },
  },
  {
    type: 'world', genre: '轻松日常', wild: 1, dir: ['治愈'], arc: 'rising',
    title: '猫猫咖啡馆', protag: '馆长', conflict: '主角的猫会说话,只有主角能听见',
    hook: '主角开了家猫猫咖啡馆,猫会说话——只有主角能听见,所以大家都以为主角自言自语。',
    open: '主角第一天开店,橘猫迎宾时说:"你迟到了 3 分钟,扣工资。"',
    tips: ['猫视角的吐槽', '客人与猫的互动', '猫的"秘密"'],
    tags: ['猫', '治愈'],
    axes: { 轻松日常: { scene: ['开店经营'], style: ['日常温情'] } },
  },
  {
    type: 'title', genre: '轻松日常', wild: 3, dir: ['沙雕'], arc: 'resolve',
    title: '反差式书名', protag: '反差萌主角', conflict: '反差越大钩子越强',
    hook: '《我在修仙界开连锁火锅店》',
    open: `第一句:"我开第一家火锅店时,店名叫'凡人居'——三个月后,仙门弟子占七成。"`,
    tips: ['反差越大钩子越强', '确定修仙元素与日常元素的碰撞点', '主业(火锅店)如何推动主线'],
    tags: ['反差', '日常'],
  },

  // ========== 暗黑权谋(8) ==========
  {
    type: 'plot', genre: '暗黑权谋', wild: 2, dir: ['虐心', '反转'], arc: 'rising',
    title: '最信任的人', protag: '被监视者', conflict: '最信任的人一直在奉命监视,ta 的任务已开始动摇',
    hook: '主角最信任的那个人,其实一直奉命监视他——而ta的"任务",早已开始动摇。',
    open: '主角深夜推开书房,发现挚友正看着自己的日记——挚友说:"我能解释,真的。"',
    tips: ['先写足信任的厚度,背叛才有重量', '监视者的动摇是情感线入口', '监视者背后是谁?'],
    tags: ['背叛', '信任'],
    axes: { 暗黑权谋: { arena: ['官场风云'], protagonist: ['隐忍复仇者'], strategy: ['心理博弈'] } },
  },
  {
    type: 'plot', genre: '暗黑权谋', wild: 2, dir: ['悬疑', '黑暗'], arc: 'turn',
    title: '死局中的活路', protag: '绝境破局者', conflict: '必死之局里,有人早替他铺好后路',
    hook: '主角陷入必死之局,却在绝境中发现——有人早就替他把后路铺好了。',
    open: '主角被押赴刑场,刽子手举刀瞬间,主角手里的木牌亮了一下——上面刻着"等三息"。',
    tips: ['铺垫必须"看不见",复盘才惊艳', '铺路人是敌是友?', '后路的尽头是否又是一层局?'],
    tags: ['布局', '绝境'],
    axes: { 暗黑权谋: { arena: ['宫廷内斗'], protagonist: ['谋士'], strategy: ['布局十年'] } },
  },
  {
    type: 'character', genre: '暗黑权谋', wild: 2, dir: ['反转'], arc: 'rising',
    title: '双面大能', protag: '双面权臣', conflict: '白天温润如玉,入夜后是另一个杀伐果决的身份',
    hook: '白天温润如玉的长者,入夜后是另一个杀伐果决的身份。',
    open: '主角白天刚听完长者的教诲,深夜在赌坊看见长者——长者瞥了主角一眼,笑:"你是来替谁办事?"',
    tips: ['两个身份必须有内在统一性', '切换的触发条件要冷酷', '被撞破的那一刻是名场面'],
    tags: ['双面', '身份'],
    axes: { 暗黑权谋: { protagonist: ['权臣'], strategy: ['翻云覆雨'] } },
  },
  {
    type: 'twist', genre: '暗黑权谋', wild: 2, dir: ['反转', '黑暗'], arc: 'turn',
    title: '正道即魔道', protag: '伪装受害者', conflict: '世人敬仰的正道魁首,才是真正的魔道源头',
    hook: '世人敬仰的正道魁首,才是真正的魔道源头——伪装成屠龙者,只为独占恶龙。',
    open: '主角卧底正道组织十年,晋升到副手级别时,看见自己师父与"恶龙"同桌饮茶。',
    tips: ['伪善要演出真善的质感', '邪派中反而藏真善', '揭露的力度与代价'],
    tags: ['伪善', '立场'],
    axes: { 暗黑权谋: { arena: ['家族内斗'], protagonist: ['隐忍复仇者'], strategy: ['阳谋正对'] } },
  },
  {
    type: 'plot', genre: '暗黑权谋', wild: 3, dir: ['黑暗'], arc: 'climax',
    title: '一网打尽', protag: '一网打尽者', conflict: '主角要一网打尽,但自己也可能是网中鱼',
    hook: '主角精心设计一网打尽的局,最后发现自己才是被一网打尽的那条鱼。',
    open: '主角在庆功宴上举杯,看见对面所有"敌人"都在笑——他们彼此举杯的方向,都是主角。',
    tips: ['陷阱的层层叠叠', '主角的觉醒时刻', '反杀的成本'],
    tags: ['一网打尽', '陷阱'],
    axes: { 暗黑权谋: { arena: ['宫廷内斗'], strategy: ['翻云覆雨'] } },
  },
  {
    type: 'world', genre: '暗黑权谋', wild: 1, dir: ['黑暗'], arc: 'rising',
    title: '权谋棋局', protag: '棋子觉醒者', conflict: '棋盘上每颗棋子都有思想,主角必须说服它们',
    hook: '主角成为一盘大型权谋棋局的执棋者,但棋盘上的"棋子"都有自己的意志。',
    open: '主角第一天执棋,把一颗"弃子"送出——这颗子说:"我家人,求你了。"',
    tips: ['棋子的故事', '执棋者的代价', '棋局外的更高棋局'],
    tags: ['棋局', '棋子'],
    axes: { 暗黑权谋: { strategy: ['阴谋诡计'] } },
  },
  {
    type: 'twist', genre: '暗黑权谋', wild: 3, dir: ['悬疑'], arc: 'turn',
    title: '黄雀在后', protag: '被观察者', conflict: '主角以为自己是猎人,实则是被观察的棋子',
    hook: '主角以为自己已是猎人,直到发现:自己只是更高一层棋局里,被观察的棋子。',
    open: `主角精心布下的局被对方一句话拆穿,对方说:"你以为的'意外',我们准备了三年。"`,
    tips: ['层次感:一局套一局', '"更高层"先以善意出现', '主角的反制是后续主线'],
    tags: ['棋局', '幕后'],
    axes: { 暗黑权谋: { strategy: ['阴谋诡计'] } },
  },
  {
    type: 'title', genre: '暗黑权谋', wild: 1, dir: ['黑暗'], arc: 'resolve',
    title: '意象式书名', protag: '秘密守护者', conflict: '主角守护着一个不可言说的秘密',
    hook: '《千仞渊底,压着一整座王朝的秘密》',
    open: '第一句:"千仞渊底,有一个人,是我押了三十年的赌。"',
    tips: ['地名+重量级名词', '"压着"暗示封印/禁忌', '秘密的分量=主线分量'],
    tags: ['意象', '伏笔'],
  },

  // ========== 游戏系统(8) ==========
  {
    type: 'goldfinger', genre: '游戏系统', wild: 2, dir: ['悬疑', '爽点'], arc: 'opening',
    title: '回档系统', protag: '回档者', conflict: '回档次数有限,每次回档世界都在"出问题"',
    hook: '死亡后回到前一天,但回档次数有限,且每次回档,世界都在"出问题"。',
    open: '主角第一次死亡回档后,发现家里多了一株从没见过的小草——草的根系像在向外扩张。',
    tips: ['次数限制制造压迫感', '"世界出问题"是主线线索', '回档者无法改变的大事'],
    tags: ['时间', '系统'],
    axes: { 游戏系统: { cheat: ['签到奖励'] } },
  },
  {
    type: 'goldfinger', genre: '游戏系统', wild: 3, dir: ['黑暗', '反转'], arc: 'opening',
    title: '因果商店', protag: '因果交易者', conflict: '用"因果"换力量,代价是抹去一部分"存在的痕迹"',
    hook: '能用"因果"换取力量,代价是每次交易,都会从世界上抹去一部分"你存在过的痕迹"。',
    open: '主角第一次交易,代价是:没人记得主角曾经过的生日——包括主角自己。',
    tips: ['"痕迹"包括记忆、名字、他人好感', '无人记得主角时的孤独感', '最后能不能换回自己?'],
    tags: ['交易', '因果'],
    axes: { 游戏系统: { cheat: ['商城漏洞'] } },
  },
  {
    type: 'goldfinger', genre: '游戏系统', wild: 2, dir: ['爽点'], arc: 'opening',
    title: '一眼即会', protag: '复制者', conflict: '看过就学会,但每种功法一生只能用一次',
    hook: '看过别人的功法就能学会,但每种功法一生只能用一次。',
    open: '主角在宗门比武大会第一天,站在台下看了七场比武——当晚,主角就"复制"了七种绝学。',
    tips: ['"一次"的稀缺性', '收藏库的规划感', '看到仇人功法的名场面'],
    tags: ['复制', '天赋'],
    axes: { 游戏系统: { player: ['退役大神'], cheat: ['数据修改'] } },
  },
  {
    type: 'twist', genre: '游戏系统', wild: 3, dir: ['反转', '悬疑'], arc: 'turn',
    title: '金手指的真相', protag: '觉醒质疑者', conflict: '金手指其实是封印、牢笼、监视器',
    hook: '所谓"金手指",其实是一个封印、一座牢笼、一台监视器。',
    open: '主角在第 999 次使用金手指时,听见金手指说:"觉醒吧,你睡了 999 年。"',
    tips: ['金手指全程提供便利=温养宿体', '觉醒真相的瞬间,能力开始反噬', '主角反制金手指的博弈'],
    tags: ['金手指', '陷阱'],
    axes: { 游戏系统: { cheat: ['数据修改'] } },
  },
  {
    type: 'goldfinger', genre: '游戏系统', wild: 3, dir: ['反转', '悬疑'], arc: 'climax',
    title: '反向金手指', protag: '金手指觉醒者', conflict: '金手指是陷阱,主角又舍不得丢',
    hook: '看起来是逆天金手指,其实是某人精心设计的陷阱——但它太好用了,主角舍不得丢。',
    open: '主角第三次犹豫要不要丢掉金手指时,金手指哭出了声:"你舍得吗?"',
    tips: ['"好用"与"危险"的拉锯', '设计者现身时的震撼', '主角反客为主'],
    tags: ['陷阱', '博弈'],
    axes: { 游戏系统: { cheat: ['隐藏职业'] } },
  },
  {
    type: 'plot', genre: '游戏系统', wild: 1, dir: ['爽点'], arc: 'opening',
    title: '第一天开服', protag: '开服玩家', conflict: '主角是第一天开服的玩家,但游戏已经不再普通',
    hook: '主角登录"开服第一天",但 ta 不知道,这场游戏早已不是宣传片里那个游戏。',
    open: '主角上线第一个任务是"打一只小鸡"——但小鸡抬头看了主角一眼,眼神里闪过人类的神色。',
    tips: ['游戏的"异化"节奏', 'NPC 的觉醒', '玩家的觉醒'],
    tags: ['开服', '异化'],
    axes: { 游戏系统: { type: ['虚拟现实'] } },
  },
  {
    type: 'plot', genre: '游戏系统', wild: 2, dir: ['爽点', '反转'], arc: 'rising',
    title: '开挂后失忆', protag: '失忆玩家', conflict: '主角开过的所有挂,代价都是 ta 的某段记忆',
    hook: '主角开过的所有挂,代价都是 ta 的某段记忆——直到有一天,ta 把最爱的人忘掉了。',
    open: '主角最爱的人站在面前,主角却问:"你好,你是?"——而 ta 昨天才办的婚礼。',
    tips: ['记忆失而复得的情感冲击', '外挂的代价升级', '最终选择的代价'],
    tags: ['外挂', '记忆'],
    axes: { 游戏系统: { cheat: ['数据修改'] } },
  },
  {
    type: 'title', genre: '游戏系统', wild: 2, dir: ['热血'], arc: 'resolve',
    title: '身份式书名', protag: '觉醒复仇者', conflict: '觉醒之夜 = 复仇之夜',
    hook: '《宗门被灭那晚,我觉醒了 SSS 级天赋》',
    open: `第一句:"宗门被灭那晚,我跪在废墟里,系统提示:'恭喜觉醒 SSS 级天赋——代价是灭门真相。'"`,
    tips: ['灭门之夜=觉醒之夜', '天赋等级体系亮明', '复仇线即刻启动'],
    tags: ['觉醒', '复仇'],
  },
];

/* ======================== 工具函数 ======================== */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 题材轴匹配:用户在某 genre 下选了 axes,种子在该 genre 下的 axes 必须与之一致或子集 */
function matchesAxes(
  genre: InspirationGenre,
  seedAxes: SeedAxes | undefined,
  axisSelections: AxisSelections | undefined
): boolean {
  if (!axisSelections) return true;
  const userForGenre = axisSelections[genre];
  if (!userForGenre || Object.keys(userForGenre).length === 0) return true;
  if (!seedAxes) return true;
  const seedForGenre = seedAxes[genre];
  if (!seedForGenre) return true;
  for (const [axisKey, userValues] of Object.entries(userForGenre)) {
    if (!userValues || userValues.length === 0) continue;
    const seedValues = seedForGenre[axisKey];
    if (!seedValues || seedValues.length === 0) continue;
    if (!userValues.some((v) => seedValues.includes(v))) return false;
  }
  return true;
}

/** 种子与用户轴选项的命中数加权(用于定向打分) */
function scoreAxes(
  seedAxes: SeedAxes | undefined,
  genre: InspirationGenre,
  axisSelections: AxisSelections | undefined
): number {
  if (!axisSelections || !seedAxes) return 0;
  const userForGenre = axisSelections[genre];
  if (!userForGenre) return 0;
  const seedForGenre = seedAxes[genre];
  if (!seedForGenre) return 0;
  let score = 0;
  for (const [axisKey, userValues] of Object.entries(userForGenre)) {
    if (!userValues || userValues.length === 0) continue;
    const seedValues = seedForGenre[axisKey] || [];
    if (seedValues.length === 0) continue;
    const overlap = userValues.filter((v) => seedValues.includes(v)).length;
    score += overlap * 3;
  }
  return score;
}

/** 种子与输入的相关度打分(子串 + 题材轴命中) */
function scoreSeed(seed: InspirationSeed, tokens: string[], material: string, axisSelections: AxisSelections | undefined): number {
  const text = [seed.title, seed.hook, seed.open, seed.genre, ...seed.tags].join(' ');
  let score = 0;
  for (const t of tokens) {
    if (text.includes(t)) score += t.length * t.length;
    if (material && material.includes(t)) score += t.length * 2;
  }
  score += scoreAxes(seed.axes, seed.genre, axisSelections);
  return score;
}

/* ======================== 过滤与诊断 ======================== */

export interface PoolDiagnostic {
  /** 最终过滤后的种子数 */
  poolSize: number;
  /** 是否退回了题材限定 */
  genresRelaxed: boolean;
  /** 是否退回了脑洞程度 */
  wildnessRelaxed: boolean;
  /** 是否退回了风格方向 */
  directionsRelaxed: boolean;
  /** 是否退回了轴细化 */
  axesRelaxed: boolean;
  /** 警告信息(给 UI 提示) */
  warnings: string[];
}

/** 按配置过滤种子池,返回诊断信息(告诉调用方是否被回退) */
function filterPoolWithDiagnostic(config: InspirationConfig): { pool: InspirationSeed[]; diag: PoolDiagnostic } {
  const diag: PoolDiagnostic = {
    poolSize: 0, genresRelaxed: false, wildnessRelaxed: false,
    directionsRelaxed: false, axesRelaxed: false, warnings: [],
  };

  let pool = SEEDS.filter((s) => s.wild <= config.wildness);
  if (pool.length === 0) {
    pool = SEEDS;
    diag.wildnessRelaxed = true;
    diag.warnings.push(`脑洞等级 ${config.wildness} 下没有种子,已放开展示所有脑洞级别`);
  }

  if (config.directions.length > 0) {
    const filtered = pool.filter((s) => s.dir.some((d) => config.directions.includes(d)));
    if (filtered.length === 0) {
      diag.directionsRelaxed = true;
      diag.warnings.push(`风格 ${config.directions.join('+')} 下没有种子,已退回全部风格`);
    } else {
      pool = filtered;
    }
  }

  if (config.genres.length > 0) {
    const filtered = pool.filter((s) => config.genres.includes(s.genre));
    if (filtered.length === 0) {
      diag.genresRelaxed = true;
      diag.warnings.push(`题材 ${config.genres.join('+')} 下没有种子,已退回全部题材`);
    } else {
      pool = filtered;
    }
  }

  if (config.axisSelections && config.genres.length > 0 && !diag.genresRelaxed) {
    const filtered = pool.filter((s) => matchesAxes(s.genre, s.axes, config.axisSelections));
    if (filtered.length === 0) {
      diag.axesRelaxed = true;
      diag.warnings.push(`当前题材档案下没有匹配的种子,已忽略轴细化`);
    } else {
      pool = filtered;
    }
  }

  diag.poolSize = pool.length;
  return { pool, diag };
}

/* ======================== 工具:Codex 联动 ======================== */

/** 用 Codex 档案名填充模板中的 {name}/{place} 占位符 */
function fillCodex(seed: InspirationSeed, codex: CodexEntry[]): { title: string; hook: string; open: string; refs: string[] } {
  const refs: string[] = [];
  const names = codex.filter((e) => e.type === 'character').map((e) => e.name);
  const places = codex.filter((e) => e.type === 'location').map((e) => e.name);
  const pick = (arr: string[], fallback: string) => {
    if (arr.length === 0) return fallback;
    const v = arr[Math.floor(Math.random() * arr.length)];
    refs.push(v);
    return v;
  };
  const fill = (s: string) =>
    s
      .replace(/\{name\}/g, () => pick(names, '沈墨尘'))
      .replace(/\{place\}/g, () => pick(places, '千仞渊'));
  return { title: fill(seed.title), hook: fill(seed.hook), open: fill(seed.open), refs };
}

function toCard(seed: InspirationSeed, ctx: InspirationContext, codexLinked: boolean): InspirationCard {
  const codex = ctx.codex ?? [];
  const { title, hook, open, refs } = codexLinked && codex.length > 0
    ? fillCodex(seed, codex)
    : { title: seed.title, hook: seed.hook, open: seed.open, refs: [] };
  return {
    id: nextId('ins'),
    type: seed.type,
    genre: seed.genre,
    title,
    hook,
    tips: seed.tips,
    tags: [...seed.dir, ...seed.tags],
    codexRefs: refs.length ? [...new Set(refs)] : undefined,
    axes: seed.axes,
    arcRole: seed.arc,
    protagonist: seed.protag,
    conflict: seed.conflict,
    openAction: open,
    source: 'ai',
    createdAt: Date.now(),
  };
}

/* ======================== 故事弧感知抽卡 ======================== */

export interface InspirationContext {
  /** 当前场景信息(定向灵感加权) */
  scene?: { title: string; pov: string; location: string; mood: string; labels: string[] };
  /** Codex 档案池(用于联动替换占位符) */
  codex?: CodexEntry[];
  /** 作者输入的意图文本(定向灵感的核心输入) */
  input?: string;
  /** 融入灵感池已收藏的灵感作为素材信号 */
  usePool?: boolean;
  /** 灵感池卡片(usePool 时传入) */
  poolCards?: InspirationCard[];
}

/** 按 arcRole 分组种子,后续按 5 个弧位取代表 */
function groupByArc(pool: InspirationSeed[]): Map<ArcRole, InspirationSeed[]> {
  const map = new Map<ArcRole, InspirationSeed[]>();
  pool.forEach((s) => {
    const arr = map.get(s.arc) ?? [];
    arr.push(s);
    map.set(s.arc, arr);
  });
  return map;
}

/** 优先覆盖未出现的 arcRole,保证多张卡 = 一段完整故事弧 */
function pickByArcPriority(
  byArc: Map<ArcRole, InspirationSeed[]>,
  count: number
): InspirationSeed[] {
  const arcOrder: ArcRole[] = ['opening', 'rising', 'turn', 'climax', 'resolve'];
  const picked: InspirationSeed[] = [];
  const used = new Set<InspirationSeed>();

  // 第一轮:每个弧位优先取 1 张
  for (const arc of arcOrder) {
    if (picked.length >= count) break;
    const arr = (byArc.get(arc) ?? []).filter((s) => !used.has(s));
    if (arr.length > 0) {
      const chosen = arr[Math.floor(Math.random() * arr.length)];
      picked.push(chosen);
      used.add(chosen);
    }
  }
  // 第二轮:补足缺口,优先 type 不同
  if (picked.length < count) {
    const remaining = shuffle(
      [...byArc.values()].flat().filter((s) => !used.has(s))
    );
    const typesPicked = new Set(picked.map((p) => p.type));
    for (const s of remaining) {
      if (picked.length >= count) break;
      if (!typesPicked.has(s.type)) {
        picked.push(s);
        used.add(s);
        typesPicked.add(s.type);
      }
    }
  }
  // 第三轮:仍不足,任意补
  if (picked.length < count) {
    const remaining = shuffle(
      [...byArc.values()].flat().filter((s) => !used.has(s))
    );
    for (const s of remaining) {
      if (picked.length >= count) break;
      picked.push(s);
      used.add(s);
    }
  }
  return picked.slice(0, count);
}

/* ======================== 算法一:盲盒抽卡(零输入随机探索) ======================== */

export interface DrawResult {
  cards: InspirationCard[];
  diagnostic: PoolDiagnostic;
}

export function drawInspirationCards(config: InspirationConfig, ctx: InspirationContext = {}): DrawResult {
  const { pool, diag } = filterPoolWithDiagnostic(config);
  const byArc = groupByArc(pool);
  const picked = pickByArcPriority(byArc, config.count);
  const cards = picked.map((s) => toCard(s, ctx, config.codexLinked));
  return { cards, diagnostic: diag };
}

/* ======================== 算法二:命题定向 ======================== */

/** 定向生成:输入驱动 + 题材/轴过滤 + 场景加权 + 素材融入,保证弧位覆盖 */
export function targetedInspirationCards(
  config: InspirationConfig,
  ctx: InspirationContext = {},
  count = 3
): { cards: InspirationCard[]; diagnostic: PoolDiagnostic } {
  const { pool, diag } = filterPoolWithDiagnostic(config);
  const tokens = extractTokens(ctx.input ?? '');
  const material = ctx.usePool && ctx.poolCards?.length
    ? ctx.poolCards.map((c) => `${c.title} ${c.hook} ${c.tags.join(' ')}`).join(' ')
    : '';

  // 给每颗种子打分;无输入时退化为随机
  const scored: { s: InspirationSeed; score: number }[] = pool.map((s) => {
    let score = tokens.length ? scoreSeed(s, tokens, material, config.axisSelections) : Math.random();
    if (ctx.scene) {
      if (ctx.scene.pov && (s.title + s.hook + s.open).includes(ctx.scene.pov)) score += 4;
      if (ctx.scene.location && (s.title + s.hook + s.open).includes(ctx.scene.location)) score += 3;
      if (s.tags.some((t) => ctx.scene!.labels.includes(t))) score += 2;
      if (ctx.scene.mood && s.tags.includes(ctx.scene.mood)) score += 1;
    }
    return { s, score };
  });

  // 按 arc 分组取最高分,保证产出弧位覆盖
  const byArc = new Map<ArcRole, typeof scored>();
  scored.forEach((it) => {
    const arr = byArc.get(it.s.arc) ?? [];
    arr.push(it);
    byArc.set(it.s.arc, arr);
  });

  const picked: InspirationSeed[] = [];
  const arcOrder: ArcRole[] = ['opening', 'rising', 'turn', 'climax', 'resolve'];
  let need = count;
  for (const arc of arcOrder) {
    if (need <= 0) break;
    const best = (byArc.get(arc) ?? []).sort((a, b) => b.score - a.score)[0];
    if (best) {
      picked.push(best.s);
      need--;
    }
  }
  if (need > 0) {
    scored
      .filter((it) => !picked.includes(it.s))
      .sort((a, b) => b.score - a.score)
      .slice(0, need)
      .forEach((it) => picked.push(it.s));
  }

  const cards = picked.slice(0, count).map((s) => toCard(s, ctx, config.codexLinked));
  return { cards, diagnostic: diag };
}

/** 获取某类型的中文标签 */
export function inspirationTypeLabel(t: InspirationType): string {
  return INSPIRATION_TYPE_META[t].label;
}

/** 从输入文本提取 2-5 字连续子串作为关键词(中文启发式) */
function extractTokens(input: string): string[] {
  const s = input.replace(/[\s，。！？、,.!?;；:：'"“”‘’()（）《》【】\-—]+/g, '');
  if (s.length < 2) return [];
  const tokens = new Set<string>();
  for (let len = 5; len >= 2; len--) {
    for (let i = 0; i + len <= s.length; i++) tokens.add(s.slice(i, i + len));
  }
  return [...tokens];
}