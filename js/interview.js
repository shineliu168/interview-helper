/**
 * 面试题生成器 - 纯 JS 版本
 * 基于规则模板，根据 JD 技能和用户经历动态生成面试问题
 */

// ==================== 模板库 ====================

const SELF_INTRO_TEMPLATES = [
  {
    question: '请用 1-2 分钟做一个简短的自我介绍',
    hint: '建议按"我是谁（教育/背景）→ 我做过什么（核心经历）→ 为什么适合这个岗位（能力匹配）"的三段式结构回答，控制在一分半钟左右最佳。'
  },
  {
    question: '请介绍一下你的职业背景和核心优势',
    hint: '聚焦于与目标岗位最相关的 2-3 个核心能力，每个用一两句话带过一个具体成果，避免流水账式的履历复述。'
  },
];

const TECHNICAL_TEMPLATES = [
  {
    template: '请介绍一下你在 {skill} 方面的项目经验',
    hint: '用 STAR 法则：描述项目背景(S)、你的具体任务(T)、你采取的行动(A)、以及最终成果(R)。尽量量化成果。'
  },
  {
    template: '你在使用 {skill} 时遇到过什么技术挑战？是如何解决的？',
    hint: '选一个真实的、有代表性的技术难题。重点展示你的分析思路和解决问题的过程，而不只是结果。'
  },
  {
    template: '请谈谈你对 {skill} 核心原理的理解',
    hint: '用通俗的语言解释核心概念，如果可能，结合一个你实际使用的场景来说明。展示深度理解而非背诵定义。'
  },
  {
    template: '如果一个项目需要从零开始搭建 {skill} 相关的技术方案，你会怎么规划？',
    hint: '展示你的技术选型思路：考虑业务需求、团队能力、可维护性、扩展性等因素。分阶段说明规划。'
  },
];

const BEHAVIORAL_QUESTIONS = [
  {
    question: '请描述一次你解决过的最大技术难题',
    hint: '用 STAR 法则回答。强调问题的复杂度、你的分析过程、尝试过的方案、以及最终如何攻克。'
  },
  {
    question: '你有没有和同事意见不合的经历？你是怎么处理的？',
    hint: '展示你处理冲突的成熟度。承认分歧是正常的，重点是你如何通过沟通、数据和同理心来达成共识。'
  },
  {
    question: '描述一次你在紧迫时间压力下完成项目的经历',
    hint: '强调你的优先级管理能力、在压力下的决策能力。说明你如何确保质量不受影响的同时按时交付。'
  },
  {
    question: '请分享一次你主动推动某项改进或创新的经历',
    hint: '展示你的主动性和主人翁意识。说明你如何发现问题、提出方案、获得支持并推动落地。'
  },
  {
    question: '你是如何保持技术学习和成长的？',
    hint: '展示你是一个持续学习者。举例说明最近学习的一项新技术或知识，以及如何应用到实际工作中。'
  },
  {
    question: '描述一次项目失败或没有达到预期的经历，你从中学到了什么？',
    hint: '坦诚面对失败，重点是你如何复盘、吸取教训并在后续工作中改进。这体现了你的成长心态。'
  },
  {
    question: '如何跟非技术人员（如产品、运营）解释一个技术方案？',
    hint: '展示你的沟通和换位思考能力。用非技术人员能理解的比喻或场景来说明技术概念。'
  },
  {
    question: '描述一个你通过数据分析做出决策的例子',
    hint: '强调数据驱动思维。说明你获取了哪些数据、如何分析、得出了什么结论、最终决策产生了什么效果。'
  },
];

const PROJECT_TEMPLATES = [
  {
    template: '请详细介绍你在 {company} 做的「{achievement}」这个项目',
    hint: '先概述项目背景和目标，再说明你的角色和贡献，最后展示项目成果和数据指标。'
  },
  {
    template: '在「{achievement}」这个项目中，你遇到的最大技术挑战是什么？',
    hint: '讲一个具体的技术难题，描述你的分析思路、尝试过的方案、以及最终解决方案。'
  },
  {
    template: '「{achievement}」这个项目带来了怎样的业务价值或数据提升？',
    hint: '尽可能量化你的贡献。用具体数字（提升了 X%、节省了 Y 时间、服务了 Z 用户等）来证明你的工作价值。'
  },
  {
    template: '如果让你重新做「{achievement}」这个项目，你会怎么改进？',
    hint: '展示你的反思能力。从技术选型、架构设计、流程优化等角度提出改进点，同时也说明当时选择某些方案的原因。'
  },
];

// ==================== 主生成函数 ====================

function generateInterviewQuestions(jdText, experiences) {
  const questions = {
    self_intro: [],
    technical: [],
    behavioral: [],
    project_deep_dive: []
  };

  // 1. 自我介绍
  questions.self_intro = [...SELF_INTRO_TEMPLATES];

  // 2. 技术问题
  const jdSkills = extractSkills(jdText);
  const allSkills = new Set(jdSkills);
  experiences.forEach(exp => (exp.skills || []).forEach(s => allSkills.add(s)));
  const skillList = [...allSkills];

  // 随机选 2-4 个技能
  const shuffled = skillList.sort(() => Math.random() - 0.5);
  const selectedSkills = shuffled.slice(0, Math.min(4, Math.max(2, skillList.length)));

  selectedSkills.forEach(skill => {
    const template = TECHNICAL_TEMPLATES[Math.floor(Math.random() * TECHNICAL_TEMPLATES.length)];
    questions.technical.push({
      question: template.template.replace('{skill}', skill),
      hint: template.hint
    });
  });

  if (!questions.technical.length) {
    questions.technical = [
      { question: '请介绍一下你使用过的核心技术栈', hint: '选择 2-3 个与岗位最相关的核心技术，分别说明你的熟悉程度和实际项目经验。' },
      { question: '你是如何保证代码质量的？', hint: '从代码审查、单元测试、编码规范、自动化测试等多个角度说明你的实践。' },
    ];
  }

  // 3. 行为问题（随机选 3-5 题）
  const behavioralPool = [...BEHAVIORAL_QUESTIONS].sort(() => Math.random() - 0.5);
  questions.behavioral = behavioralPool.slice(0, Math.min(5, Math.max(3, behavioralPool.length)));

  // 4. 项目深挖
  experiences.forEach(exp => {
    const achievements = exp.achievements || [];
    if (achievements.length) {
      const selected = achievements.sort(() => Math.random() - 0.5).slice(0, 2);
      selected.forEach(ach => {
        const template = PROJECT_TEMPLATES[Math.floor(Math.random() * PROJECT_TEMPLATES.length)];
        questions.project_deep_dive.push({
          question: template.template
            .replace('{company}', exp.company_name || '该公司')
            .replace('{achievement}', ach.title || '这个项目'),
          hint: template.hint
        });
      });
    }
  });

  if (!questions.project_deep_dive.length) {
    questions.project_deep_dive = [
      { question: '请分享一个你最有成就感的项目', hint: '选择一个最能体现你技术能力和影响力的项目，详细说明你的角色、贡献和成果。' },
      { question: '在过去的项目中，你学到了哪些最重要的经验？', hint: '总结 2-3 条关键经验，每条结合具体项目经历来说明。' },
    ];
  }

  return questions;
}
