"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Model {
  id: string
  name: string
  provider: string
  apiKey: string
  type: string
  description: string
  active: boolean
}

export interface User {
  name: string
  email: string
}

interface StoreState {
  models: Model[]
  user: User | null
  setModels: (models: Model[]) => void // New action
  addModel: (model: Model) => void
  updateModel: (id: string, updates: Partial<Model>) => void
  removeModel: (id: string) => void
  updateUser: (user: User) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      models: [],
      user: null,
      setModels: (models) => { // Implementation for the new action
        console.log("[Store] setModels called with:", models)
        set({ models })
      },
      addModel: (model) => {
        console.log("[Store] addModel called with:", model)
        set((state) => ({
          models: [...state.models, model],
        }))
      },
      updateModel: (id, updates) => {
        console.log("[Store] updateModel called for id:", id, "with updates:", updates)
        set((state) => ({
          models: state.models.map((model) => (model.id === id ? { ...model, ...updates } : model)),
        }))
      },
      removeModel: (id) => {
        console.log("[Store] removeModel called for id:", id)
        set((state) => ({
          models: state.models.filter((model) => model.id !== id),
        }))
      },
      updateUser: (user) =>
        set(() => ({
          user,
        })),
    }),
    {
      name: "majin-storage",
    },
  ),
)
