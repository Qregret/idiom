import { Category, Word } from './types';

export const CATEGORIES: Category[] = [
  { id: 'all', name: '全部词库', icon: 'BookOpen', wordCount: 456, learnedCount: 120, color: '#3B82F6' },
  { id: '1', name: '高频核心', icon: 'Scale', wordCount: 156, learnedCount: 85, color: '#EF4444' },
  { id: '2', name: '低频词典', icon: 'TrendingUp', wordCount: 200, learnedCount: 30, color: '#F59E0B' },
];

export const MOCK_WORDS: Word[] = [
  {
    "word": "大相径庭",
    "explanation": "形容彼此相差很远或矛盾很大。",
    "frequency": 38,
    "example": "虽然两人最初的设想相同，但实际结果却大相径庭。"
  },
  {
    "word": "天马行空",
    "explanation": "比喻诗文书法等气势豪放，不拘一格，流畅自然。也指思维的不同寻常的跳跃。还指不切实际的想法",
    "frequency": 36,
    "example": "这位画家的构思天马行空，令人赞叹不已。"
  },
  {
    "word": "南辕北辙",
    "explanation": "行动和目的相反，方向完全不一致。",
    "frequency": 35,
    "example": "如果你不改变学习方法，只会南辕北辙，离目标越来越远。"
  },
  {
    "word": "层出不穷",
    "explanation": "接连不断地出现，没有穷尽。",
    "frequency": 35,
    "example": "社会上各种新事物层出不穷，我们要不断学习新知识。"
  },
  {
    "word": "相得益彰",
    "explanation": "互相配合、互相衬托，使双方优点更加明显。",
    "frequency": 33,
    "example": "背景音乐与画面相得益彰，营造出了别具一格的意境。"
  },
  {
    "word": "相辅相成",
    "explanation": "互相辅助、互相促成，缺一不可。",
    "frequency": 33,
    "example": "理论与实践是相辅相成的，二者密不可分。"
  },
  {
    "word": "推陈出新",
    "explanation": "去掉旧事物的糟粕，吸收精华，创造新的东西。",
    "frequency": 30,
    "example": "在文学创作上，既要继承传统，又要推陈出新。"
  },
  {
    "word": "一蹴而就",
    "explanation": "蹴，踏；就，成功。踏一步就成功。比喻事情轻而易举，一下子就成功",
    "frequency": 29,
    "example": "成功不是一蹴而就的，需要长期的坚持和努力。"
  },
  {
    "word": "未雨绸缪",
    "explanation": "比喻事先做好准备，防患于未然。",
    "frequency": 29,
    "example": "面对严峻的就业形势，大三学生应当未雨绸缪。"
  },
  {
    "word": "历久弥新",
    "explanation": "经历很长时间反而更加鲜活、更有价值。",
    "frequency": 28,
    "example": "这种文化精神历久弥新，在现代依然散发着光芒。"
  },
  {
    "word": "司空见惯",
    "explanation": "指某事常见，不足为奇。",
    "frequency": 28,
    "example": "这种现象在现代都市中早已是司空见惯了。"
  },
  {
    "word": "有的放矢",
    "explanation": "比喻说话做事目标明确，有针对性。",
    "frequency": 28,
    "example": "我们的复习计划应当有的放矢，重点突击薄弱环节。"
  },
  {
    "word": "独树一帜",
    "explanation": "比喻自成一家，风格或主张独特。",
    "frequency": 28,
    "example": "齐白石的画在近代中国画坛独树一帜。"
  },
  {
    "word": "举足轻重",
    "explanation": "地位重要，一举一动都足以影响全局。",
    "frequency": 27,
    "example": "他在这个项目中扮演着举足轻重的角色。"
  },
  {
    "word": "日新月异",
    "explanation": "每天每月都有新的变化，形容发展进步很快。",
    "frequency": 27,
    "example": "科技飞速发展，世界正处于日新月异的变化之中。"
  },
  {
    "word": "理所当然",
    "explanation": "从道理上说应当如此。",
    "frequency": 27,
    "example": "由于平时的刻苦钻研，他取得这样的成绩也是理所当然的。"
  },
  {
    "word": "不言而喻",
    "explanation": "不用说明就可以明白。",
    "frequency": 26,
    "example": "这次比赛的重要性是不言而喻的。"
  },
  {
    "word": "水到渠成",
    "explanation": "渠：水道;水流的地方自然形成一条水道。比喻条件成熟，事情自然会成功",
    "frequency": 26,
    "example": "只要我们坚持努力，成功自然会水到渠成。"
  },
  {
    "word": "毋庸置疑",
    "explanation": "事实明显或理由充分，不需要怀疑。",
    "frequency": 25,
    "example": "他在这个领域绝对是权威，其实力毋庸置疑。"
  },
  {
    "word": "一劳永逸",
    "explanation": "辛苦一次把事情办好，以后不再费力。",
    "frequency": 24,
    "example": "世界上没有一劳永逸的事情，只有不断的进取。"
  },
  {
    "word": "一成不变",
    "explanation": "一经形成就不再改变，常指守旧僵化。",
    "frequency": 24,
    "example": "市场环境瞬息万变，我们不能一成不变地执行旧计划。"
  },
  {
    "word": "与时俱进",
    "explanation": "随着时代发展而不断进步、更新。",
    "frequency": 24,
    "example": "企业只有与时俱进，才能在激烈的竞争中生存。"
  },
  {
    "word": "标新立异",
    "explanation": "提出新奇的主张或见解，以显示与众不同。",
    "frequency": 24,
    "example": "他在设计上总是标新立异，深受年轻人喜爱。"
  },
  {
    "word": "源远流长",
    "explanation": "源头很远，流程很长；比喻历史悠久、根基深厚。",
    "frequency": 24,
    "example": "中华文化源远流长，博大精深。"
  },
  {
    "word": "不可或缺",
    "explanation": "非常重要，不能缺少。",
    "frequency": 23,
    "example": "水是生命中不可或缺的资源。"
  },
  {
    "word": "人云亦云",
    "explanation": "别人怎么说自己也跟着怎么说，没有主见。",
    "frequency": 23,
    "example": "我们要有独立思考的能力，不要人云亦云。"
  },
  {
    "word": "持之以恒",
    "explanation": "长久坚持下去，不间断。",
    "frequency": 23,
    "example": "学习语言需要持之以恒的练习。"
  },
  {
    "word": "方兴未艾",
    "explanation": "事物正在兴起、发展，一时不会终止。",
    "frequency": 23,
    "example": "互联网技术的发展方兴未艾，未来充满可能。"
  },
  {
    "word": "无与伦比",
    "explanation": "没有能比得上的，形容非常突出。",
    "frequency": 22,
    "example": "这座建筑的精美程度是无与伦比的。"
  },
  {
    "word": "有目共睹",
    "explanation": "大家都能看见，形容事实非常明显。",
    "frequency": 22,
    "example": "他在工作中的成绩是有目共睹的。"
  },
  {
    "word": "背道而驰",
    "explanation": "朝相反方向走，比喻方向、目标完全相反。",
    "frequency": 22,
    "example": "你的做法与初衷背道而驰。"
  },
  {
    "word": "脱颖而出",
    "explanation": "比喻本领全部显露出来",
    "frequency": 22,
    "example": "他在众多的应聘者中脱颖而出。"
  },
  {
    "word": "轻而易举",
    "explanation": "形容事情容易做，不费力。",
    "frequency": 22,
    "example": "对他来说，解决这个数学题轻而易举。"
  },
  {
    "word": "一脉相承",
    "explanation": "从同一源流传承下来，前后连续不断。",
    "frequency": 21,
    "example": "这种艺术风格与传统国画一脉相承。"
  }
];
