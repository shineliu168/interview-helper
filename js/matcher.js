/**
 * 智能匹配引擎 - 纯 JS 版本
 * 
 * 算法：关键词重叠度 + 技能 Jaccard 相似度
 * 由于浏览器端没有 jieba 和 scikit-learn，改用基于词典的中文分词 + TF 简易匹配
 */

// ==================== 中文分词词典 ====================
// 常见的技术/职业相关双字词，用于将中文文本切分为有意义的词
const DICT_WORDS = [
  // 职位相关
  '开发','工程师','架构师','经理','总监','主管','分析师','设计师','产品','运营',
  '前端','后端','全栈','移动','数据','算法','测试','运维','安全','网络',
  '负责','参与','完成','搭建','设计','实现','优化','维护','管理','带领',
  // 技术名词
  '服务','系统','平台','框架','组件','模块','接口','协议','架构','容器',
  '部署','发布','监控','日志','缓存','队列','集群','分布式','微服务','中台',
  '数据库','搜索引擎','消息队列','对象存储','负载均衡','网关','代理',
  // 日常词汇
  '需求','项目','团队','产品','业务','客户','用户','方案','文档','流程',
  '经验','能力','沟通','协作','学习','分析','解决','推动','落地','交付',
  '性能','稳定','可靠','安全','高效','可扩展','可维护','质量','规范','标准',
  // 行业
  '金融','电商','教育','医疗','游戏','社交','物流','出行','餐饮','零售',
  '互联网','移动互联网','人工智能','大数据','云计算','物联网','区块链',
];

// 构建词典 Set 用于快速查找
const DICT_SET = new Set(DICT_WORDS);

/**
 * 简易中文分词
 * 策略：正向最大匹配 + 英文单词/数字提取
 */
function tokenize(text) {
  if (!text) return [];
  const tokens = [];

  // 提取英文单词和数字
  const englishParts = text.match(/[a-zA-Z][a-zA-Z0-9_.+#]*/g) || [];
  englishParts.forEach(w => {
    if (w.length > 1) tokens.push(w.toLowerCase());
  });

  // 中文分词：正向最大匹配
  // 先去掉非中文字符
  const chineseText = text.replace(/[^\u4e00-\u9fa5]/g, '');
  let i = 0;
  while (i < chineseText.length) {
    let matched = false;
    // 从最长（4字）开始尝试匹配
    for (let len = Math.min(4, chineseText.length - i); len >= 2; len--) {
      const word = chineseText.substring(i, i + len);
      if (DICT_SET.has(word)) {
        tokens.push(word);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 未匹配到词典词，逐字跳过
      i++;
    }
  }

  return tokens;
}

// ==================== 停用词 ====================
const STOPWORDS = new Set([
  '的','了','在','是','我','有','和','就','不','人','都','一','一个','上','也',
  '很','到','说','要','去','你','会','着','没有','看','好','自己','这','他','她',
  '它','们','那','些','所','为','所以','因为','但是','然而','虽然','如果','可以',
  '这个','那个','什么','怎么','如何','为什么','与','及','以及','或','但','而',
  '而且','且','并','并且','对','对于','关于','把','被','让','从','以','按照',
  '根据','通过','经过','向','往','朝','当','于','比','除了','还','又','再','才',
  '刚','已经','曾','曾经','将','将要','能','能够','可能','应该','需要','必须',
  '得','着','了','过','之','其','该','各','每','某','另','来','做','干','搞',
  '弄','进行','实现','完成','提供','使用','包括','具有','拥有','负责','参与',
  '相关','等','等等','之类','其他','以上','以下','以后','以前','中','里','内',
  '外','前','后','目前','现在','过去','未来','较','更','最','非常','十分',
  '比较','相当','多','少','许多','一些','一点','几个','吗','呢','吧','啊',
  '哦','嗯','只','仅','只是','就是','还是','或者','可','却','则','便',
]);

// ==================== 技能词典 ====================
const SKILL_PATTERNS = [
  // 编程语言
  'Python','Java','JavaScript','TypeScript','Go','Rust','C\\+\\+','C#',
  'Ruby','PHP','Swift','Kotlin','Scala','Shell','Bash','Perl','Lua','Dart',
  // 前端
  'React','Vue','Angular','Svelte','jQuery','Bootstrap',
  'HTML5?','CSS3?','Sass','Less','Webpack','Vite','Babel',
  'Next\\.js','Nuxt\\.js','Redux','MobX',
  // 后端
  'Django','Flask','FastAPI','Spring','Spring Boot','Spring Cloud',
  'Express','Nest\\.js','Koa','Laravel','Rails','Gin',
  'Node\\.js','Deno',
  // 数据库
  'MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch',
  'SQLite','Oracle','SQL Server','MariaDB','Cassandra','Neo4j',
  // DevOps
  'Docker','Kubernetes','K8s','AWS','Azure','GCP','阿里云',
  'CI/CD','Jenkins','GitLab CI','GitHub Actions','Terraform',
  'Ansible','Prometheus','Grafana','Nginx','Apache',
  // 大数据/AI
  'Hadoop','Spark','Flink','Kafka','RabbitMQ',
  'TensorFlow','PyTorch','Pandas','NumPy',
  '机器学习','深度学习','NLP','计算机视觉',
  // 移动端
  'Android','iOS','Flutter','React Native','UniApp',
  // 通用技能
  '项目管理','团队管理','需求分析','数据分析','用户研究',
  '性能优化','系统架构','微服务','敏捷开发','产品设计',
  '技术方案','API设计','代码审查','测试驱动',
  '持续集成','持续部署','版本控制',
  'Git','SVN','Linux','Unix',
  'RESTful','GraphQL','gRPC','WebSocket',
  'OAuth','JWT','SSO',
  // 软技能
  '沟通能力','团队协作','领导力','解决问题','时间管理',
  '演讲能力','文档编写','跨部门协作','商务谈判',
];

// 预编译正则
const COMPILED_SKILL_REGEXES = SKILL_PATTERNS.map(p => new RegExp(p, 'gi'));


/**
 * 从文本中提取技能关键词
 */
function extractSkills(text) {
  if (!text) return [];
  const found = new Set();
  COMPILED_SKILL_REGEXES.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => found.add(m.trim()));
    }
  });
  return [...found].sort();
}


/**
 * 计算两个词数组的重叠度 (Jaccard)
 */
function jaccardSimilarity(setA, setB) {
  if (!setA.length || !setB.length) return 0;
  const a = new Set(setA.map(s => s.toLowerCase()));
  const b = new Set(setB.map(s => s.toLowerCase()));
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}


/**
 * 计算词频 (TF)
 */
function termFrequency(tokens) {
  const freq = {};
  tokens.forEach(t => {
    if (!STOPWORDS.has(t) && t.length > 1) {
      freq[t] = (freq[t] || 0) + 1;
    }
  });
  return freq;
}


/**
 * 计算两个词频字典的余弦相似度
 */
function cosineSimilarity(tf1, tf2) {
  const allKeys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dotProduct = 0, mag1 = 0, mag2 = 0;
  allKeys.forEach(key => {
    const v1 = tf1[key] || 0;
    const v2 = tf2[key] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });
  const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
  return denom > 0 ? dotProduct / denom : 0;
}


/**
 * 核心：计算每条经历与 JD 的匹配分数
 * 
 * @param {string} jdText - JD 全文
 * @param {Array} experiences - 经历列表
 * @returns {Array} - 每条经历的匹配结果 {experienceId, score, matchedSkills}
 */
function computeMatchScores(jdText, experiences) {
  if (!experiences.length) return [];

  // 1. 对 JD 分词并计算词频
  const jdTokens = tokenize(jdText);
  const jdTF = termFrequency(jdTokens);

  // 2. 提取 JD 中的技能
  const jdSkills = extractSkills(jdText);

  // 3. 提取 JD 关键词（按词频排序取 top 20）
  const jdKeywords = Object.entries(jdTF)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  // 4. 对每条经历计算匹配分数
  const results = experiences.map(exp => {
    // 拼接经历文本
    const expText = [
      exp.company_name, exp.position,
      ...exp.achievements.map(a => a.title + ' ' + a.description),
      ...exp.skills
    ].join(' ');

    // 分词 + 词频
    const expTokens = tokenize(expText);
    const expTF = termFrequency(expTokens);

    // 提取经历技能
    const expSkills = exp.skills || [];

    // 余弦相似度
    const cosine = cosineSimilarity(jdTF, expTF);

    // 技能 Jaccard 重叠度
    const jaccard = jaccardSimilarity(jdSkills, expSkills);

    // 综合评分：70% 余弦 + 30% Jaccard
    const composite = 0.7 * cosine + 0.3 * jaccard;

    // 匹配到的技能
    const matchedSkills = jdSkills.filter(s =>
      expSkills.some(es => es.toLowerCase() === s.toLowerCase())
    );

    return {
      experienceId: exp.id,
      score: Math.round(composite * 1000) / 10, // 0-100, 一位小数
      matchedSkills
    };
  });

  // 5. 归一化到 0-100（最高分为 100）
  const maxScore = Math.max(...results.map(r => r.score));
  if (maxScore > 0) {
    results.forEach(r => {
      r.score = Math.round(r.score / maxScore * 1000) / 10;
    });
  }

  // 6. 按分数降序
  results.sort((a, b) => b.score - a.score);

  return { results, keywords: jdKeywords, jdSkills };
}
