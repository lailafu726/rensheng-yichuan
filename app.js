/* =========================================================
   人生一串 — interactivity
   ========================================================= */

/* ---------- mobile menu ---------- */
const navBtn = document.getElementById('navMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
navBtn?.addEventListener('click', () => {
  const open = !mobileMenu.hidden;
  mobileMenu.hidden = open;
  navBtn.setAttribute('aria-expanded', String(!open));
});
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.hidden = true;
  navBtn?.setAttribute('aria-expanded', 'false');
}));

/* ---------- chip selectors ---------- */
document.querySelectorAll('.chips').forEach(group => {
  group.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('on');
  });
});

/* ---------- assess stepper ---------- */
const steps = Array.from(document.querySelectorAll('.assess-form .step'));
const progItems = Array.from(document.querySelectorAll('.prog-steps li'));
const barFill = document.getElementById('barFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
let curr = 0;

function renderStep() {
  steps.forEach((el, i) => el.classList.toggle('active', i === curr));
  progItems.forEach((el, i) => {
    el.classList.toggle('active', i === curr);
    el.classList.toggle('done', i < curr);
  });
  barFill.style.width = `${((curr + 1) / steps.length) * 100}%`;
  prevBtn.disabled = curr === 0;
  const last = curr === steps.length - 1;
  nextBtn.hidden = last;
  submitBtn.hidden = !last;
}
prevBtn.addEventListener('click', () => { if (curr > 0) { curr--; renderStep(); scrollToAssess(); } });
nextBtn.addEventListener('click', () => {
  if (curr < steps.length - 1) {
    const data = collectFormData();
    if (curr === 0) renderBirthInsight(data);
    if (curr === 1) renderPersonaInsight(data);
    curr++;
    renderStep();
    scrollToAssess();
  }
});
function scrollToAssess() {
  document.getElementById('assess').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
renderStep();

/* ---------- form submission → recommendation ---------- */
submitBtn.addEventListener('click', () => {
  const data = collectFormData();
  renderBirthInsight(data);
  renderPersonaInsight(data);
  const recs = generateRecommendations(data);
  renderResult(data, recs);
  const result = document.getElementById('result');
  result.hidden = false;
  setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
});

function collectFormData() {
  const form = document.getElementById('assessForm');
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());
  obj.likeTags = Array.from(document.querySelectorAll('[data-name="likeTags"] .chip.on')).map(c => c.dataset.v);
  obj.hobbyTags = Array.from(document.querySelectorAll('[data-name="hobbyTags"] .chip.on')).map(c => c.dataset.v);
  obj.dislikeTags = Array.from(document.querySelectorAll('[data-name="dislikeTags"] .chip.on')).map(c => c.dataset.v);
  return obj;
}

/* ---------- staged insights: birth profile → persona profile ---------- */
const STEMS = ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己'];
const BRANCHES = ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'];
const ELEMENT_COPY = {
  木: { color:'青绿 / 翠色', vibe:'生发、清新、有审美生长力', material:'翡翠、绿松石、青玉' },
  火: { color:'朱红 / 暖金', vibe:'明亮、热情、状态感强', material:'南红、蜜蜡、暖色玛瑙' },
  土: { color:'米黄 / 蜜色', vibe:'稳定、包容、适合长期养成', material:'蜜蜡、黄口和田、木质文玩' },
  金: { color:'青白 / 银白', vibe:'清透、克制、边界感好', material:'和田白玉、白水晶、翡翠' },
  水: { color:'墨黑 / 烟茶', vibe:'松弛、内省、很有静气', material:'沉香、檀木、茶晶、墨玉' }
};

const BALANCE_COPY = {
  木: {
    need:'金',
    secondary:'土',
    needColor:'青白、银白、米黄',
    approach:'木气偏旺的人，容易审美敏锐、想法多，但也容易显得太散。推荐会先用金的清透感把气质收住，再用一点土的温润感托底。',
    short:'木旺，取金土来收束与稳定'
  },
  火: {
    need:'水',
    secondary:'金',
    needColor:'烟茶、墨色、青白',
    approach:'火气偏旺的人，状态感强、存在感足，但配饰太艳容易显躁。推荐会用水的静气降一降，再用金的清爽感让整体更贵气。',
    short:'火旺，取水金来降燥与提清'
  },
  土: {
    need:'木',
    secondary:'水',
    needColor:'青绿、翠色、烟茶',
    approach:'土气偏重的人很稳、很适合长期养成，但也容易显得厚重。推荐会补一点木的生发感和水的流动感，让人看起来更松、更有呼吸感。',
    short:'土重，取木水来疏通与润泽'
  },
  金: {
    need:'火',
    secondary:'木',
    needColor:'朱红、暖金、青绿',
    approach:'金气偏旺的人通常审美克制、边界感强，但容易偏冷。推荐会补一点火的暖意和木的生机，让清冷感里多一点亲近度。',
    short:'金旺，取火木来增温与生动'
  },
  水: {
    need:'火',
    secondary:'土',
    needColor:'暖金、朱红、蜜黄',
    approach:'水气偏旺的人自带松弛和内省感，但太冷太暗会显得距离感强。推荐会用火来点亮气色，再用土来稳住安全感。',
    short:'水旺，取火土来点亮与安定'
  }
};

function getAstroSign(dateStr) {
  if (!dateStr) return '待补充';
  const d = new Date(`${dateStr}T12:00:00`);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const signs = [
    ['摩羯座', 1, 20], ['水瓶座', 2, 19], ['双鱼座', 3, 21], ['白羊座', 4, 20],
    ['金牛座', 5, 21], ['双子座', 6, 22], ['巨蟹座', 7, 23], ['狮子座', 8, 23],
    ['处女座', 9, 23], ['天秤座', 10, 24], ['天蝎座', 11, 23], ['射手座', 12, 22], ['摩羯座', 13, 1]
  ];
  return signs.find(([, month, start]) => (m === month - 1 && day >= start) || (m === month && day < start))?.[0] || '摩羯座';
}

function getBirthProfile(d) {
  const date = d.birthDate ? new Date(`${d.birthDate}T12:00:00`) : null;
  const month = date ? date.getMonth() + 1 : 0;
  const year = date ? date.getFullYear() : 2026;
  const pillar = `${STEMS[(year - 4) % 10]}${BRANCHES[(year - 4) % 12]}年`;
  let element = '土';
  if ([2,3,4].includes(month)) element = '木';
  if ([5,6,7].includes(month)) element = '火';
  if ([8,9,10].includes(month)) element = '金';
  if ([11,12,1].includes(month)) element = '水';
  if (!date) element = '土';

  const place = (d.birthPlace || d.residentCity || '').trim();
  let placeEnergy = '中宫土气';
  if (/上海|杭州|苏州|南京|宁波|厦门|福州|广州|深圳|青岛|大连|海|江|湖|湾/.test(place)) placeEnergy = '临水润泽';
  if (/北京|西安|太原|兰州|银川|乌鲁木齐|内蒙|北|西/.test(place)) placeEnergy = '金土清朗';
  if (/成都|重庆|长沙|武汉|南昌|昆明|贵阳|南/.test(place)) placeEnergy = '火土温养';
  if (/哈尔滨|长春|沈阳|东北/.test(place)) placeEnergy = '水木藏锋';

  const e = ELEMENT_COPY[element];
  const balance = BALANCE_COPY[element] || BALANCE_COPY.土;
  return {
    sign: getAstroSign(d.birthDate),
    pillar,
    element,
    needElement: balance.need,
    secondaryElement: balance.secondary,
    needColor: balance.needColor,
    balanceText: balance.approach,
    balanceShort: balance.short,
    placeEnergy,
    color: e.color,
    material: e.material,
    text: `从传统文化参考看，你的出生节气更偏「${element}」象，底色是${e.vibe}。${place ? `出生/常住地带出一点「${placeEnergy}」的场域感，` : '地点信息尚未完整，'}所以不会简单按喜欢推荐，而是先看「${balance.short}」：优先把${balance.needColor}这一组颜色放进候选池。这里不是下定论，而是先给审美方向打一个底稿。`
  };
}

function renderBirthInsight(d) {
  const p = getBirthProfile(d);
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('astroSign', p.sign);
  set('birthPillar', p.pillar);
  set('elementTrend', `${p.element}象偏旺 · 补${p.needElement}${p.secondaryElement}`);
  set('placeEnergy', p.placeEnergy);
  set('birthInsightText', `${p.text} 初步适配材质：${p.material}。`);
}

function getPersonaProfile(d) {
  const likes = d.likeTags?.length ? d.likeTags : [d.vibe || '温润'];
  const hobbies = d.hobbyTags?.length ? d.hobbyTags : ['日常审美'];
  const hasMbti = Boolean(d.mbti && d.mbti !== 'unknown');
  const mbti = hasMbti ? d.mbti : '';
  const introvert = hasMbti ? /^[I]/.test(mbti) : /清冷|温润|低调|禅意|沉稳/.test(likes.join(''));
  const intuitive = hasMbti ? /N/.test(mbti) : /香道|书画|瑜伽冥想|收藏研究|国风穿搭/.test(hobbies.join(''));
  const judging = hasMbti ? /J$/.test(mbti) : !/个性|灵动|摄影旅行|手作盘玩/.test([...likes, ...hobbies].join(''));
  let title = '温润观察家';
  if (/明艳|显白|灵动/.test(likes.join(''))) title = '氛围点亮型玩家';
  if (/沉稳|贵气|低调/.test(likes.join(''))) title = '低调质感派';
  if (/清冷|禅意/.test(likes.join(''))) title = '清冷松弛派';
  if (/复古|茶咖|书画|香道/.test([...likes, ...hobbies].join(''))) title = '东方复古策展人';
  if (/收藏研究/.test(hobbies.join(''))) title = '理性收藏研究型';

  const rhythm = introvert ? '你不太需要靠很大的单品去证明自己，更适合有细节、有留白、越看越耐品的材质。' : '你适合有一点记忆点的单品，颜色和形制可以稍微出挑一点，戴起来很容易有氛围。';
  const taste = intuitive ? '审美上你更吃“意境”和故事感，材质背后的产区、寓意和纹理会影响你的喜爱程度。' : '审美上你更重视上手后的实用感，是否好搭、好养、耐看，会比概念更重要。';
  const decision = judging ? '决策方式偏明确，适合给你收敛到 2-3 个稳定方向。' : '决策方式更开放，适合保留一点叠戴和试错空间。';
  const tags = [hasMbti ? mbti : 'MBTI 可跳过', likes[0] || '温润', hobbies[0] || '日常审美', d.scene || '待定场景'].filter(Boolean);
  return {
    title,
    tags,
    text: `${rhythm}${taste}${decision}接下来再用佩戴场景和预算做最后筛选，避免“喜欢但不适合日常”的情况。`
  };
}

function renderPersonaInsight(d) {
  const p = getPersonaProfile(d);
  const title = document.getElementById('personaTitle');
  const text = document.getElementById('personaText');
  const tags = document.getElementById('personaTags');
  if (title) title.textContent = p.title;
  if (text) text.textContent = p.text;
  if (tags) tags.innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');
}

/* ---------- mock recommendation engine ---------- */
const PRODUCT_IMAGES = {
  fei: './assets/fei.jpg',
  hetian: './assets/hetian.png',
  nanhong: './assets/nanhong.jpg',
  milla: './assets/milla.jpg',
  songshi: './assets/songshi.jpg',
  crystal: './assets/crystal.jpg',
  chenxiang: './assets/chenxiang.jpg',
  tanmu: './assets/tanmu.jpg'
};

const MATERIALS = {
  hetian: {
    key:'hetian', name:'和田青白玉', cat:'平安扣 · 无事牌 · 手镯',
    swatch:'sw-hetian',
    palette:'青白 / 暖金',
    balanceElements:['金','土'],
    keywords:['温润','沉稳','低调','内敛','禅意'],
    hobbies:['茶咖','书画','国风穿搭','极简生活','收藏研究','送礼审美'],
    scenes:['日常通勤','商务社交','送礼','收藏','仪式/转运'],
    budgets:['300-1000','1000-3000','3000-10000','10000+'],
    compliment:'你的审美很有“留白感”，不是一眼用力的张扬，而是越看越耐看的高级。',
    reason:'温润含蓄,长期佩戴越戴越油润,适合通勤与低调商务场合;青白玉的气质和你这种松弛、克制、但很有分寸的美感非常贴。',
    pair:'主珠 + 银/暖金配饰;不与艳色玛瑙混搭。穿搭以中性、米白、墨色系最佳。',
    budgetTip:'¥1k 内可入手俄料/青海料青白玉无事牌;¥3k 起考虑和田带皮籽料小件。',
    pitfall:'高白籽料溢价高,新手优先选油润度而非"白"。"羊脂玉"非鉴定术语,谨慎对待营销话术。'
  },
  fei: {
    key:'fei', name:'翡翠 (糯种)', cat:'平安扣 · 蛋面 · 吊坠',
    swatch:'sw-fei',
    palette:'青绿 / 银白',
    balanceElements:['木','水'],
    keywords:['贵气','灵动','显白','明艳','沉稳'],
    hobbies:['国风穿搭','摄影旅行','送礼审美','收藏研究'],
    scenes:['送礼','商务社交','收藏','日常通勤','仪式/转运'],
    budgets:['1000-3000','3000-10000','10000+'],
    compliment:'你适合那种“干净但不寡淡”的光泽感，稍微一点绿意就能把整个人衬得很灵。',
    reason:'透感与色感的平衡,显气色又不抢戏;糯种淡绿适合东方肤色,在职场和送礼场合接受度都高。',
    pair:'18K 暖金或铂金镶嵌;单品出彩,配饰宜简。避免与红玛瑙、艳琥珀同时叠戴。',
    budgetTip:'¥3k 内选无色或淡晴底糯种平安扣;¥1w 进入飘花/淡绿蛋面区间;高品阳绿需 NGTC 证书。',
    pitfall:'B/C 货肉眼难辨,务必认准 A 货证书;"冰种"在不同商家定义差异极大。'
  },
  nanhong: {
    key:'nanhong', name:'南红 (柿子红)', cat:'手串 · 桶珠 · 吊坠',
    swatch:'sw-nanhong',
    palette:'柿红 / 暖金',
    balanceElements:['火','土'],
    keywords:['明艳','显白','喜庆','灵动'],
    hobbies:['国风穿搭','摄影旅行','送礼审美','手作盘玩'],
    scenes:['送礼','仪式/转运','日常通勤','商务社交'],
    budgets:['300-1000','1000-3000','3000-10000'],
    compliment:'你不是普通的“想显眼”，而是很会用一点颜色把状态点亮，氛围感很会拿捏。',
    reason:'温润不刺眼的红,提气色又不张扬;保山满肉柿子红颜色稳定,适合提升存在感与喜气。',
    pair:'与白蜜蜡/沉香小桶隔珠最经典;金属件用暖金。避免与冷调蓝绿松石同串。',
    budgetTip:'¥1k 内单品桶珠或小珠手串;¥3k 上保山满肉 12mm 圆珠;凉山料颜色更深沉。',
    pitfall:'注胶、染色普遍,需阳光透光观察是否均匀;裂纹和水草不算瑕疵,但价格应区分。'
  },
  milla: {
    key:'milla', name:'蜜蜡 (鸡油黄)', cat:'手串 · 圆珠 · 桶珠',
    swatch:'sw-milla',
    palette:'金黄 / 米白',
    balanceElements:['土','火'],
    keywords:['温暖','复古','显白','灵动'],
    hobbies:['茶咖','摄影旅行','国风穿搭','手作盘玩','送礼审美'],
    scenes:['日常通勤','送礼','商务社交','仪式/转运'],
    budgets:['300-1000','1000-3000','3000-10000'],
    compliment:'你的气质里有一点温暖复古的底色，很适合这种像下午茶光线一样柔柔的材质。',
    reason:'轻盈不压手,黄色调显白显气色;波罗的海鸡油黄稳定性好,适合中性偏暖穿搭长期佩戴。',
    pair:'与白玉/银配饰清爽;与南红组合喜气;避免与冷调蓝绿叠搭。',
    budgetTip:'¥1k 内可入 8mm 圆珠或随形;¥3k 起进入 10mm+ 满蜜区间;白蜜溢价较高需挑稳定不变色的。',
    pitfall:'二代压制、烤色普遍,看皮壳风化纹与流淌纹;"老蜜蜡"概念混乱,慎信故事溢价。'
  },
  songshi: {
    key:'songshi', name:'高瓷绿松石', cat:'手串 · 吊坠 · 配珠',
    swatch:'sw-songshi',
    palette:'蓝绿 / 米白',
    balanceElements:['木','水'],
    keywords:['个性','灵动','复古','明艳'],
    hobbies:['摄影旅行','国风穿搭','手作盘玩','收藏研究'],
    scenes:['日常通勤','仪式/转运'],
    budgets:['300-1000','1000-3000','3000-10000'],
    compliment:'你很适合一点“不按常规出牌”的蓝绿色，清醒、有辨识度，拍照也很出片。',
    reason:'高瓷蓝色彩独特,叠戴出彩,适合表达个性与民族风的穿搭。',
    pair:'与银饰/南红/红玛瑙叠戴气场强;与翡翠和田玉不在同串。',
    budgetTip:'¥1k 内挑高瓷小克数珠子;原矿高瓷溢价高,优先选颜色干净铁线少的。',
    pitfall:'注胶、灌胶、合成普遍,无注胶高瓷货源稀缺;长期佩戴会变色属正常现象。'
  },
  crystal: {
    key:'crystal', name:'白水晶 / 茶晶', cat:'手串 · 配珠 · 入门吊坠',
    swatch:'sw-crystal',
    palette:'透白 / 烟茶',
    balanceElements:['金','水'],
    keywords:['清冷','灵动','低调','禅意'],
    hobbies:['瑜伽冥想','极简生活','书画','摄影旅行'],
    scenes:['日常通勤','仪式/转运'],
    budgets:['under300','300-1000','1000-3000'],
    compliment:'你的偏好很清爽，不需要很多装饰就有自己的节奏，水晶这种“轻盈感”会很衬你。',
    reason:'入门成本低、颜色搭配灵活,适合先尝试再决定要不要往更高客单材质走。',
    pair:'与和田玉、银配饰最稳;白水晶作为隔珠提亮整体。',
    budgetTip:'¥300 内可上手 8mm 单串;白发晶、茶晶、紫水晶按颜色偏好挑。',
    pitfall:'合成水晶常见但价格便宜,关注晶体内的天然棉絮与冰裂;过度营销"能量"不可信。'
  },
  chenxiang: {
    key:'chenxiang', name:'沉香小手串', cat:'手串 · 线香 · 把件',
    swatch:'sw-chenxiang',
    palette:'墨褐 / 暖金',
    balanceElements:['水','木'],
    keywords:['沉稳','禅意','内敛','低调'],
    hobbies:['香道','茶咖','瑜伽冥想','书画','收藏研究'],
    scenes:['商务社交','收藏','日常通勤','仪式/转运'],
    budgets:['1000-3000','3000-10000','10000+'],
    compliment:'你有一种安静但很有存在感的气场，不靠亮色抢镜，靠细节和气味记忆取胜。',
    reason:'温和不张扬的香气适合长时间近距离社交;惠安系凉甜或星洲系奶甜按个人喜好选。',
    pair:'与黑檀/小叶紫檀低调商务;与白玉/沉香配珠禅意通勤。',
    budgetTip:'¥1k 内入门软丝/壳沉小串;¥5k 上沉水级单珠把玩;高等级建议多看实物、证书与来源说明。',
    pitfall:'真假与等级体系极复杂,新手避免独自购买高端料;"野生""沉水""奇楠"都需谨慎对待。'
  },
  tanmu: {
    key:'tanmu', name:'小叶紫檀', cat:'手串 · 把件',
    swatch:'sw-tanmu',
    palette:'紫褐 / 暖金',
    balanceElements:['木','土'],
    keywords:['沉稳','内敛','质朴','低调','禅意'],
    hobbies:['手作盘玩','茶咖','书画','极简生活','收藏研究'],
    scenes:['日常通勤','商务社交','送礼','仪式/转运'],
    budgets:['under300','300-1000','1000-3000','3000-10000'],
    compliment:'你适合慢慢养成的东西，越盘越有痕迹，像把自己的时间感戴在手上。',
    reason:'入门友好、油密性好、长期盘玩出包浆;沉稳低调,适合中性偏男性的日常通勤。',
    pair:'与南红/蜜蜡/沉香隔珠经典;金刚菩提配饰偏文玩感。',
    budgetTip:'¥1k 内选 15mm 高油密牛毛纹串;¥3k+ 进入金星精品;爆满金星溢价高需谨慎。',
    pitfall:'大叶紫檀冒充小叶紫檀普遍;闻香、看牛毛纹与重量是基本辨识。'
  }
};

/* simple scoring engine — produces 3 picks based on budget/scene/keywords */
function generateRecommendations(d) {
  const birthProfile = getBirthProfile(d);
  const candidates = Object.values(MATERIALS).map(m => {
    let score = 50;
    const hitsNeed = m.balanceElements?.includes(birthProfile.needElement);
    const hitsSecondary = m.balanceElements?.includes(birthProfile.secondaryElement);
    if (hitsNeed) score += 34;
    if (hitsSecondary) score += 10;
    if (!hitsNeed && !hitsSecondary) score -= 10;
    if (d.budget && m.budgets.includes(d.budget)) score += 15;
    if (d.scene && m.scenes.includes(d.scene)) score += 12;
    const likeOverlap = (d.likeTags || []).filter(t => m.keywords.includes(t)).length;
    score += likeOverlap * 6;
    const hobbyOverlap = (d.hobbyTags || []).filter(t => m.hobbies?.includes(t)).length;
    score += hobbyOverlap * 5;
    if (d.vibe) {
      if (/温润|沉稳/.test(d.vibe) && /温润|沉稳|内敛|低调/.test(m.keywords.join())) score += 8;
      if (/清冷|禅意/.test(d.vibe) && /禅意|清冷|低调/.test(m.keywords.join())) score += 8;
      if (/明艳|显白/.test(d.vibe) && /明艳|显白|喜庆/.test(m.keywords.join())) score += 10;
      if (/沉稳|贵气/.test(d.vibe) && /贵气|沉稳/.test(m.keywords.join())) score += 6;
    }
    // category soft match
    if (d.category === '手镯' && (m.key === 'fei' || m.key === 'hetian')) score += 6;
    if (d.category === '手串' && /手串/.test(m.cat)) score += 4;

    score = Math.max(58, Math.min(96, score + Math.floor(Math.random()*5)));
    return { ...m, score, hitsNeed, hitsSecondary };
  });
  candidates.sort((a,b) => {
    if (b.hitsNeed !== a.hitsNeed) return Number(b.hitsNeed) - Number(a.hitsNeed);
    if (b.hitsSecondary !== a.hitsSecondary) return Number(b.hitsSecondary) - Number(a.hitsSecondary);
    return b.score - a.score;
  });
  return candidates.slice(0, 3);
}

function getBalanceReason(m, birthProfile) {
  const tones = m.balanceElements || [];
  const hitPrimary = tones.includes(birthProfile.needElement);
  const hitSecondary = tones.includes(birthProfile.secondaryElement);
  const hitText = hitPrimary && hitSecondary
    ? `这件刚好同时接住「补${birthProfile.needElement}」和「辅${birthProfile.secondaryElement}」`
    : hitPrimary
      ? `它主要是在帮你补${birthProfile.needElement}，方向很准`
      : hitSecondary
        ? `它不是主补，但能很好地辅助${birthProfile.secondaryElement}`
        : `它不硬凑缺补，而是用颜色和场景做柔和过渡`;
  const toneText = {
    hetian:'青白玉的白、青、润，会把气质收得更干净，像给整个人加了一层柔和滤镜。',
    fei:'翡翠的绿意和水头，会把人衬得更灵、更有呼吸感，不是用力美，是清透地发光。',
    nanhong:'南红的红和暖，会把气色和存在感拉起来，像给状态开了柔焦暖光。',
    milla:'蜜蜡的黄和暖，负责托住亲和力和松弛感，让人看起来更柔、更好接近。',
    songshi:'绿松石的蓝绿感，会补一点生命力和辨识度，很适合让穿搭有记忆点。',
    crystal:'水晶的白透和茶色，会让气场变轻、变清爽，适合把复杂感降下来。',
    chenxiang:'沉香的木气和水感更内敛，负责稳住心神，也会把气质往安静和高级里收。',
    tanmu:'紫檀的木质和厚度，负责给气场加一点沉稳和养成感，越戴越像自己的东西。'
  }[m.key] || '这类材质会把颜色、质感和佩戴场景一起调和。';
  return `你的盘面先看「${birthProfile.balanceShort}」，所以不是随便挑个好看的就结束。${hitText}，${toneText}`;
}

function getBalanceVerdict(m, birthProfile) {
  const tones = m.balanceElements || [];
  const hitPrimary = tones.includes(birthProfile.needElement);
  const hitSecondary = tones.includes(birthProfile.secondaryElement);
  if (hitPrimary && hitSecondary) return `缺补很漂亮：主补${birthProfile.needElement}，再用${birthProfile.secondaryElement}托底`;
  if (hitPrimary) return `主补方向明确：用${birthProfile.needElement}把你的状态调亮/调顺`;
  if (hitSecondary) return `辅助感很稳：先用${birthProfile.secondaryElement}把整体气质垫住`;
  return `审美过渡款：不硬补，但能把风格拉得更完整`;
}

function getCardMoodTags(m, birthProfile) {
  const base = {
    hetian:['干净留白','越看越贵','低调有分寸'],
    fei:['清透灵气','显气色','东方感'],
    nanhong:['提气色','小红书氛围感','一眼有精神'],
    milla:['暖光滤镜','温柔复古','很亲近'],
    songshi:['辨识度','拍照出片','小众不撞款'],
    crystal:['清爽减负','通透感','入门友好'],
    chenxiang:['安静高级','近距离质感','稳定心神'],
    tanmu:['慢慢养成','沉稳耐看','时间感']
  }[m.key] || ['耐看','好搭','有记忆点'];
  return [`补${birthProfile.needElement}`, ...base].slice(0, 4);
}

function getRadarScores(m, d, birthProfile) {
  const likeOverlap = (d.likeTags || []).filter(t => m.keywords.includes(t)).length;
  const hobbyOverlap = (d.hobbyTags || []).filter(t => m.hobbies?.includes(t)).length;
  const vibeHit =
    (d.vibe && /温润|沉稳/.test(d.vibe) && /温润|沉稳|内敛|低调/.test(m.keywords.join())) ||
    (d.vibe && /清冷|禅意/.test(d.vibe) && /禅意|清冷|低调/.test(m.keywords.join())) ||
    (d.vibe && /明艳|显白/.test(d.vibe) && /明艳|显白|喜庆/.test(m.keywords.join())) ||
    (d.vibe && /贵气/.test(d.vibe) && /贵气|沉稳/.test(m.keywords.join()));
  const hitsNeed = m.balanceElements?.includes(birthProfile.needElement);
  const hitsSecondary = m.balanceElements?.includes(birthProfile.secondaryElement);
  const riskBase = {
    crystal: 92,
    tanmu: 84,
    hetian: 78,
    milla: 72,
    nanhong: 68,
    fei: 64,
    songshi: 60,
    chenxiang: 56
  }[m.key] || 70;
  const budgetFit = d.budget && m.budgets.includes(d.budget);
  const sceneFit = d.scene && m.scenes.includes(d.scene);
  const scores = [
    { label: '气质命中', value: Math.min(96, 72 + likeOverlap * 7 + hobbyOverlap * 4 + (vibeHit ? 10 : 0)) },
    { label: '缺补契合', value: hitsNeed && hitsSecondary ? 96 : hitsNeed ? 90 : hitsSecondary ? 78 : 64 },
    { label: '场景适配', value: sceneFit ? 90 : 72 },
    { label: '预算友好', value: budgetFit ? 92 : 68 },
    { label: '入门安全', value: Math.min(96, riskBase + (budgetFit ? 4 : 0) - (d.priority === '收藏与保值' ? 3 : 0)) }
  ];
  return scores.map(item => ({ ...item, value: Math.max(52, Math.round(item.value)) }));
}

function polygonPoints(scores, radius = 58, cx = 100, cy = 100) {
  return scores.map((item, i) => {
    const angle = (-90 + i * 360 / scores.length) * Math.PI / 180;
    const r = radius * item.value / 100;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');
}

function ringPoints(count, ratio, radius = 58, cx = 100, cy = 100) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (-90 + i * 360 / count) * Math.PI / 180;
    const r = radius * ratio;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');
}

function radarPoint(value, i, count, radius = 58, cx = 100, cy = 100) {
  const angle = (-90 + i * 360 / count) * Math.PI / 180;
  const r = radius * value / 100;
  return {
    x: (cx + Math.cos(angle) * r).toFixed(1),
    y: (cy + Math.sin(angle) * r).toFixed(1)
  };
}

function renderRadar(m, d, birthProfile) {
  const scores = getRadarScores(m, d, birthProfile);
  const axisEnd = ringPoints(scores.length, 1).split(' ');
  const labels = scores.map((item, i) => {
    const angle = (-90 + i * 360 / scores.length) * Math.PI / 180;
    const x = 100 + Math.cos(angle) * 78;
    const y = 100 + Math.sin(angle) * 78 + (i === 0 ? 8 : 0);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${item.label}</text>`;
  }).join('');
  return `
    <div class="rc-radar" aria-label="${m.name}五维匹配雷达图">
      <div class="radar-head">
        <span>五维匹配</span>
        <div class="radar-score"><strong>${m.score}</strong><em>/ 100</em></div>
      </div>
      <svg class="radar-svg" viewBox="0 0 200 196" role="img" aria-label="${m.name}在气质、缺补、场景、预算和入门安全上的匹配得分">
        <g class="radar-grid">
          <polygon points="${ringPoints(scores.length, .25)}"></polygon>
          <polygon points="${ringPoints(scores.length, .5)}"></polygon>
          <polygon points="${ringPoints(scores.length, .75)}"></polygon>
          <polygon points="${ringPoints(scores.length, 1)}"></polygon>
          ${axisEnd.map(pt => `<line x1="100" y1="100" x2="${pt.split(',')[0]}" y2="${pt.split(',')[1]}"></line>`).join('')}
        </g>
        <polygon class="radar-area" points="${polygonPoints(scores)}"></polygon>
        <polyline class="radar-line" points="${polygonPoints(scores)} ${polygonPoints(scores).split(' ')[0]}"></polyline>
        ${scores.map((pt, idx) => {
          const p = radarPoint(pt.value, idx, scores.length); 
          return `<circle class="radar-dot" cx="${p.x}" cy="${p.y}" r="3.2"></circle>`;
        }).join('')}
        <g class="radar-labels">${labels}</g>
      </svg>
      <div class="radar-scores">
        ${scores.map(item => `<span><b>${item.label}</b><em>${item.value}</em></span>`).join('')}
      </div>
    </div>
  `;
}

function getSoftReason(m, d, persona) {
  const scene = d.scene || '日常佩戴';
  const vibe = d.vibe || persona.title;
  const copy = {
    hetian: `你适合的是那种“话不多但一看就很有品”的气质。和田玉不会抢你本人风头，却会把整个人衬得更干净、更稳；放在${scene}里，就是不张扬但别人会默默觉得：这个人好会选。`,
    fei: `你身上有适合被一点清透感点亮的地方。翡翠不是普通的绿，它更像是给${vibe}加一层水光感，显精神、显贵气，也显得你不是随便买配饰，而是真的懂审美。`,
    nanhong: `你很适合一点“气色开关”。南红不是俗气的红，而是会让人看起来更有生命力、更有好运感；尤其在${scene}里，它会把你从“好看”推到“有状态”。`,
    milla: `蜜蜡很像一层暖光滤镜，特别适合有温柔、复古、松弛感的人。它不会压住你，反而会让你看起来更亲近、更有故事感，像把傍晚的阳光戴在身上。`,
    songshi: `你适合一点“不和别人一样”的小众记忆点。绿松石的蓝绿很出片，但不是乱抢镜，是清醒、自由、有审美态度；如果你不想戴得太普通，它会很懂你。`,
    crystal: `你其实不需要太重的装饰感，清清爽爽就很好看。水晶会把气质变轻、变透，适合想要干净、少负担、但又有一点小心思的日常状态。`,
    chenxiang: `你适合安静但有存在感的东西。沉香不是给别人看的热闹，而是给自己的一点稳定感；近距离相处时会显得很克制、很有品，像身上留下的一点淡淡记忆。`,
    tanmu: `你适合“越养越像自己”的东西。紫檀不是买回来就结束，而是会慢慢留下你的时间感；如果你喜欢稳定、自然、有痕迹的美，这类材质会很贴你。`
  };
  return copy[m.key] || m.reason;
}

function getPairingBundle(m) {
  const bundles = {
    hetian: { keys:['hetian','crystal','chenxiang'], title:'白玉 + 水晶 + 木调', text:'米白针织、烟灰西装、墨绿色衬衫都能接住它；越简单越显贵，不需要叠太满。' },
    fei: { keys:['fei','hetian','crystal'], title:'翡翠 + 白玉 + 银白感', text:'适合干净的白衬衫、缎面上衣或新中式外套；单件做视觉中心就够了。' },
    nanhong: { keys:['nanhong','milla','tanmu'], title:'南红 + 蜜蜡 + 木质隔珠', text:'和米色、驼色、黑色最稳，节日、聚会、拍照场景会很提气色。' },
    milla: { keys:['milla','hetian','nanhong'], title:'蜜蜡 + 白玉 + 一点红', text:'适合复古棕、奶油白、亚麻色；整体会有暖光感，温柔但不寡淡。' },
    songshi: { keys:['songshi','nanhong','tanmu'], title:'绿松石 + 南红 + 木质', text:'适合牛仔、民族风、户外旅行和有纹理的外套；重点是让蓝绿色成为记忆点。' },
    crystal: { keys:['crystal','hetian','milla'], title:'水晶 + 白玉 + 浅暖色', text:'适合白色、浅灰、雾蓝和极简穿搭；清透、不压人，通勤也很轻松。' },
    chenxiang: { keys:['chenxiang','tanmu','hetian'], title:'沉香 + 檀木 + 小白玉', text:'适合深色西装、茶席、书房和商务场合；低调但很有近距离质感。' },
    tanmu: { keys:['tanmu','milla','nanhong'], title:'檀木 + 蜜蜡 + 南红点睛', text:'适合棉麻、深色外套和中性风；越盘越有自己的时间感。' }
  };
  return bundles[m.key] || bundles.hetian;
}

function getDrillDown(m) {
  const commonTip = '这些是继续做功课的入口，不是购买背书；真要下单前，看实拍视频、证书编号、评价区返图和退换规则，贵价件尽量走复检。';
  const map = {
    hetian: {
      products:['和田青白玉无事牌','和田玉平安扣吊坠','和田碧玉小圆珠手串'],
      searches:['和田玉通勤搭配','青白玉无事牌怎么选','和田玉证书避坑'],
      accounts:['方元老细金｜玉石知识/真假科普','Shannai Jewellery｜新中式玉石审美','是亮亮｜日常配饰穿戴参考'],
      tip:'和田玉先别被“羊脂”“籽料”带跑，先看细度、油润感、结构和上身气质，预算不高也能戴得很高级。'
    },
    fei: {
      products:['糯种淡晴水平安扣','翡翠小蛋面戒指','翡翠飘花吊坠'],
      searches:['翡翠A货怎么看','糯种翡翠平安扣','翡翠蛋面日常搭配'],
      accounts:['方元老细金｜翡翠/珠宝知识科普','Shannai Jewellery｜东方感首饰参考','Winnie Tang｜珠宝直播/穿戴灵感'],
      tip:'翡翠不要只听“冰不冰”，更要看颜色是否舒服、底子是否干净、有没有裂纹和 A 货证书。'
    },
    nanhong: {
      products:['南红柿子红手串','保山南红桶珠项链','南红小吊坠/隔珠'],
      searches:['南红柿子红怎么选','南红手串搭配','南红注胶避坑'],
      accounts:['香木雅舍｜文玩日常穿戴参考','一诺本诺 EEEENO｜文玩珠串设计感','薛佳凝｜玉石/文玩直播灵感'],
      tip:'南红重点看颜色是否均匀、肉质是否满、裂和胶感是否明显；越红不等于越值得，舒服耐看更重要。'
    },
    milla: {
      products:['鸡油黄蜜蜡圆珠手串','白蜜蜡桶珠项链','蜜蜡随形吊坠'],
      searches:['蜜蜡鸡油黄搭配','蜜蜡二代怎么看','蜜蜡手串日常穿搭'],
      accounts:['香木雅舍｜暖调文玩搭配','一诺本诺 EEEENO｜珠串设计参考','是亮亮｜低门槛配饰灵感'],
      tip:'蜜蜡先分清天然、烤色、二代压制，别为“老蜜蜡故事”冲动付费，颜色稳定和质感舒服更关键。'
    },
    songshi: {
      products:['高瓷绿松石单圈手串','绿松石小吊坠','绿松石隔珠搭配款'],
      searches:['绿松石高瓷蓝怎么选','绿松石原矿注胶区别','绿松石南红搭配'],
      accounts:['一诺本诺 EEEENO｜个性珠串设计','香木雅舍｜文玩上身参考','薛佳凝｜小众水晶/绿松石灵感'],
      tip:'绿松石一定问清是否原矿、是否注胶优化；颜色漂亮是一方面，瓷度、铁线和后期变色也要一起看。'
    },
    crystal: {
      products:['白水晶单圈手串','茶晶通勤手串','白水晶隔珠搭配款'],
      searches:['白水晶手串搭配','茶晶适合什么风格','水晶入门怎么选'],
      accounts:['是亮亮｜平价配饰穿戴参考','Winnie Tang｜珠宝搭配灵感','一诺本诺 EEEENO｜轻珠串设计参考'],
      tip:'水晶很适合先试风格，重点看晶体通透度、棉絮冰裂是否能接受，别把“能量话术”当主要购买理由。'
    },
    chenxiang: {
      products:['沉香小珠手串','惠安系沉香单圈','沉香配白玉小吊坠'],
      searches:['沉香手串真假入门','惠安沉香和星洲沉香区别','沉香通勤搭配'],
      accounts:['香木雅舍｜香木文玩穿戴','一诺本诺 EEEENO｜文玩珠串设计','薛佳凝｜文玩玉石直播灵感'],
      tip:'沉香水很深，新手别一上来买高价“沉水”“奇楠”，先学习香韵、产区和油脂线，再考虑进阶。'
    },
    tanmu: {
      products:['小叶紫檀高油密手串','小叶紫檀金星手串','紫檀配蜜蜡南红手串'],
      searches:['小叶紫檀怎么盘','小叶紫檀金星真假','紫檀手串搭配女生日常'],
      accounts:['香木雅舍｜木质文玩日常','一诺本诺 EEEENO｜中性珠串设计','是亮亮｜配饰叠戴参考'],
      tip:'小叶紫檀看油密、纹理和尺寸，不必一味追“爆满金星”；能不能盘出漂亮包浆，日常习惯也很重要。'
    }
  };
  const fallback = map.hetian;
  const picked = map[m.key] || fallback;
  return { ...picked, commonTip };
}

/* ---------- render result ---------- */
function renderResult(d, recs) {
  const birthProfile = getBirthProfile(d);
  const personaProfile = getPersonaProfile(d);
  // overview
  const colorMap = {
    '温润内敛':'青白 / 暖金',
    '清冷禅意':'白玉 / 银白',
    '明艳显白':'柿红 / 金黄',
    '沉稳贵气':'墨绿 / 暖金',
    '灵动复古':'蜜黄 / 烟褐',
    '个性叠戴':'蓝绿 / 朱砂'
  };
  const budgetLabel = {
    'under300':'¥300 以下',
    '300-1000':'¥300–1,000',
    '1000-3000':'¥1,000–3,000',
    '3000-10000':'¥3,000–10,000',
    '10000+':'¥10,000 以上'
  }[d.budget] || '—';

  document.getElementById('resultTitle').textContent =
    `${personaProfile.title} · 选品方案`;
  const preferenceBasis = d.mbti && d.mbti !== 'unknown'
    ? `再叠加你的 ${d.mbti}、爱好、预算和场景`
    : '再叠加你的气质偏好、爱好、预算和场景';
  document.getElementById('resultSummary').textContent =
    `前面两步已经看出，你不是那种随便买个“好看”就完事的人。你的出生信息先落在「${birthProfile.element}象偏旺」，所以推荐会按「补${birthProfile.needElement}、辅${birthProfile.secondaryElement}」来调和，${preferenceBasis}。下面 3 个方向，不只是能戴，也更像你。`;
  document.getElementById('ovColor').textContent = `${birthProfile.element}旺 · 补${birthProfile.needElement}${birthProfile.secondaryElement}`;
  document.getElementById('ovVibe').textContent =
    personaProfile.title;
  document.getElementById('ovBudget').textContent = `${budgetLabel} · ${d.scene || '日常通勤'}`;
  const moodTags = [
    '温柔但有分寸',
    '松弛感拿捏住了',
    '低调却很有品',
    '清醒又带一点灵气',
    '稳稳的高级感',
    '不费力的东方美'
  ];
  document.getElementById('ovId').textContent = moodTags[Math.floor(Math.random() * moodTags.length)];

  // cards
  const grid = document.getElementById('resultGrid');
  grid.innerHTML = '';
  recs.forEach((m, i) => {
    const pairing = getPairingBundle(m);
    const drill = getDrillDown(m);
    const moodTags = getCardMoodTags(m, birthProfile);
    const el = document.createElement('article');
    el.className = 'rc' + (i === 0 ? ' primary' : '');
    el.innerHTML = `
      <div class="rc-top">
        <div class="rc-swatch ${m.swatch}"></div>
        <div>
          <div class="rc-name">${m.name}</div>
          <div class="rc-cat">${m.cat}</div>
        </div>
      </div>
      ${renderRadar(m, d, birthProfile)}
      <figure class="product-photo result-photo">
        <img src="${PRODUCT_IMAGES[m.key]}" alt="${m.name}成品参考图" loading="lazy" />
        <figcaption>成品参考 · 以实物与证书为准</figcaption>
      </figure>
      <div class="rc-verdict">
        <span>${i === 0 ? '最推荐先试' : '备选方向 ' + (i + 1)}</span>
        <strong>${getBalanceVerdict(m, birthProfile)}</strong>
        <div class="rc-tags">${moodTags.map(tag => `<em>${tag}</em>`).join('')}</div>
      </div>
      <div class="rc-row compliment"><b>气质命中</b>${m.compliment}</div>
      <div class="rc-info-grid">
        <div class="rc-mini rc-balance"><b>它在补什么</b><span>${getBalanceReason(m, birthProfile)}</span></div>
        <div class="rc-mini rc-soft"><b>戴上是什么感觉</b><span>${getSoftReason(m, d, personaProfile)}</span></div>
        <div class="rc-mini rc-pairing"><b>怎么搭不费力</b><strong>${pairing.title}</strong><span>${pairing.text}</span>
          <div class="pair-formula-strip" aria-label="${pairing.title}材质公式">
            ${pairing.keys.map(k => `<span><i class="mat-swatch ${MATERIALS[k]?.swatch || ''}"></i>${MATERIALS[k]?.name || '搭配材质'}</span>`).join('')}
          </div>
        </div>
        <div class="rc-mini"><b>预算怎么花</b><span>${m.budgetTip}</span></div>
        <div class="rc-mini warn"><b>先别踩坑</b><span>${m.pitfall}</span></div>
        <div class="rc-mini rc-drill">
          <b>下一步研究</b>
          <strong>先搜这些单品</strong>
          <div class="drill-list">
            ${drill.products.map(item => `<span>${item}</span>`).join('')}
          </div>
          <strong>小红书搜索词</strong>
          <div class="drill-tags">
            ${drill.searches.map(item => `<em>${item}</em>`).join('')}
          </div>
          <strong>账号 / 店铺参考</strong>
          <div class="drill-accounts">
            ${drill.accounts.map(item => `<span>${item}</span>`).join('')}
          </div>
          <p>${drill.tip}</p>
          <small>${drill.commonTip}</small>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
}

/* ---------- materials encyclopedia ---------- */
const ENCY = [
  { key:'fei', name:'翡翠', kw:'通透 · 灵动 · 贵气',
    origin:'缅甸为主,危地马拉等地亦有出产。',
    originDiff:'缅甸料在市场认知里更成熟，常见高色、高种水货源；危料也有漂亮蓝绿调，但整体商业定价更看颜色、透明度和证书标注，不能只听“产地故事”。',
    grades:'<span class="color-tags"><i style="--tag:#45a35d">阳绿</i><i style="--tag:#b7d7cf">晴水</i><i style="--tag:#7aa98f">飘花</i><i style="--tag:#b68bc7">紫罗兰</i><i style="--tag:#eef1ed">无色</i></span>常见种水：冰种、糯种、豆种；常见形制：平安扣、蛋面、手镯。',
    price:'种、水、色、工、瑕疵、尺寸、证书共同决定。透感与正色为最大变量。',
    valueFactors:'钱主要花在颜色正不正、透不透、肉细不细、有没有裂棉黑点、是不是 A 货证书、尺寸够不够饱满。高价不是因为“叫翡翠”，而是好颜色 + 好种水 + 少瑕疵同时出现很少。',
    suit:'喜欢清透感、希望提升气质、预算弹性较高的人群。',
    care:'避免高温与化学品。定期清水浸泡软布擦拭。高价件认准 NGTC / GIA / 国检 A 货证书。'
  },
  { key:'hetian', name:'和田玉', kw:'温润 · 内敛 · 长期佩戴',
    origin:'新疆和田、青海、俄罗斯、韩国;籽料以新疆为贵。',
    originDiff:'新疆料更强调油润、老熟和皮色故事；青海料常见水透感强、颜色干净；俄料白度容易出彩但有时结构感更明显；韩料通常入门价位多，适合先试审美。',
    grades:'<span class="color-tags"><i style="--tag:#eee8d7">白玉</i><i style="--tag:#d7dac5">青白玉</i><i style="--tag:#8f9a7a">青玉</i><i style="--tag:#386647">碧玉</i><i style="--tag:#222820">墨玉</i><i style="--tag:#d7b35b">黄口</i><i style="--tag:#b98262">糖玉</i></span>颜色从白、青、绿、黑、黄到糖色过渡，整体以温润感为核心。',
    price:'产地、油性、细度、白度、结构、雕工与皮色综合影响。',
    valueFactors:'钱主要花在油性、细度、白度、完整度、皮色、雕工和料型。新手别只追“白”，真正耐看的通常是细、润、结构舒服，且没有明显裂脏。',
    suit:'低调沉稳、希望长期佩戴的人;通勤与商务都适合。',
    care:'怕磕碰、怕酸碱;贴身佩戴能养出油润度。"羊脂"非鉴定术语,慎听话术。'
  },
  { key:'nanhong', name:'南红', kw:'明艳 · 喜庆 · 显白',
    origin:'云南保山、四川凉山为主。',
    originDiff:'保山料常被认为更温润、胶质感好，但多裂，精品完整珠成本高；凉山料颜色体系丰富、块度相对友好，适合做手串和雕件。',
    grades:'<span class="color-tags"><i style="--tag:#c3422e">柿子红</i><i style="--tag:#b93a51">玫瑰红</i><i style="--tag:#d84c45">樱桃红</i><i style="--tag:#f3d7cf">冰飘</i><i style="--tag:#d16432">火焰纹</i></span>红色越满、越润、越少裂，通常越受欢迎。',
    price:'颜色、满肉度、裂纹、胶感、雕工。',
    valueFactors:'钱主要花在颜色是否浓郁均匀、满肉程度、裂多不多、珠子是否规整、是否注胶染色。满色满肉又少裂的圆珠，会比普通冰飘或杂色料贵很多。',
    suit:'喜欢红色系、增强存在感、送礼场景。',
    care:'怕高温与汗渍油脂浸染。注胶染色普遍,认准光线透射均匀的料子。'
  },
  { key:'milla', name:'蜜蜡 / 琥珀', kw:'温暖 · 复古 · 轻盈',
    origin:'波罗的海产区为主,缅甸琥珀为辅。',
    originDiff:'波罗的海蜜蜡市场流通量大，颜色从鸡油黄到白蜜都常见；缅甸琥珀年份更老、品类复杂，常见金珀、血珀等，但更需要看清优化和证书。',
    grades:'<span class="color-tags"><i style="--tag:#e2aa28">鸡油黄</i><i style="--tag:#eee0b8">白蜜</i><i style="--tag:#d79028">金绞蜜</i><i style="--tag:#d7a34d">金珀</i><i style="--tag:#9f6028">老蜜蜡</i></span>从奶白、金黄到橙黄都有，暖色调是它的主要情绪价值。',
    price:'颜色、蜡质、克重、形制、优化处理。',
    valueFactors:'钱主要花在颜色饱满度、蜡质浓不浓、单颗克重、是否天然未压制、有没有漂亮流淌纹或包裹体。越大、越满蜜、越少优化，通常越贵。',
    suit:'喜欢暖色调、复古穿搭、怕压手与重物的人。',
    care:'怕高温、化学品与硬物刮擦。二代压制与烤色普遍,看皮壳风化纹。'
  },
  { key:'songshi', name:'绿松石', kw:'蓝绿 · 个性 · 民族风',
    origin:'湖北十堰为最负盛名,美国、伊朗亦有。',
    originDiff:'湖北十堰是国内认知度很高的产区，常见高瓷蓝绿和乌兰花；伊朗料以干净天蓝色出名；美国料常见独特铁线和矿口风格。产地会加分，但最终还是看瓷度和颜色。',
    grades:'<span class="color-tags"><i style="--tag:#2c94a8">高瓷蓝</i><i style="--tag:#40896f">高瓷绿</i><i style="--tag:#c7a64b">菜籽黄</i><i style="--tag:#2b7d82">乌兰花</i><i style="--tag:#b7dce0">蓝白料</i></span>颜色越干净、瓷度越高、铁线越漂亮，视觉辨识度越强。',
    price:'瓷度、颜色、铁线、块度、优化方式。',
    valueFactors:'钱主要花在瓷度够不够高、颜色是否均匀饱和、铁线是否漂亮、块度大小、是否原矿无优化。颜色好但瓷度低，佩戴稳定性和价格都会受影响。',
    suit:'喜欢个性叠戴、民族风穿搭的人。',
    care:'怕水怕汗易变色,长期佩戴自然变深属正常。注胶、合成普遍。'
  },
  { key:'crystal', name:'水晶', kw:'入门 · 颜色丰富 · 灵活',
    origin:'巴西、马达加斯加为主要产地。',
    originDiff:'巴西水晶品类多、流通成熟；马达加斯加常见粉晶、海蓝宝、水晶族矿物。普通白水晶不必过度迷信产地，高价更多来自净度、颜色和特殊内含物。',
    grades:'<span class="color-tags"><i style="--tag:#f7f7f5">白水晶</i><i style="--tag:#8661a6">紫水晶</i><i style="--tag:#e8b6c2">粉晶</i><i style="--tag:#d9b044">黄水晶</i><i style="--tag:#7a5945">茶晶</i><i style="--tag:#1b1715">黑曜石</i></span>颜色跨度大，适合用来做入门尝试和配色练习。',
    price:'净度、颜色、晶体、大小、稀有度。合成品价格便宜。',
    valueFactors:'钱主要花在晶体是否通透、棉裂多少、颜色是否天然浓郁、珠径大小、是否有发丝/幽灵/包裹体等观赏点。普通水晶价格天花板不高，别为“能量话术”多付钱。',
    suit:'预算较低、希望快速尝试或喜欢颜色表达的年轻人群。',
    care:'怕高温与暴晒(部分会褪色)。多数水晶可清水清洗后柔布擦干。'
  },
  { key:'chenxiang', name:'沉香', kw:'静心 · 商务 · 香韵',
    origin:'越南、印尼、马来西亚、海南。',
    originDiff:'越南惠安系常被喜欢凉甜、清雅香韵的人追捧；印尼、马来西亚星洲系常见奶甜、厚重、扩散感；海南沉香文化认知高，但高等级真货稀缺，故事溢价也多。',
    grades:'<span class="color-tags"><i style="--tag:#8a6242">浅褐</i><i style="--tag:#4d2f20">深褐</i><i style="--tag:#1d1714">黑油线</i><i style="--tag:#b0813e">黄油脂</i></span>常按惠安系、星洲系和沉水程度区分，颜色与油脂线会影响观感。',
    price:'产区、油脂、香韵、沉水程度、野生/人工。',
    valueFactors:'钱主要花在油脂含量、香韵层次、是否沉水、产区稀缺性、野生还是人工结香。沉香不是越黑越贵，香气干净、持久、有层次才是核心。',
    suit:'商务社交、禅修、香道、收藏与高端送礼场景。',
    care:'怕酒精、化学品与高温;贴身佩戴会激发香韵。真假极复杂,新手建议人工陪同。'
  },
  { key:'tanmu', name:'檀木 / 木质文玩', kw:'沉稳 · 质朴 · 入门友好',
    origin:'印度小叶紫檀;海南/越南黄花梨;老山檀;太行崖柏。',
    originDiff:'小叶紫檀看油密、棕眼和金星表现；黄花梨看纹理和油性，海南料市场认知更高；老山檀重香气和密度；崖柏则更看造型纹理与香味稳定性。',
    grades:'<span class="color-tags"><i style="--tag:#54291d">紫褐</i><i style="--tag:#a36b35">黄褐</i><i style="--tag:#caa55a">金丝纹</i><i style="--tag:#7a4a2b">虎皮纹</i><i style="--tag:#6c3b24">瘤疤纹</i></span>常见木种包括小叶紫檀、老山檀、崖柏、金丝楠、黄花梨。',
    price:'木种、密度、油性、纹理、年份、香气。',
    valueFactors:'钱主要花在木种是否对版、密度油性、纹理稀缺度、珠子是否顺纹同料、尺寸和做工。普通木珠便宜，贵的是稳定油密、纹理漂亮且成串统一。',
    suit:'喜欢自然质感、男士与中性风格;预算跨度大,可长期盘玩。',
    care:'忌水、忌大温差。前 1 个月以净手轻盘为主,避免硬物刮擦。'
  }
];

const mGrid = document.getElementById('materialsGrid');
const detailPanel = document.createElement('aside');
detailPanel.className = 'material-detail-panel';
detailPanel.id = 'materialDetailPanel';
detailPanel.setAttribute('aria-live', 'polite');
detailPanel.innerHTML = `
  <div class="detail-empty">
    <span>点选上方任一材质</span>
    <strong>这里会展开产区、品种和价格逻辑</strong>
  </div>
`;
if (mGrid) mGrid.insertAdjacentElement('afterend', detailPanel);

function renderMaterialDetail(m) {
  detailPanel.innerHTML = `
    <div class="detail-panel-head">
      <div class="mat-swatch sw-${m.key}"></div>
      <div>
        <span>材质详解</span>
        <h3>${m.name}</h3>
        <p>${m.kw}</p>
      </div>
      <button type="button" class="detail-close" aria-label="收起材质详情">收起</button>
    </div>
    <div class="detail-panel-grid">
      <div class="detail-cell"><dt>主要产区</dt><dd>${m.origin}</dd></div>
      <div class="detail-cell origin-row"><dt>产区差异</dt><dd>${m.originDiff}</dd></div>
      <div class="detail-cell"><dt>常见品种</dt><dd>${m.grades}</dd></div>
      <div class="detail-cell"><dt>价格影响</dt><dd>${m.price}</dd></div>
      <div class="detail-cell value-row"><dt>钱花在哪</dt><dd>${m.valueFactors}</dd></div>
      <div class="detail-cell"><dt>适合人群</dt><dd>${m.suit}</dd></div>
      <div class="detail-cell"><dt>保养与注意</dt><dd>${m.care}</dd></div>
    </div>
  `;
  detailPanel.classList.add('show');
  detailPanel.querySelector('.detail-close')?.addEventListener('click', () => {
    detailPanel.classList.remove('show');
    document.querySelectorAll('.mat-card.open').forEach(card => card.classList.remove('open'));
    if (mGrid && detailPanel.parentElement !== mGrid.parentElement) {
      mGrid.insertAdjacentElement('afterend', detailPanel);
    }
  });
}

function moveDetailPanelAfterCardRow(card) {
  if (!mGrid) return;
  const cards = Array.from(mGrid.querySelectorAll('.mat-card'));
  const clickedTop = Math.round(card.getBoundingClientRect().top);
  const rowCards = cards.filter(item => Math.abs(Math.round(item.getBoundingClientRect().top) - clickedTop) < 8);
  const lastInRow = rowCards[rowCards.length - 1] || card;
  lastInRow.insertAdjacentElement('afterend', detailPanel);
}

ENCY.forEach(m => {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `mat-card ${m.key}`;
  el.innerHTML = `
    <div class="mat-top">
      <div class="mat-swatch sw-${m.key}"></div>
      <div class="mat-name">${m.name}</div>
    </div>
    <figure class="product-photo">
      <img src="${PRODUCT_IMAGES[m.key]}" alt="${m.name}成品参考图" loading="lazy" />
      <figcaption>成品参考图</figcaption>
    </figure>
    <div class="mat-kw">${m.kw}</div>
    <div class="mat-mini">展开了解</div>
  `;
  el.addEventListener('click', () => {
    const isOpen = el.classList.contains('open');
    document.querySelectorAll('.mat-card.open').forEach(card => card.classList.remove('open'));
    if (isOpen) {
      detailPanel.classList.remove('show');
      return;
    }
    el.classList.add('open');
    moveDetailPanelAfterCardRow(el);
    renderMaterialDetail(m);
    requestAnimationFrame(() => {
      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
  mGrid.appendChild(el);
});

/* ---------- pairing scenes ---------- */
const PAIRS = [
  { scene:'COMMUTE · 通勤低调', title:'通勤低调',
    sub:'每天戴、不抢戏、好搭配。',
    style:'手腕近景 · 米白针织 · 自然窗光',
    visual:['hetian','crystal','chenxiang'], hero:'hetian',
    elements:['白衬衫','米色针织','电脑包','低饱和通勤'],
    items:[
      ['主材','和田青白玉小平安扣 / 无事牌'],
      ['配饰','银扣或暖金小件'],
      ['色彩','米白 · 烟灰 · 墨绿'],
      ['禁忌','避免艳色玛瑙叠戴']
    ],
    budget:'¥800 – ¥3,000', tag:'适合每天佩戴' },
  { scene:'BUSINESS · 商务稳重', title:'商务稳重',
    sub:'气场内敛、近距离社交合宜。',
    style:'茶席平铺 · 深棕木调 · 低饱和',
    visual:['chenxiang','tanmu','hetian'], hero:'chenxiang',
    elements:['深色西装','茶席会谈','皮质公文包','近距离质感'],
    items:[
      ['主材','沉香小手串 + 墨玉桶珠'],
      ['配饰','黑檀/小叶紫檀隔珠'],
      ['色彩','墨绿 · 深褐 · 暖金'],
      ['禁忌','不与高瓷绿松石同串']
    ],
    budget:'¥3,000 – ¥10,000', tag:'适合商务场合' },
  { scene:'GLOW · 明艳显白', title:'明艳显白',
    sub:'冷皮提气色,聚会与节日适用。',
    style:'手腕特写 · 红金对比 · 暖光',
    visual:['nanhong','milla','hetian'], hero:'nanhong',
    elements:['黑色上衣','节日聚会','暖金配件','拍照提气色'],
    items:[
      ['主材','保山柿红南红圆珠 12mm'],
      ['配饰','白蜜或老蜜蜡桶珠'],
      ['色彩','柿红 · 金黄 · 米白'],
      ['禁忌','远离冷调绿松石']
    ],
    budget:'¥1,500 – ¥5,000', tag:'冷皮显白' },
  { scene:'ZEN · 禅意清冷', title:'禅意清冷',
    sub:'清而不冷,文人质感。',
    style:'书房近景 · 透白烟茶 · 留白',
    visual:['crystal','hetian','tanmu'], hero:'crystal',
    elements:['棉麻外套','茶咖空间','雾灰白色','留白感'],
    items:[
      ['主材','和田白玉平安扣 / 白水晶'],
      ['配饰','茶晶或老山檀隔珠'],
      ['色彩','透白 · 烟茶 · 银白'],
      ['禁忌','避免高饱和色块']
    ],
    budget:'¥500 – ¥3,000', tag:'禅意通勤' },
  { scene:'GIFT · 礼赠体面', title:'礼赠体面',
    sub:'寓意明确,锦盒呈现。',
    style:'礼盒摆拍 · 青绿暖金 · 证书同框',
    visual:['fei','hetian','milla'], hero:'fei',
    elements:['锦盒包装','长辈礼','暖金链','证书随附'],
    items:[
      ['主材','翡翠平安扣 / 无事牌 / 生肖挂件'],
      ['配饰','18K 暖金链 + 锦盒'],
      ['色彩','糯种青绿 · 暖金'],
      ['禁忌','勿送过于个人风格的颜色']
    ],
    budget:'¥2,000 – ¥10,000', tag:'长辈与重要礼赠' },
  { scene:'COLLECT · 收藏进阶', title:'收藏进阶',
    sub:'稀缺与品相为先,认准证书。',
    style:'单品陈列 · 纹理特写 · 证书核验',
    visual:['hetian','fei','chenxiang'], hero:'chenxiang',
    elements:['独立收纳','放大镜看纹理','证书核验','单品陈列'],
    items:[
      ['主材','籽料和田玉 / 高翡 / 高等级沉香'],
      ['配饰','单品独立呈现,慎做组合'],
      ['色彩','以单材本色为主'],
      ['禁忌','回避非权威机构鉴定']
    ],
    budget:'¥10,000 +', tag:'认准 NGTC / GIA 证书' },
];

const pGrid = document.getElementById('pairingGrid');
PAIRS.forEach(p => {
  const el = document.createElement('article');
  el.className = 'pair-card';
  el.innerHTML = `
    <div class="pair-scene">${p.scene}</div>
    <h3>${p.title}</h3>
    <p class="pair-sub">${p.sub}</p>
    <div class="pair-visual">
      <div class="pair-cover">
        <img src="${PRODUCT_IMAGES[p.hero]}" alt="${MATERIALS[p.hero]?.name || p.title}场景参考图" loading="lazy" />
        <span>${p.style}</span>
      </div>
      <div class="pair-formula">
        <strong>搭配公式</strong>
        <div class="pair-beads">
          ${p.visual.map(k => `<i class="mat-swatch sw-${k}" title="${MATERIALS[k]?.name || '搭配材质'}"></i>`).join('')}
        </div>
        ${p.visual.map(k => `<span>${MATERIALS[k]?.name || '搭配材质'}</span>`).join('')}
      </div>
    </div>
    <div class="scene-elements">
      ${p.elements.map(item => `<span>${item}</span>`).join('')}
    </div>
    <ul class="pair-list">
      ${p.items.map(([k,v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}
    </ul>
    <div class="pair-budget"><strong>${p.budget}</strong><span>${p.tag}</span></div>
  `;
  pGrid.appendChild(el);
});

/* ---------- smooth scroll for anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const t = document.querySelector(id);
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
