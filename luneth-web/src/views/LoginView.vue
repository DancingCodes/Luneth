<template>
  <div class="login">
    <div class="title">Luneth</div>
    <input v-model="name" maxlength="12" placeholder="角色名" autofocus @keyup.enter="login" />
    <div class="action" :class="{ disabled: !name.trim() }" @click="login">进入</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const player = usePlayerStore()
const name = ref(player.name)

function login() {
  if (!name.value.trim()) return
  player.login(name.value)
  router.push('/game')
}
</script>

<style lang="scss" scoped>
.login { width: 280px; margin: 0 auto; padding-top: 35vh; display: grid; gap: 10px; }
.title { margin-bottom: 8px; color: #426b4c; font-size: 42px; }
input, .action { height: 40px; padding: 0 12px; border: 1px solid #a7c4ad; border-radius: 3px; background: #fff; color: #23382a; }
.action { cursor: pointer; border-color: #efcf86; background: #d8b45a; text-align: center; line-height: 38px; &.disabled { cursor: not-allowed; opacity: .5; pointer-events: none; } }
</style>


