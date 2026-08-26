<template>
  <div ref="gameHost"></div>
</template>

<script setup lang="ts">
import { Application, Assets, Container, Sprite, Texture } from 'pixi.js'
import mapUrl from '@/assets/game/maps/forest-clearing.png'

const gameHost = ref<HTMLDivElement | null>(null)
let app: Application | undefined

function createMap(root: Container, texture: Texture) {
  const map = new Sprite(texture)
  map.width = 960
  map.height = 640
  root.addChild(map)
}

async function initializeGame() {
  app = new Application()
  await app.init({ width: 960, height: 640, background: '#dcefd6', antialias: true, autoDensity: true, resolution: window.devicePixelRatio || 1 })
  gameHost.value?.appendChild(app.canvas)
  app.canvas.classList.add('game-canvas')

  const texture = await Assets.load(mapUrl)
  const world = new Container()
  app.stage.addChild(world)
  createMap(world, texture)
}

function cleanupGame() {
  app?.destroy(true, { children: true })
  app = undefined
}

onMounted(initializeGame)
onBeforeUnmount(cleanupGame)
</script>