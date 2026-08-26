<template>
  <div ref="gameHost" class="game"></div>
</template>

<script setup lang="ts">
import { Application, Assets, Container, Sprite, Texture } from 'pixi.js'
import mapUrl from '@/assets/game/maps/forest-clearing.png'

const gameHost = ref<HTMLDivElement | null>(null)

let app: Application | undefined
async function initializeGame() {
  app = new Application()
  await app.init({ resizeTo: window })
  gameHost.value?.appendChild(app.canvas)
  const texture = await Assets.load(mapUrl)
  const world = new Container()
  app.stage.addChild(world)
  app.renderer.on('resize', resizeMap)
  createMap(world, texture)
}

let map: Sprite | undefined
function createMap(root: Container, texture: Texture) {
  map = new Sprite(texture)
  root.addChild(map)
  resizeMap()
}

function resizeMap() {
  if (!app || !map) return
  const scale = Math.min(app.screen.width / map.texture.width, app.screen.height / map.texture.height)
  map.scale.set(scale)
  map.x = (app.screen.width - map.width) / 2
  map.y = (app.screen.height - map.height) / 2
}

function cleanupGame() {
  app?.renderer.off('resize', resizeMap)
  app?.destroy(true, { children: true })
  app = undefined
}

onMounted(initializeGame)
onBeforeUnmount(cleanupGame)
</script>

<style lang="scss">
.game {
  height: 100vh;
  overflow: hidden;
}
</style>

