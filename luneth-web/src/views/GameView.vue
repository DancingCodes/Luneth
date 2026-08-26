<template>
  <div class="game">
    <div ref="gameHost" class="canvas"></div>
    <div class="hud">
      <span class="name">{{ playerName }} · Lv.{{ level }}</span>
      <span>生命 {{ hp }} / {{ maxHp }}</span>
      <span>经验 {{ experience }} / {{ nextLevelExperience }}</span>
      <div class="action" :class="{ disabled: enemyHp <= 0 }" @click="attack">攻击史莱姆</div>
      <div class="action leave" @click="leaveGame">退出</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const playerStore = usePlayerStore()
const playerName = computed(() => playerStore.name)
const emit = defineEmits<{ leave: [] }>()
const gameHost = ref<HTMLDivElement | null>(null)
const hp = ref(100)
const maxHp = 100
const level = computed(() => playerStore.level)
const experience = computed(() => playerStore.experience)
const nextLevelExperience = computed(() => level.value * 30)
const enemyHp = ref(60)
const status = ref('荒野很安静。')

let app: Application | undefined
let player: Container | undefined
let slime: Container | undefined
let slimeBar: Graphics | undefined
let playerLabel: Text | undefined
let enemiesLayer: Container | undefined
const keys = new Set<string>()
let attackReady = true
let animationFrame = 0



function persistState() { playerStore.addExperience(0) }

function addExperience(amount: number) {
  playerStore.addExperience(amount)
  status.value = `获得 ${amount} 点经验。`
}

function createMap(root: Container) {
  const ground = new Graphics()
  ground.rect(0, 0, 960, 640).fill('#a8d59a')

  const grass = new Container()
  for (let x = 24; x < 960; x += 48) {
    for (let y = 24; y < 640; y += 48) {
      const mark = new Graphics()
      mark.circle(0, 0, 1.5).fill('#d5efbb')
      mark.x = x + ((y / 48) % 2) * 9
      mark.y = y
      grass.addChild(mark)
    }
  }

  const water = new Graphics()
  water.roundRect(672, 0, 288, 192, 0).fill('#8ecbd0')
  water.roundRect(0, 512, 240, 128, 0).fill('#8ecbd0')

  const path = new Graphics()
  path.moveTo(0, 360).lineTo(310, 315).lineTo(605, 370).lineTo(960, 295).stroke({ width: 52, color: '#b99465', alpha: 0.92 })
  path.moveTo(0, 360).lineTo(310, 315).lineTo(605, 370).lineTo(960, 295).stroke({ width: 2, color: '#e0c38c', alpha: 0.6 })

  const title = new Text({
    text: '绿荫荒野',
    style: new TextStyle({ fontFamily: 'system-ui', fontSize: 18, fill: '#e8f3dd', fontWeight: '700' }),
  })
  title.x = 22
  title.y = 22

  root.addChild(ground, grass, water, path, title)
}

function createPlayer(root: Container) {
  player = new Container()
  const shadow = new Graphics().ellipse(0, 16, 19, 7).fill({ color: '#52735b', alpha: 0.35 })
  const body = new Graphics()
  body.circle(0, 0, 16).fill('#f5c56d')
  body.roundRect(-13, 8, 26, 23, 7).fill('#d0534d')
  body.rect(-20, 13, 7, 18).fill('#f5c56d')
  body.rect(13, 13, 7, 18).fill('#f5c56d')
  body.rect(-17, -14, 34, 10).fill('#4e6170')

  playerLabel = new Text({
    text: playerName.value,
    style: new TextStyle({ fontFamily: 'system-ui', fontSize: 14, fill: '#ffffff', fontWeight: '700', stroke: { color: '#52735b', width: 3 } }),
  })
  playerLabel.anchor.set(0.5)
  playerLabel.y = -39
  player.addChild(shadow, body, playerLabel)
  player.x = 310
  player.y = 340
  root.addChild(player)
}

function drawSlime() {
  if (!slime) return
  slime.removeChildren()
  const shadow = new Graphics().ellipse(0, 18, 28, 8).fill({ color: '#52735b', alpha: 0.35 })
  const body = new Graphics()
  body.moveTo(-26, 18).quadraticCurveTo(-25, -18, 0, -25).quadraticCurveTo(25, -18, 27, 18).quadraticCurveTo(0, 29, -26, 18).fill('#76cf5e')
  body.circle(-9, -2, 3).fill('#294338')
  body.circle(9, -2, 3).fill('#294338')
  body.arc(0, 7, 8, 0.12, Math.PI - 0.12).stroke({ width: 2, color: '#294338' })
  slimeBar = new Graphics()
  slimeBar.roundRect(-29, -42, 58, 7, 4).fill('#5d8062')
  slimeBar.roundRect(-27, -40, 54 * (enemyHp.value / 60), 3).fill('#e36c5a')
  slime.addChild(shadow, body, slimeBar)
}

function createEnemy(root: Container) {
  enemiesLayer = new Container()
  slime = new Container()
  slime.x = 650
  slime.y = 345
  drawSlime()
  enemiesLayer.addChild(slime)
  root.addChild(enemiesLayer)
}

function onKeyDown(event: KeyboardEvent) {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
    event.preventDefault()
    keys.add(event.code)
  }
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.code)
}

function gameLoop() {
  if (!player || !app) return
  const currentPlayer = player
  const speed = 2.7
  let dx = 0
  let dy = 0
  if (keys.has('KeyW')) dy -= speed
  if (keys.has('KeyS')) dy += speed
  if (keys.has('KeyA')) dx -= speed
  if (keys.has('KeyD')) dx += speed
  if (dx || dy) {
    const length = Math.hypot(dx, dy)
    currentPlayer.x = Math.max(22, Math.min(938, currentPlayer.x + (dx / length) * speed))
    currentPlayer.y = Math.max(42, Math.min(610, currentPlayer.y + (dy / length) * speed))
  }
  animationFrame = requestAnimationFrame(gameLoop)
}

function attack() {
  if (!slime || !player || enemyHp.value <= 0 || !attackReady) return
  const distance = Math.hypot(player.x - slime.x, player.y - slime.y)
  if (distance > 105) {
    status.value = '离史莱姆太远了。'
    return
  }

  attackReady = false
  enemyHp.value = Math.max(0, enemyHp.value - 15)
  drawSlime()
  status.value = '你发动了普通攻击。'
  if (enemyHp.value === 0) {
    status.value = '史莱姆被击败，获得 10 点经验。'
    addExperience(10)
    window.setTimeout(respawnSlime, 1800)
  }
  window.setTimeout(() => { attackReady = true }, 350)
}

function respawnSlime() {
  enemyHp.value = 60
  drawSlime()
  status.value = '史莱姆重新出现了。'
}

function onCanvasClick(event: MouseEvent) {
  if (!app || !slime) return
  const bounds = app.canvas.getBoundingClientRect()
  const scaleX = 960 / bounds.width
  const scaleY = 640 / bounds.height
  const x = (event.clientX - bounds.left) * scaleX
  const y = (event.clientY - bounds.top) * scaleY
  if (slime && Math.hypot(x - slime.x, y - slime.y) < 42) attack()
}

async function initializeGame() {
  if (!playerName.value.trim()) return
  persistState()
  await nextTick()

  app = new Application()
  await app.init({ width: 960, height: 640, background: '#dcefd6', antialias: true, autoDensity: true, resolution: window.devicePixelRatio || 1 })
  gameHost.value?.appendChild(app.canvas)
  app.canvas.classList.add('game-canvas')
  app.canvas.addEventListener('click', onCanvasClick)

  const world = new Container()
  app.stage.addChild(world)
  createMap(world)
  createEnemy(world)
  createPlayer(world)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  gameLoop()
}

function leaveGame() {
  cleanupGame()
  router.push('/login')
}

function cleanupGame() {
  cancelAnimationFrame(animationFrame)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (app) {
    app.canvas.removeEventListener('click', onCanvasClick)
    app.destroy(true, { children: true })
    app = undefined
  }
  keys.clear()
}

onMounted(initializeGame)
onBeforeUnmount(cleanupGame)

</script>
<style lang="scss">
.game { width: 1200px; margin: 0 auto; padding-top: 24px; display: grid; grid-template-columns: 960px 200px; gap: 20px; }
.canvas { width: 960px; height: 640px; border: 1px solid #9bbca0; background: #dcefd6; }
.game-canvas { display: block; }
.hud { display: grid; align-content: start; gap: 10px; padding: 12px; border-left: 1px solid #c7d8c9; color: #4d6755; span { font-size: 13px; } .leave { border-color: #a7c4ad; background: transparent; color: #4d6755; } }
.action { height: 40px; padding: 0 12px; border: 1px solid #efcf86; border-radius: 3px; background: #d8b45a; color: #23382a; text-align: center; line-height: 38px; cursor: pointer; &.disabled { cursor: not-allowed; opacity: .5; pointer-events: none; } }
</style>










