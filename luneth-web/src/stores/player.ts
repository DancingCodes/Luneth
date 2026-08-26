import { defineStore } from 'pinia'

const STORAGE_KEY = 'luneth-prototype'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    name: '',
    level: 1,
    experience: 0,
  }),
  getters: {
    nextLevelExperience: (state) => state.level * 30,
  },
  actions: {
    restore() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      try {
        const state = JSON.parse(saved)
        this.name = state.name || ''
        this.level = state.level || 1
        this.experience = state.experience || 0
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    login(name: string) {
      this.name = name.trim().slice(0, 12)
      this.persist()
    },
    addExperience(amount: number) {
      this.experience += amount
      while (this.experience >= this.nextLevelExperience) {
        this.experience -= this.nextLevelExperience
        this.level += 1
      }
      this.persist()
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: this.name, level: this.level, experience: this.experience }))
    },
  },
})
