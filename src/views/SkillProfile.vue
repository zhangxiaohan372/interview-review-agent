<template>
  <div class="page profile-page">
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
      <template v-if="skills">
        <!-- 雷达图 -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">技术能力雷达图</h2>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </section>

        <!-- 技能详情 -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">技能维度详情</h2>
          </div>
          <div class="skill-bars">
            <div class="skill-row" v-for="skill in skillList" :key="skill.key">
              <div class="skill-label">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-desc">{{ skill.desc }}</span>
              </div>
              <div class="skill-bar-wrap">
                <div class="skill-bar">
                  <div
                    class="skill-fill"
                    :class="barClass(skill.value)"
                    :style="{ width: skill.value + '%' }"
                  ></div>
                </div>
                <span class="skill-val" :class="barClass(skill.value)">{{ skill.value }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- 无数据 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--color-border)" stroke-width="2"/>
            <path d="M20 32h24M20 24h16M20 40h20" stroke="var(--color-text-placeholder)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="empty-title">还没有分析数据</p>
        <p class="empty-desc">先在「复盘分析」页提交面试信息，系统将自动生成你的能力画像</p>
        <router-link to="/" class="btn btn-primary">前往复盘分析</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useInterviewStore } from '@/stores/interview';

const store = useInterviewStore();
const skills = computed(() => store.skills);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const SKILL_META: Record<string, { name: string; desc: string }> = {
  javascript:  { name: 'JavaScript', desc: 'ES6+、异步、闭包、原型链等' },
  vue:         { name: 'Vue',        desc: '响应式、组件化、生命周期等' },
  css:         { name: 'CSS',        desc: '布局、盒模型、Flex/Grid 等' },
  browser:     { name: '浏览器',     desc: 'DOM/BOM、事件循环、渲染流程等' },
  network:     { name: '网络',       desc: 'HTTP/HTTPS、缓存、跨域等' },
  engineering: { name: '工程化',     desc: '构建工具、模块化、规范等' },
  architecture:{ name: '架构设计',   desc: '组件设计、状态管理、分层等' },
  performance: { name: '性能优化',   desc: '首屏、懒加载、虚拟滚动等' },
};

const skillList = computed(() => {
  if (!skills.value) return [];
  return Object.entries(skills.value).map(([key, value]) => ({
    key,
    name: SKILL_META[key]?.name || key,
    desc: SKILL_META[key]?.desc || '',
    value,
  }));
});

function barClass(val: number): string {
  if (val >= 75) return 'high';
  if (val >= 50) return 'mid';
  return 'low';
}

function initChart() {
  if (!chartRef.value || !skills.value) return;

  chartInstance?.dispose();
  chartInstance = echarts.init(chartRef.value);

  const indicators = Object.keys(skills.value).map((key) => ({
    name: SKILL_META[key]?.name || key,
    max: 100,
  }));

  const values = Object.values(skills.value);

  chartInstance.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#EBE8F5',
      textStyle: { color: '#1D1933', fontSize: 13 },
      formatter: (p: any) => `${p.name}: <b>${p.value} 分</b>`,
    },
    radar: {
      center: ['50%', '50%'],
      radius: '60%',
      indicator: indicators,
      axisName: {
        color: '#4A4570',
        fontSize: 12,
        fontWeight: 500,
      },
      shape: 'polygon',
      splitNumber: 4,
      axisLine: { lineStyle: { color: '#EBE8F5' } },
      splitLine: { lineStyle: { color: '#EBE8F5' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(155, 123, 255, 0.02)', 'rgba(155, 123, 255, 0.04)'],
        },
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '技能分数',
        areaStyle: { color: 'rgba(155, 123, 255, 0.2)' },
        lineStyle: { color: '#9B7BFF', width: 2 },
        itemStyle: { color: '#9B7BFF', borderColor: '#fff', borderWidth: 1 },
      }],
      symbol: 'circle',
      symbolSize: 6,
    }],
  });
}

function handleResize() {
  chartInstance?.resize();
}

onMounted(() => {
  if (skills.value) nextTick(initChart);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});

watch(skills, (val) => {
  if (val) nextTick(initChart);
});
</script>

<style scoped>
/* ── 雷达图容器 ── */
.chart-container {
  width: 100%;
  height: 460px;
}

/* ── 技能详情 ── */
.skill-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.skill-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.skill-label {
  width: 120px;
  flex-shrink: 0;
}

.skill-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.skill-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
  margin-top: var(--space-xs);
}

.skill-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.skill-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 600ms ease;
}

.skill-fill.high { background: var(--color-primary); }
.skill-fill.mid  { background: var(--color-warning); }
.skill-fill.low  { background: var(--color-error); }

.skill-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-width: 28px;
  text-align: right;
}

.skill-val.high { color: var(--color-primary); }
.skill-val.mid  { color: var(--color-warning); }
.skill-val.low  { color: var(--color-error); }

/* ── 响应式 ── */
@media (max-width: 768px) {
  .chart-container {
    height: 360px;
  }

  .skill-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .skill-label {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 300px;
  }
}
</style>
