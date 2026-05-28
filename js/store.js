/**
 * 数据存储模块 - 使用 localStorage
 * 管理用户资料、工作经历、匹配记录和面试问题
 */

const STORAGE_KEYS = {
  PROFILE: 'ih_profile',
  EXPERIENCES: 'ih_experiences',
  MATCHES: 'ih_matches',
  INTERVIEW: 'ih_interview'
};

// ==================== 通用工具 ====================

function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==================== 用户资料 ====================

function getProfile() {
  return loadData(STORAGE_KEYS.PROFILE) || {
    name: '', email: '', phone: '', education: '', summary: ''
  };
}

function saveProfile(profile) {
  saveData(STORAGE_KEYS.PROFILE, profile);
}

// ==================== 工作经历 ====================

function getExperiences() {
  return loadData(STORAGE_KEYS.EXPERIENCES) || [];
}

function getExperience(id) {
  return getExperiences().find(e => e.id === id) || null;
}

function createExperience(data) {
  const experiences = getExperiences();
  const exp = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  experiences.unshift(exp);
  saveData(STORAGE_KEYS.EXPERIENCES, experiences);
  return exp;
}

function updateExperience(id, data) {
  const experiences = getExperiences();
  const idx = experiences.findIndex(e => e.id === id);
  if (idx === -1) return false;
  experiences[idx] = { ...experiences[idx], ...data };
  saveData(STORAGE_KEYS.EXPERIENCES, experiences);
  return true;
}

function deleteExperience(id) {
  const experiences = getExperiences().filter(e => e.id !== id);
  saveData(STORAGE_KEYS.EXPERIENCES, experiences);
  return true;
}

// ==================== 匹配记录 ====================

function getMatches() {
  return loadData(STORAGE_KEYS.MATCHES) || [];
}

function getMatch(id) {
  return getMatches().find(m => m.id === id) || null;
}

function createMatch(data) {
  const matches = getMatches();
  const match = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  matches.unshift(match);
  // 只保留最近 20 条
  if (matches.length > 20) matches.length = 20;
  saveData(STORAGE_KEYS.MATCHES, matches);
  return match;
}

function updateMatchSelection(matchId, experienceId, selected) {
  const match = getMatch(matchId);
  if (!match) return;
  const result = match.results.find(r => r.experienceId === experienceId);
  if (result) result.selected = selected;
  saveData(STORAGE_KEYS.MATCHES, getMatches());
}

function getSelectedExperiences(matchId) {
  const match = getMatch(matchId);
  if (!match) return [];
  const selectedIds = match.results.filter(r => r.selected).map(r => r.experienceId);
  return getExperiences().filter(e => selectedIds.includes(e.id));
}

// ==================== 面试问题 ====================

function getInterviewQuestions(matchId) {
  const all = loadData(STORAGE_KEYS.INTERVIEW) || {};
  return all[matchId] || null;
}

function saveInterviewQuestions(matchId, questions) {
  const all = loadData(STORAGE_KEYS.INTERVIEW) || {};
  all[matchId] = questions;
  saveData(STORAGE_KEYS.INTERVIEW, all);
}

// ==================== 导出 ====================

window.DataStore = {
  getProfile, saveProfile,
  getExperiences, getExperience, createExperience, updateExperience, deleteExperience,
  getMatches, getMatch, createMatch, updateMatchSelection, getSelectedExperiences,
  getInterviewQuestions, saveInterviewQuestions
};
