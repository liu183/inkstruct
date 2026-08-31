import type { InspirationGenre } from '../types';

/**
 * 题材档案 —— 每种题材专属的细粒度创作维度
 *
 * 设计原则:对真正影响创作的维度建模,而非泛泛分类标签。
 * 例:科幻末世 = 末世类型/风格/主角定位/能力来源/基调,
 *     与情感虐恋 = 时代/情感线/主角设定/情感基调/配角套路
 * 完全不同 —— 这才是专业的"题材参数"。
 */

export interface GenreAxis {
  /** 轴唯一 key */
  key: string;
  /** 轴显示标签 */
  label: string;
  /** 轴说明 */
  description?: string;
  /** 选项列表(值同时作为显示文本) */
  options: string[];
}

/** 每个题材的轴集合 */
export type GenreAxesMap = Record<InspirationGenre, GenreAxis[]>;

export const GENRE_AXES: GenreAxesMap = {
  仙侠玄幻: [
    { key: 'system', label: '修真体系', description: '世界观下的境界/修炼路径', options: ['练气筑基', '金丹元婴', '化神飞升', '洪荒封神', '仙武双修'] },
    { key: 'origin', label: '主角出身', options: ['废柴逆袭', '天才陨落', '凡人崛起', '重生者', '穿越者', '散修'] },
    { key: 'cheat', label: '金手指', options: ['系统签到', '血脉觉醒', '残缺传承', '老爷爷', '悟性逆天', '神秘宝镜'] },
    { key: 'power', label: '势力格局', options: ['宗门林立', '皇朝更替', '散修游历', '家族兴衰', '仙门争锋'] },
    { key: 'romance', label: '情感基调', options: ['无CP', '单女主', '单男主', '多女主', '虐恋情深', '甜宠'] },
  ],
  都市异能: [
    { key: 'city', label: '都市背景', options: ['校园', '职场商战', '娱乐圈', '古玩鉴宝', '都市修真'] },
    { key: 'protagonist', label: '主角定位', options: ['普通人觉醒', '重生者', '穿越者', '系统宿主', '隐藏大佬', '富二代'] },
    { key: 'cheat', label: '异能来源', options: ['血脉觉醒', '神秘传承', '系统赋予', '黑科技', '签到抽奖'] },
    { key: 'romance', label: '情感基调', options: ['甜宠', '扮猪吃虎', '复仇', '成长', '搞笑日常'] },
    { key: 'theme', label: '核心主题', options: ['复仇', '崛起', '装逼打脸', '鉴宝', '风水玄学', '神医'] },
  ],
  科幻末世: [
    { key: 'disaster', label: '末世类型', description: '灾变/末世形态', options: ['丧尸围城', '极寒天灾', '变异生物', 'AI觉醒', '异星入侵', '废土求生'] },
    { key: 'style', label: '风格', options: ['硬科幻', '软科幻', '废土', '赛博朋克', '星际探索', '反乌托邦'] },
    { key: 'protagonist', label: '主角定位', options: ['普通幸存者', '觉醒者', '重生者', '系统宿主', 'AI共生', '军方背景'] },
    { key: 'cheat', label: '能力来源', options: ['科技侧', '变异血脉', '系统流', '装备流', '精神力', '基因改造'] },
    { key: 'mood', label: '基调', options: ['压抑冷酷', '末世温情', '希望崛起', '人性反思', '史诗感'] },
  ],
  历史架空: [
    { key: 'era', label: '时代', options: ['春秋战国', '秦汉', '三国', '唐宋', '明清', '架空'] },
    { key: 'protagonist', label: '主角身份', options: ['寒门书生', '世家公子', '武将', '谋士', '重生者', '穿越者', '皇子'] },
    { key: 'cut', label: '切入点', options: ['庙堂权谋', '江湖门派', '家族兴衰', '边境战事', '商战经济', '科举仕途'] },
    { key: 'cheat', label: '金手指', options: ['现代知识', '预知梦', '历史异能', '系统', '神童天赋'] },
    { key: 'style', label: '风格', options: ['正剧史诗', '权谋博弈', '战争热血', '轻松种田', '悲剧英雄'] },
  ],
  悬疑惊悚: [
    { key: 'subtype', label: '类型', options: ['本格推理', '社会派', '刑侦', '灵异', '心理悬疑', '犯罪实录'] },
    { key: 'case', label: '案件主题', options: ['密室杀人', '连环杀手', '失踪悬案', '古宅秘辛', '校园迷踪', '都市怪谈'] },
    { key: 'protagonist', label: '主角定位', options: ['私家侦探', '警察', '法医', '记者', '平民卷入', '特殊顾问'] },
    { key: 'method', label: '推理方式', options: ['逻辑推理', '直觉敏锐', '法证科技', '异能辅助', '读心术'] },
    { key: 'mood', label: '基调', options: ['烧脑', '暗黑', '压抑', '阴森', '人性拷问'] },
  ],
  情感虐恋: [
    { key: 'era', label: '时代背景', options: ['现代都市', '民国风华', '古代宫廷', '校园', '职场', '异国'] },
    { key: 'line', label: '情感线', options: ['虐恋情深', '破镜重圆', '暗恋成真', '青梅竹马', '先婚后爱', '相爱相杀', '替身梗'] },
    { key: 'protagonist', label: '主角设定', options: ['灰姑娘', '高干子弟', '总裁', '灰公子', '京圈大小姐', '古装女主'] },
    { key: 'romance', label: '情感基调', options: ['甜宠', '虐心', '先甜后虐', 'HE', 'BE', 'OE', '暗恋'] },
    { key: 'support', label: '配角套路', options: ['恶毒女配', '白月光', '朱砂痣', '替身梗', '火葬场', '追妻火葬场'] },
  ],
  热血争霸: [
    { key: 'arena', label: '争霸舞台', options: ['江湖门派', '武林大会', '国家战场', '学院争霸', '星际战场', '宗门争锋'] },
    { key: 'protagonist', label: '主角出身', options: ['草根崛起', '世家子弟', '王族后裔', '隐世高人', '废柴逆袭', '天才陨落'] },
    { key: 'style', label: '风格定位', options: ['扮猪吃虎', '装逼打脸', '一路碾压', '团队配合', '个人英雄', '以智取胜'] },
    { key: 'growth', label: '成长线', options: ['升级打怪', '觉醒血脉', '拜师学艺', '自创功法', '炼体炼神', '夺宝奇兵'] },
    { key: 'romance', label: '情感', options: ['无CP', '单女主', '单男主', '多女主', '群像', '虐恋情深'] },
  ],
  轻松日常: [
    { key: 'scene', label: '场景', options: ['校园', '职场', '家庭', '萌宠', '开店经营', '田园生活', '异世界日常'] },
    { key: 'protagonist', label: '主角定位', options: ['普通人', '天才', '特殊身份', '退休大佬', '转生者', '穿越者'] },
    { key: 'style', label: '风格', options: ['温馨治愈', '搞笑吐槽', '沙雕玩梗', '美食生活', '养娃日常', '动物伙伴'] },
    { key: 'theme', label: '主题', options: ['日常琐事', '美食烹饪', '萌宠互动', '恋爱心动', '开店经营', '种田休闲'] },
    { key: 'pace', label: '节奏', options: ['慢热日常', '中速推进', '快节奏', '单元剧'] },
  ],
  暗黑权谋: [
    { key: 'arena', label: '舞台', options: ['宫廷内斗', '官场风云', '家族内斗', '江湖门派', '教会势力', '财阀博弈'] },
    { key: 'protagonist', label: '主角定位', options: ['谋士', '权臣', '重生者', '穿越者', '系统宿主', '隐忍复仇者'] },
    { key: 'strategy', label: '智斗风格', options: ['厚黑学', '阴谋诡计', '阳谋正对', '心理博弈', '翻云覆雨', '布局十年'] },
    { key: 'mood', label: '基调', options: ['腹黑', '冷酷', '深沉', '悲剧史诗', '血雨腥风'] },
    { key: 'theme', label: '主题', options: ['复仇', '夺嫡', '篡位', '商战', '教派之争', '谍战暗战'] },
  ],
  游戏系统: [
    { key: 'subtype', label: '游戏类型', options: ['全息网游', '重生游戏', '穿越游戏', '数据流', '电竞', '卡牌', '模拟经营', '解谜'] },
    { key: 'setting', label: '题材风格', options: ['奇幻', '武侠', '仙侠', '都市', '科幻', '末日', '历史'] },
    { key: 'player', label: '玩家定位', options: ['肝帝', '欧皇', '工作室', '萌新', '职业选手', '退役大神', 'NPC觉醒'] },
    { key: 'cheat', label: '金手指', options: ['签到奖励', '抽奖系统', '副本首通', '主线任务', '商城漏洞', '数据修改', '隐藏职业'] },
    { key: 'thrill', label: '爽点', options: ['升级如飞', '神装掉落', '装逼打脸', '攻略女主', '首杀BOSS', '拍卖豪夺'] },
  ],
};

/** 用户的题材轴选择:{ genre: { axisKey: [values] } } */
export type AxisSelections = Partial<Record<InspirationGenre, Record<string, string[]>>>;

/** 种子在该题材下的轴标注(部分标注 / 不标注 → 视为该轴通配) */
export type SeedAxes = Partial<Record<InspirationGenre, Record<string, string[]>>>;