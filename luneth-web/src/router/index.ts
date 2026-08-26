import { createRouter, createWebHistory } from 'vue-router'
import GameView from '@/views/GameView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: GameView }],
})
