import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'InterviewReview',
      component: () => import('../views/InterviewReview.vue'),
    },
    {
      path: '/profile',
      name: 'SkillProfile',
      component: () => import('../views/SkillProfile.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
