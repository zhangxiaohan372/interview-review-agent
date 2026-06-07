<template>
  <div class="page review-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-inner">
        <router-link to="/" class="logo">Interview Review</router-link>
        <nav class="nav-links">
          <router-link to="/" class="nav-link" exact-active-class="active">复盘分析</router-link>
          <router-link to="/profile" class="nav-link" active-class="active">能力画像</router-link>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <!-- 输入区 -->
      <section class="card">
        <div class="card-header">
          <h2 class="card-title">面试复盘</h2>
          <span class="card-desc">写下你的面试经历，AI 帮你深度分析</span>
        </div>

        <textarea
          v-model="content"
          class="input-area"
          :rows="12"
          placeholder="把面试经历写下来，想到什么写什么，越详细越好——

例如这样写：

公司：字节跳动
岗位：高级前端工程师

面试官问：请解释 Vue 3 的响应式原理
我的回答：我说了 Proxy 代理、reactive 和 ref 的区别，但讲到依赖收集 track/trigger 的时候有点卡住了...

面试官又问：说一下浏览器从输入 URL 到页面渲染的全过程
我的回答：我提到了 DNS 解析、TCP 连接、HTTP 请求，但渲染流程的布局和绘制说得不太清楚...

——不用拘泥格式，有多少题写多少题，AI 会自己理解并分析"
          :disabled="isAnalyzing"
        ></textarea>

        <div class="input-footer">
          <span class="char-count">{{ content.length }} 字</span>
          <button
            class="btn btn-primary"
            :class="{ loading: isAnalyzing }"
            :disabled="content.trim().length < 10 || isAnalyzing"
            @click="handleAnalyze"
          >
            <span v-if="isAnalyzing" class="btn-loading-dot"></span>
            {{ isAnalyzing ? '分析中...' : '开始分析' }}
          </button>
        </div>
      </section>

      <!-- 分析结果 -->
      <template v-if="review">
        <!-- 综合评分 -->
        <section class="card">
          <div class="score-layout">
            <div class="score-ring" :class="scoreLevel">
              <span class="score-num">{{ review.overallScore }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="score-meta">
              <h3>综合评分</h3>
              <p class="score-tag" :class="scoreLevel">
                {{ review.overallScore >= 80 ? '表现优秀' : review.overallScore >= 60 ? '表现良好' : '需要提升' }}
              </p>
            </div>
          </div>
        </section>

        <!-- 优缺点 -->
        <div class="two-col">
          <section class="card">
            <div class="card-header">
              <h3 class="card-title">回答亮点</h3>
            </div>
            <ul class="point-list pros">
              <li v-for="(item, i) in review.pros" :key="'pro-' + i">{{ item }}</li>
            </ul>
          </section>

          <section class="card">
            <div class="card-header">
              <h3 class="card-title">回答不足</h3>
            </div>
            <ul class="point-list cons">
              <li v-for="(item, i) in review.cons" :key="'con-' + i">{{ item }}</li>
            </ul>
          </section>
        </div>

        <!-- 参考答案 -->
        <section class="card">
          <div class="card-header">
            <h3 class="card-title">参考答案</h3>
          </div>
          <div class="ref-answer">{{ review.referenceAnswer }}</div>
        </section>

        <!-- 学习建议 -->
        <section class="card">
          <div class="card-header">
            <h3 class="card-title">学习建议</h3>
          </div>
          <ol class="suggestion-list">
            <li v-for="(item, i) in review.suggestions" :key="'sug-' + i">{{ item }}</li>
          </ol>
        </section>
      </template>

      <!-- 空状态 -->
      <div v-if="!review && !isAnalyzing" class="empty-state">
        <p class="empty-desc">将面试经历写下来，AI 会从答题质量、知识点覆盖、表达逻辑等维度综合复盘</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { analyzeInterview, type ReviewData } from '@/api/interview';
import { useInterviewStore } from '@/stores/interview';

const store = useInterviewStore();

const content = ref('');
const isAnalyzing = ref(false);
const review = ref<ReviewData | null>(store.review);

const scoreLevel = computed(() => {
  const s = review.value?.overallScore ?? 0;
  if (s >= 80) return 'high';
  if (s >= 60) return 'mid';
  return 'low';
});

async function handleAnalyze() {
  const text = content.value.trim();
  if (text.length < 10 || isAnalyzing.value) return;

  isAnalyzing.value = true;
  try {
    const res = await analyzeInterview({ content: text });
    if (res.success && res.data) {
      review.value = res.data.review;
      store.setResult(text, { review: res.data.review, skills: res.data.skills });
      ElMessage.success('分析完成');
      setTimeout(() => {
        document.querySelector('.score-layout')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      ElMessage.error(res.message || '分析失败，请稍后重试');
    }
  } catch (err: any) {
    console.error(err);
    ElMessage.error('网络请求失败，请检查后端服务是否启动');
  } finally {
    isAnalyzing.value = false;
  }
}
</script>

<style scoped>
/* ── 输入区 ── */
.input-area {
  width: 100%;
  padding: var(--input-padding);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--color-text-primary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-area::placeholder {
  color: var(--color-text-placeholder);
  line-height: 1.7;
}

.input-area:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-area:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-md);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}

/* ── 综合评分 ── */
.score-layout {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.score-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-ring.high {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}

.score-ring.mid {
  background: linear-gradient(135deg, var(--color-primary), #C4B0FF);
}

.score-ring.low {
  background: linear-gradient(135deg, var(--color-text-secondary), var(--color-text-placeholder));
}

.score-num {
  font-size: 30px;
  font-weight: var(--font-weight-bold);
  color: #fff;
  line-height: 1;
}

.score-label {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.75);
  margin-top: var(--space-xs);
}

.score-meta h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-sm);
}

.score-tag {
  display: inline-block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  margin: 0;
}

.score-tag.high {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.score-tag.mid {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.score-tag.low {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* ── 亮点/不足列表 ── */
.point-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.point-list li {
  position: relative;
  padding-left: var(--space-lg);
  font-size: var(--font-size-base);
  line-height: 1.8;
  color: var(--color-text-body);
  margin-bottom: var(--space-xs);
}

.point-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.point-list.pros li::before {
  background: var(--color-success);
}

.point-list.cons li::before {
  background: var(--color-warning);
}

/* ── 参考答案 ── */
.ref-answer {
  font-size: var(--font-size-base);
  line-height: 1.8;
  color: var(--color-text-body);
  white-space: pre-wrap;
}

/* ── 学习建议 ── */
.suggestion-list {
  margin: 0;
  padding-left: 20px;
}

.suggestion-list li {
  font-size: var(--font-size-base);
  line-height: 1.8;
  color: var(--color-primary-active);
  margin-bottom: var(--space-xs);
}

/* ── 空状态 ── */
.review-page .empty-state {
  padding-top: var(--space-3xl);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .score-layout {
    gap: var(--space-lg);
  }
}

@media (max-width: 480px) {
  .score-layout {
    flex-direction: column;
    text-align: center;
    gap: var(--space-md);
  }

  .score-meta h3 {
    font-size: var(--font-size-md);
  }
}
</style>
