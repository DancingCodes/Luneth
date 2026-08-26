import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import GameView from '@/views/GameView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    { path: '/game', component: GameView, meta: { requiresPlayer: true } },
  ],
})

router.beforeEach((to) => {
  const hasPlayer = localStorage.getItem('luneth-prototype')
  if (to.meta.requiresPlayer && !hasPlayer) return '/login'
})
