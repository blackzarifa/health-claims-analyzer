import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
    },
    {
      path: '/influencer/:id',
      name: 'influencer',
      component: () => import('@/views/InfluencerView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// router.beforeEach((to, _from, next) => {
//   const isAuthenticated = !!localStorage.getItem('token');
//
//   if (to.meta.requiresAuth && !isAuthenticated) {
//     next({ name: 'login', query: { redirect: to.fullPath } });
//   } else {
//     next();
//   }
// });

export default router;
