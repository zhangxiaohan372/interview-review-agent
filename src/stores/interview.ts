/**
 * 面试复盘 Store — 管理分析结果，支持页面间数据共享
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ReviewData, SkillData } from '@/api/interview';

export const useInterviewStore = defineStore('interview', () => {
  // ─── 最近一次分析结果 ───
  const review = ref<ReviewData | null>(null);
  const skills = ref<SkillData | null>(null);

  // 最近一次输入的原始内容
  const lastContent = ref<string>('');

  /** 保存分析结果 */
  function setResult(content: string, result: { review: ReviewData; skills: SkillData }) {
    lastContent.value = content;
    review.value = result.review;
    skills.value = result.skills;
  }

  /** 清空数据 */
  function clear() {
    review.value = null;
    skills.value = null;
    lastContent.value = '';
  }

  return { review, skills, lastContent, setResult, clear };
});
