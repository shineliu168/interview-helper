/**
 * 面试简历助手 - 单页应用核心逻辑
 * 处理页面路由、数据绑定和所有交互
 */

// ==================== 全局状态 ====================
let currentPage = 'home';
let currentMatchId = null;
let interviewState = { category: 'self_intro', mode: 'browse', index: 0, questions: null };

const CATEGORY_NAMES = {
  self_intro: '👋 自我介绍',
  technical: '💻 技术问题',
  behavioral: '🤝 行为问题',
  project_deep_dive: '🔬 项目深挖'
};

// ==================== 路由 ====================

function navigate(page, params) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  // 更新导航高亮
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMapping = { home: 'home', profile: 'profile', experiences: 'experiences', match: 'match', resume: 'match', interview: 'match' };
  const navItem = document.querySelector(`.nav-item[data-page="${navMapping[page] || page}"]`);
  if (navItem) navItem.classList.add('active');

  currentPage = page;

  // 页面初始化
  switch (page) {
    case 'home': initHomePage(); break;
    case 'profile': initProfilePage(); break;
    case 'experiences': initExperiencesPage(); break;
    case 'match': break; // 不重置匹配页
    case 'resume': initResumePage(params); break;
    case 'interview': initInterviewPage(params); break;
  }

  window.scrollTo(0, 0);
}

// ==================== 首页 ====================

function initHomePage() {
  const exps = DataStore.getExperiences();
  const matches = DataStore.getMatches();
  const profile = DataStore.getProfile();

  document.getElementById('stat-exp').textContent = exps.length;
  document.getElementById('stat-match').textContent = matches.length;
  document.getElementById('stat-resume').textContent = matches.length;

  document.getElementById('guide-banner').style.display = exps.length === 0 ? 'block' : 'none';

  const listEl = document.getElementById('recent-matches-list');
  if (matches.length > 0) {
    listEl.innerHTML = matches.slice(0, 5).map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--color-gray-100);">
        <div>
          <span style="font-weight:600;">${escapeHtml(m.jobTitle || '未命名岗位')}</span>
          <span style="color:var(--color-gray-500);margin-left:8px;font-size:0.85rem;">${escapeHtml(m.companyName || '')}</span>
          <div style="font-size:0.78rem;color:var(--color-gray-400);margin-top:2px;">${(m.createdAt || '').split('T')[0]}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="navigate('resume','${m.id}')">查看简历</button>
          <button class="btn btn-primary btn-sm" onclick="navigate('interview','${m.id}')">准备面试</button>
        </div>
      </div>
    `).join('');
  } else {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">暂无匹配记录</div><div class="empty-state-hint">去「岗位匹配」粘贴 JD 开始分析吧</div></div>';
  }
}

// ==================== 个人资料 ====================

function initProfilePage() {
  const p = DataStore.getProfile();
  document.getElementById('pf-name').value = p.name || '';
  document.getElementById('pf-email').value = p.email || '';
  document.getElementById('pf-phone').value = p.phone || '';
  document.getElementById('pf-education').value = p.education || '';
  document.getElementById('pf-summary').value = p.summary || '';
}

function saveProfilePage() {
  DataStore.saveProfile({
    name: document.getElementById('pf-name').value.trim(),
    email: document.getElementById('pf-email').value.trim(),
    phone: document.getElementById('pf-phone').value.trim(),
    education: document.getElementById('pf-education').value.trim(),
    summary: document.getElementById('pf-summary').value.trim()
  });
  showToast('保存成功', 'success');
}

// ==================== 经历管理 ====================

function initExperiencesPage() { renderExperiences(); }

function renderExperiences() {
  const list = document.getElementById('experiences-list');
  const exps = DataStore.getExperiences();

  if (!exps.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">还没有添加任何工作经历</div><div class="empty-state-hint">点击右上角「新增经历」按钮开始添加</div></div>';
    return;
  }

  list.innerHTML = exps.map(exp => `
    <div class="experience-card">
      <div class="exp-timeline">
        <div class="exp-date">${formatDate(exp.start_date)}</div>
        <div class="exp-date">— ${formatDate(exp.end_date)}</div>
      </div>
      <div class="exp-content">
        <div class="exp-company">${escapeHtml(exp.company_name)}</div>
        <div class="exp-position">${escapeHtml(exp.position)}</div>
        ${(exp.skills||[]).length ? `<div class="exp-skills tag-group" style="margin-top:6px;">${exp.skills.map(s=>`<span class="badge badge-blue">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
        ${(exp.achievements||[]).length ? `<div class="exp-achievements">${exp.achievements.map(a=>`<div class="exp-achievement-item"><div class="exp-achievement-title">${escapeHtml(a.title)}</div><div class="exp-achievement-desc">${escapeHtml(a.description)}</div></div>`).join('')}</div>` : ''}
      </div>
      <div class="exp-actions">
        <button class="btn btn-ghost btn-sm" onclick="openExperienceForm('${exp.id}')" title="编辑">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteExp('${exp.id}')" title="删除">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openExperienceForm(expId) {
  const isEdit = !!expId;
  const exp = isEdit ? DataStore.getExperience(expId) : { company_name:'',position:'',start_date:'',end_date:'',achievements:[],skills:[] };
  if (isEdit && !exp) return;

  const achHTML = (exp.achievements||[]).map(a => `
    <div class="achievement-row" style="display:flex;gap:8px;margin-bottom:8px;">
      <div style="flex:1;">
        <input type="text" class="form-input ach-title" value="${escapeHtml(a.title)}" placeholder="成果标题" style="margin-bottom:4px;">
        <textarea class="form-textarea ach-desc" placeholder="成果描述" rows="2">${escapeHtml(a.description)}</textarea>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.achievement-row').remove()" style="flex-shrink:0;align-self:flex-start;">✕</button>
    </div>
  `).join('');

  const skillHTML = (exp.skills||[]).map(s => `<span class="tag tag-removable" onclick="this.remove()">${escapeHtml(s)} ✕</span>`).join('');

  showModal(isEdit ? '编辑经历' : '新增经历', `
    <div class="form-group"><label class="form-label">公司名称 <span class="required">*</span></label><input type="text" class="form-input" id="ef-company" value="${escapeHtml(exp.company_name)}" placeholder="例如：字节跳动"></div>
    <div class="form-group"><label class="form-label">岗位名称 <span class="required">*</span></label><input type="text" class="form-input" id="ef-position" value="${escapeHtml(exp.position)}" placeholder="例如：高级前端工程师"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">开始时间 <span class="required">*</span></label><input type="month" class="form-input" id="ef-start" value="${exp.start_date}"></div>
      <div class="form-group"><label class="form-label">结束时间</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="month" class="form-input" id="ef-end" value="${exp.end_date==='至今'?'':exp.end_date}" style="flex:1;" ${exp.end_date==='至今'?'disabled style="flex:1;opacity:0.5"':''}>
          <label style="font-size:0.85rem;white-space:nowrap;display:flex;align-items:center;gap:4px;cursor:pointer;">
            <input type="checkbox" id="ef-end-now" ${exp.end_date==='至今'?'checked':''} onchange="document.getElementById('ef-end').disabled=this.checked;document.getElementById('ef-end').style.opacity=this.checked?'0.5':'1';document.getElementById('ef-end').value=''"> 至今
          </label>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">工作成果</label>
      <div id="ach-container">${achHTML}</div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addAchRow()" style="margin-top:8px;">+ 添加成果</button>
    </div>
    <div class="form-group">
      <label class="form-label">技能标签</label>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input type="text" class="form-input" id="ef-skill-input" placeholder="输入技能名后按回车添加" style="flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();addSkillTag();}">
        <button type="button" class="btn btn-outline btn-sm" onclick="addSkillTag()">添加</button>
      </div>
      <div class="tag-group" id="ef-skills">${skillHTML}</div>
    </div>
  `, async (overlay) => {
    const company = overlay.querySelector('#ef-company').value.trim();
    const position = overlay.querySelector('#ef-position').value.trim();
    const startDate = overlay.querySelector('#ef-start').value;
    const endNow = overlay.querySelector('#ef-end-now').checked;
    const endDate = endNow ? '至今' : (overlay.querySelector('#ef-end').value || '至今');
    if (!company) { showToast('请输入公司名称', 'warning'); return; }
    if (!position) { showToast('请输入岗位名称', 'warning'); return; }
    if (!startDate) { showToast('请选择开始时间', 'warning'); return; }

    const achievements = [];
    overlay.querySelectorAll('.achievement-row').forEach(row => {
      const t = row.querySelector('.ach-title')?.value.trim();
      const d = row.querySelector('.ach-desc')?.value.trim();
      if (t && d) achievements.push({ title: t, description: d });
    });
    const skills = [];
    overlay.querySelectorAll('#ef-skills .tag').forEach(tag => {
      const s = tag.textContent.replace('✕','').trim();
      if (s) skills.push(s);
    });

    const data = { company_name: company, position, start_date: startDate, end_date: endDate, achievements, skills };
    if (isEdit) DataStore.updateExperience(expId, data);
    else DataStore.createExperience(data);

    overlay.remove();
    showToast(isEdit ? '更新成功' : '创建成功', 'success');
    renderExperiences();
  });
}

function addAchRow() {
  const c = document.getElementById('ach-container');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'achievement-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
  row.innerHTML = `<div style="flex:1;"><input type="text" class="form-input ach-title" placeholder="成果标题" style="margin-bottom:4px;"><textarea class="form-textarea ach-desc" placeholder="成果描述" rows="2"></textarea></div><button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.achievement-row').remove()" style="flex-shrink:0;align-self:flex-start;">✕</button>`;
  c.appendChild(row);
}

function addSkillTag() {
  const input = document.getElementById('ef-skill-input');
  const container = document.getElementById('ef-skills');
  if (!input || !container) return;
  const skill = input.value.trim();
  if (!skill) return;
  const existing = [...container.querySelectorAll('.tag')].map(t => t.textContent.replace('✕','').trim());
  if (existing.includes(skill)) { showToast('该技能已添加', 'warning'); return; }
  const tag = document.createElement('span');
  tag.className = 'tag tag-removable';
  tag.textContent = skill + ' ✕';
  tag.onclick = function() { this.remove(); };
  container.appendChild(tag);
  input.value = '';
  input.focus();
}

async function deleteExp(id) {
  if (!(await showConfirm('确定要删除这条工作经历吗？此操作不可撤销。'))) return;
  DataStore.deleteExperience(id);
  showToast('删除成功', 'success');
  renderExperiences();
}

// ==================== 岗位匹配 ====================

async function analyzeJD() {
  const company = document.getElementById('jd-company').value.trim();
  const title = document.getElementById('jd-title').value.trim();
  const jdText = document.getElementById('jd-text').value.trim();
  if (jdText.length < 20) { showToast('职位描述太短，请粘贴完整的 JD（至少 20 个字）', 'warning'); return; }

  const experiences = DataStore.getExperiences();
  if (!experiences.length) { showToast('请先添加工作经历，再进行匹配分析', 'warning'); return; }

  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 分析中...';

  try {
    const { results, keywords, jdSkills } = computeMatchScores(jdText, experiences);

    // 保存匹配记录
    const match = DataStore.createMatch({
      companyName: company, jobTitle: title, jdText,
      keywords, jdSkills, results
    });
    currentMatchId = match.id;

    // 显示结果
    document.getElementById('match-results-section').style.display = 'block';
    document.getElementById('match-actions').style.display = 'flex';
    renderKeywords(keywords, jdSkills);
    renderMatchResults(results, experiences);
    document.getElementById('match-results-section').scrollIntoView({ behavior: 'smooth' });
    showToast('匹配分析完成！', 'success');
  } catch (err) {
    showToast('分析失败：' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 开始分析';
  }
}

function renderKeywords(keywords, jdSkills) {
  const bar = document.getElementById('keyword-bar');
  const allKw = [...new Set([...keywords, ...jdSkills])].slice(0, 25);
  bar.innerHTML = `<span class="keyword-label">📌 JD关键词：</span>` + allKw.map(k => `<span class="badge badge-blue">${escapeHtml(k)}</span>`).join('');
}

function renderMatchResults(results, experiences) {
  const list = document.getElementById('match-results-list');
  list.innerHTML = results.map(r => {
    const exp = experiences.find(e => e.id === r.experienceId) || {};
    const score = r.score || 0;
    let scoreClass = 'score-low', scoreLabel = '关联度低';
    if (score >= 70) { scoreClass = 'score-high'; scoreLabel = '高度匹配'; }
    else if (score >= 40) { scoreClass = 'score-medium'; scoreLabel = '部分匹配'; }
    const circumference = 2 * Math.PI * 27;
    const offset = circumference - (score / 100) * circumference;

    return `
      <div class="match-card selected" id="mc-${r.experienceId}">
        <div class="match-checkbox"><input type="checkbox" checked onchange="toggleSel('${r.experienceId}',this.checked)"></div>
        <div class="score-ring ${scoreClass}">
          <svg width="64" height="64" viewBox="0 0 64 64"><circle class="score-ring-circle" cx="32" cy="32" r="27"/><circle class="score-ring-fill" cx="32" cy="32" r="27" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg>
          <div class="score-ring-text">${Math.round(score)}%</div>
        </div>
        <div class="exp-content">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="exp-company">${escapeHtml(exp.company_name||'')}</span>
            <span class="badge ${scoreClass==='score-high'?'badge-green':scoreClass==='score-medium'?'badge-yellow':'badge-gray'}">${scoreLabel}</span>
          </div>
          <div class="exp-position">${escapeHtml(exp.position||'')} · ${formatDate(exp.start_date)} - ${formatDate(exp.end_date)}</div>
          ${r.matchedSkills?.length ? `<div class="exp-skills tag-group" style="margin-top:6px;"><span style="font-size:0.78rem;color:var(--color-success);">匹配技能：</span>${r.matchedSkills.map(s=>`<span class="badge badge-green">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
          ${(exp.achievements||[]).length ? `<div class="exp-achievements">${exp.achievements.map(a=>`<div class="exp-achievement-item"><div class="exp-achievement-title">${escapeHtml(a.title)}</div><div class="exp-achievement-desc">${escapeHtml(a.description)}</div></div>`).join('')}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleSel(expId, selected) {
  if (!currentMatchId) return;
  DataStore.updateMatchSelection(currentMatchId, expId, selected);
  const card = document.getElementById(`mc-${expId}`);
  if (card) { card.classList.toggle('selected', selected); card.classList.toggle('deselected', !selected); }
}

function goToResume() {
  if (!currentMatchId) { showToast('请先完成匹配分析', 'warning'); return; }
  navigate('resume', currentMatchId);
}
function goToInterview() {
  if (!currentMatchId) { showToast('请先完成匹配分析', 'warning'); return; }
  navigate('interview', currentMatchId);
}

// ==================== 简历预览 ====================

function initResumePage(matchId) {
  if (!matchId) return;
  currentMatchId = matchId;
  const match = DataStore.getMatch(matchId);
  if (!match) { document.getElementById('resume-container').innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">匹配记录不存在</div></div>'; return; }

  const profile = DataStore.getProfile();
  const experiences = DataStore.getSelectedExperiences(matchId);
  const allSkills = [...new Set(experiences.flatMap(e => e.skills || []))];

  const contactParts = [profile.email, profile.phone, profile.education].filter(Boolean);
  const contactHTML = contactParts.length ? contactParts.join(' | ') : '<span style="color:var(--color-gray-400);">请前往个人资料完善信息</span>';

  document.getElementById('resume-container').innerHTML = `
    <div class="resume-preview">
      <div class="resume-name">${escapeHtml(profile.name || '您的姓名')}</div>
      <div class="resume-contact">${contactHTML}</div>
      <div class="resume-target">求职意向：${escapeHtml(match.jobTitle || match.companyName || '目标岗位')}</div>
      ${profile.summary ? `<div class="resume-section"><div class="resume-section-title">个人简介</div><p style="color:var(--color-gray-600);">${escapeHtml(profile.summary)}</p></div>` : ''}
      <div class="resume-section">
        <div class="resume-section-title">工作经历</div>
        ${experiences.map((exp,i) => `
          <div class="resume-exp-item">
            <div class="resume-exp-header"><span class="resume-exp-company">${escapeHtml(exp.company_name)}</span><span class="resume-exp-date">${formatDate(exp.start_date)} - ${formatDate(exp.end_date)}${calcDuration(exp.start_date,exp.end_date)?'（'+calcDuration(exp.start_date,exp.end_date)+'）':''}</span></div>
            <div class="resume-exp-position">${escapeHtml(exp.position)}</div>
            ${(exp.achievements||[]).map(a=>`<div class="resume-exp-ach"><strong>${escapeHtml(a.title)}：</strong>${escapeHtml(a.description)}</div>`).join('')}
          </div>
          ${i<experiences.length-1?'<hr style="border:none;border-top:1px dashed #e2e8f0;margin:10px 0;">':''}
        `).join('')}
      </div>
      <div class="resume-section"><div class="resume-section-title">专业技能</div><div class="resume-skills">${allSkills.map(s=>`<span class="resume-skill-tag">${escapeHtml(s)}</span>`).join('')}</div></div>
    </div>
  `;
}

function downloadPDFResume() {
  // 使用浏览器打印功能生成 PDF
  const content = document.getElementById('resume-container').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>简历</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: "PingFang SC","Microsoft YaHei","SimHei",sans-serif; font-size:13px; line-height:1.8; color:#1e293b; }
      * { margin:0; padding:0; box-sizing:border-box; }
      .resume-preview { padding:0; }
      .resume-name { font-size:26px; font-weight:700; color:#0f172a; text-align:center; margin-bottom:4px; }
      .resume-contact { text-align:center; color:#64748b; font-size:12px; margin-bottom:8px; }
      .resume-target { text-align:center; color:#2563eb; font-weight:600; margin-bottom:20px; }
      .resume-section { margin-bottom:18px; }
      .resume-section-title { font-size:15px; font-weight:700; color:#0f172a; border-bottom:1.5px solid #2563eb; padding-bottom:4px; margin-bottom:10px; }
      .resume-exp-item { margin-bottom:14px; }
      .resume-exp-header { display:flex; justify-content:space-between; align-items:baseline; }
      .resume-exp-company { font-size:14px; font-weight:700; }
      .resume-exp-date { font-size:11px; color:#94a3b8; }
      .resume-exp-position { font-size:12px; color:#64748b; margin-bottom:4px; }
      .resume-exp-ach { padding-left:14px; position:relative; font-size:13px; color:#475569; margin-bottom:2px; }
      .resume-exp-ach::before { content:"•"; position:absolute; left:2px; color:#2563eb; font-weight:bold; }
      .resume-skills { display:flex; flex-wrap:wrap; gap:6px; }
      .resume-skill-tag { padding:3px 10px; background:#f1f5f9; border-radius:50px; font-size:12px; color:#475569; }
    </style>
  </head><body>${content}</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

// ==================== 面试准备 ====================

function initInterviewPage(matchId) {
  if (!matchId) return;
  currentMatchId = matchId;
  interviewState = { category: 'self_intro', mode: 'browse', index: 0, questions: null };

  // 尝试加载已有问题
  let questions = DataStore.getInterviewQuestions(matchId);
  if (!questions) {
    questions = doGenerateQuestions(matchId);
  }
  interviewState.questions = questions;
  renderInterviewPage();
}

function doGenerateQuestions(matchId) {
  const match = DataStore.getMatch(matchId);
  if (!match) return null;
  const experiences = DataStore.getSelectedExperiences(matchId);
  const questions = generateInterviewQuestions(match.jdText || '', experiences);
  DataStore.saveInterviewQuestions(matchId, questions);
  return questions;
}

function regenerateInterview() {
  if (!currentMatchId) return;
  const questions = doGenerateQuestions(currentMatchId);
  interviewState.questions = questions;
  interviewState.category = 'self_intro';
  interviewState.mode = 'browse';
  renderInterviewPage();
  showToast('问题已重新生成！', 'success');
}

function renderInterviewPage() {
  const container = document.getElementById('interview-container');
  const q = interviewState.questions;
  if (!q) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">生成面试问题失败</div></div>'; return; }

  const counts = {};
  Object.keys(CATEGORY_NAMES).forEach(cat => { counts[cat] = (q[cat] || []).length; });

  // 分类导航
  const navHTML = Object.entries(CATEGORY_NAMES).map(([cat, name]) => `
    <button class="category-item ${cat===interviewState.category?'active':''}" onclick="switchCategory('${cat}')">
      ${name} <span class="category-count">${counts[cat]||0}</span>
    </button>
  `).join('');

  // 当前分类问题
  const questions = q[interviewState.category] || [];
  const questionsHTML = questions.length ? questions.map((item, i) => `
    <div class="question-card" id="qcard-${i}" onclick="document.getElementById('qcard-${i}').classList.toggle('flipped')">
      <div class="question-front">
        <div class="question-number">${i+1}</div>
        <div class="question-text">${escapeHtml(item.question)}</div>
        <div class="flip-hint">💡 点击查看答题思路</div>
      </div>
      <div class="question-back">
        <div class="question-number">${i+1}</div>
        <div class="question-text">${escapeHtml(item.question)}</div>
        <div class="question-hint-label">💡 答题思路</div>
        <div class="question-hint">${escapeHtml(item.hint || '暂无提示')}</div>
        <div class="flip-hint" style="margin-top:12px;">点击返回题目</div>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">该分类暂无问题</div></div>';

  // 练习模式
  let practiceHTML = '';
  if (interviewState.mode === 'browse' && questions.length) {
    practiceHTML = `<div class="practice-section"><div class="practice-header">🎯 模拟练习</div><button class="btn btn-primary" onclick="startPractice()">开始练习模式</button></div>`;
  } else if (interviewState.mode === 'practice' && interviewState.questions) {
    const pq = (interviewState.questions[interviewState.category] || [])[interviewState.index];
    if (pq) {
      practiceHTML = `
        <div class="practice-section">
          <div class="practice-header">🎯 模拟练习 (${interviewState.index+1}/${questions.length})</div>
          <div class="practice-question">${escapeHtml(pq.question)}</div>
          <textarea class="practice-answer" id="pa-answer" placeholder="在这里输入你的回答..."></textarea>
          <div class="practice-actions">
            <button class="btn btn-primary" onclick="submitPractice()">提交回答</button>
            <button class="btn btn-outline" onclick="exitPractice()">退出练习</button>
          </div>
          <div class="practice-feedback" id="pa-feedback">
            <div class="question-hint-label">💡 参考答案思路</div>
            <div class="question-hint">${escapeHtml(pq.hint || '暂无提示')}</div>
            <div class="practice-actions" style="margin-top:12px;">
              <button class="btn btn-primary btn-sm" onclick="nextPractice()">${interviewState.index < questions.length-1 ? '下一题 →' : '完成练习'}</button>
            </div>
          </div>
        </div>`;
    }
  }

  container.innerHTML = `
    <div class="interview-layout">
      <div class="category-nav">${navHTML}</div>
      <div>
        <div id="questions-area">${questionsHTML}</div>
        ${practiceHTML}
      </div>
    </div>
  `;
}

function switchCategory(cat) {
  interviewState.category = cat;
  interviewState.mode = 'browse';
  renderInterviewPage();
}

function startPractice() {
  interviewState.mode = 'practice';
  interviewState.index = 0;
  renderInterviewPage();
  setTimeout(() => { const ta = document.getElementById('pa-answer'); if(ta) ta.focus(); }, 100);
}

function exitPractice() {
  interviewState.mode = 'browse';
  renderInterviewPage();
}

function submitPractice() {
  const ans = document.getElementById('pa-answer')?.value?.trim();
  if (!ans) { showToast('请先输入你的回答', 'warning'); return; }
  const fb = document.getElementById('pa-feedback');
  if (fb) { fb.classList.add('show'); fb.scrollIntoView({ behavior: 'smooth' }); }
}

function nextPractice() {
  const questions = interviewState.questions[interviewState.category] || [];
  interviewState.index++;
  if (interviewState.index >= questions.length) {
    showToast('练习完成！🎉', 'success');
    exitPractice();
    return;
  }
  renderInterviewPage();
  setTimeout(() => { const ta = document.getElementById('pa-answer'); if(ta) ta.focus(); }, 100);
}

// ==================== 页面初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});
