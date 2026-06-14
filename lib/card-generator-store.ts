"use client"

import { create } from "zustand"
import type { CardSize, Template, CanvasElement, ExcelColumn, StudentData, StoredTemplate, CustomField } from "./types"
import {
  saveTemplateToStorage,
  getAllTemplates,
  deleteTemplateFromStorage,
  saveSelectedTemplateId,
  getSelectedTemplateId,
  clearSelectedTemplateId,
  initDB,
  getTemplateById,
} from "./storage"

// Preset card sizes
export const PRESET_SIZES: CardSize[] = [
  { id: "2x3.2-300", name: "2 x 3.2 inches (300 DPI)", width: 2, height: 3.2, dpi: 300 },
  { id: "2x3-300", name: "2 x 3 inches (300 DPI)", width: 2, height: 3, dpi: 300 },
  { id: "custom", name: "Custom Size", width: 2, height: 3, dpi: 300 },
]

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface CardGeneratorState {
  // Navigation
  currentStep: Step
  setCurrentStep: (step: Step) => void

  // Step 1: Card Size
  selectedCardSize: CardSize | null
  setSelectedCardSize: (size: CardSize) => void

  // Step 2: Template Design
  currentTemplate: Template | null
  setCurrentTemplate: (template: Template) => void
  canvasElements: CanvasElement[]
  setCanvasElements: (elements: CanvasElement[]) => void
  addCanvasElement: (element: CanvasElement) => void
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void
  removeCanvasElement: (id: string) => void
  backgroundImage: string | null
  setBackgroundImage: (url: string | null) => void
  
  // Custom Fields
  customFields: CustomField[]
  setCustomFields: (fields: CustomField[]) => void
  addCustomField: (field: CustomField) => void
  removeCustomField: (id: string) => void
  updateCustomField: (id: string, updates: Partial<CustomField>) => void

  savedTemplates: StoredTemplate[]
  selectedTemplateId: string | null
  loadTemplatesFromStorage: () => Promise<void>
  saveTemplate: (name: string) => Promise<void>
  updateTemplate: (templateId: string, name: string) => Promise<void>
  loadTemplate: (template: StoredTemplate) => void
  deleteTemplate: (id: string) => Promise<void>
  setSelectedTemplateId: (id: string | null) => void
  initializeApp: () => Promise<void>

  // Step 4: Excel Upload
  excelData: StudentData[]
  setExcelData: (data: StudentData[]) => void
  columnMappings: ExcelColumn[]
  setColumnMappings: (mappings: ExcelColumn[]) => void

  // Step 5 & 6: Generation
  generatedCards: { id: string; dataUrl: string; studentData: StudentData }[]
  setGeneratedCards: (cards: { id: string; dataUrl: string; studentData: StudentData }[]) => void
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // Photo ZIP management
  photoZipFile: File | null
  setPhotoZipFile: (file: File | null) => void
  photoMatchResults: any | null
  setPhotoMatchResults: (results: any) => void
}

export const useCardGeneratorStore = create<CardGeneratorState>((set, get) => ({
  // Navigation
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Step 1
  selectedCardSize: PRESET_SIZES[0],
  setSelectedCardSize: (size) => set({ selectedCardSize: size }),

  // Step 2
  currentTemplate: null,
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  canvasElements: [],
  setCanvasElements: (elements) => set({ canvasElements: elements }),
  addCanvasElement: (element) => set((state) => ({ canvasElements: [...state.canvasElements, element] })),
  updateCanvasElement: (id, updates) =>
    set((state) => ({
      canvasElements: state.canvasElements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    })),
  removeCanvasElement: (id) =>
    set((state) => ({
      canvasElements: state.canvasElements.filter((el) => el.id !== id),
    })),
  backgroundImage: null,
  setBackgroundImage: (url) => set({ backgroundImage: url }),

  // Custom Fields
  customFields: [],
  setCustomFields: (fields) => set({ customFields: fields }),
  addCustomField: (field) => set((state) => ({ customFields: [...state.customFields, field] })),
  removeCustomField: (id) =>
    set((state) => ({
      customFields: state.customFields.filter((f) => f.id !== id),
    })),
  updateCustomField: (id, updates) =>
    set((state) => ({
      customFields: state.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  savedTemplates: [],
  selectedTemplateId: null,

  initializeApp: async () => {
    await initDB()
    const templates = await getAllTemplates()
    const selectedId = getSelectedTemplateId()

    set({ savedTemplates: templates, selectedTemplateId: selectedId })

    // Restore selected template if exists
    if (selectedId) {
      const template = await getTemplateById(selectedId)
      if (template) {
        const customFields = (template.customFields || []).map(f => ({
          ...f,
          createdAt: f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt as string),
        }))
        
        set({
          selectedCardSize: template.cardSize,
          canvasElements: template.canvasElements,
          backgroundImage: template.backgroundImage || null,
          customFields,
        })
      }
    }
  },

  loadTemplatesFromStorage: async () => {
    const templates = await getAllTemplates()
    set({ savedTemplates: templates })
  },

  saveTemplate: async (name) => {
    const state = get()
    if (!state.selectedCardSize) return

    const now = new Date().toISOString()
    const templateId = state.selectedTemplateId || `template-${Date.now()}`

    const storedTemplate: StoredTemplate = {
      templateId,
      templateName: name,
      cardSize: state.selectedCardSize,
      canvasElements: state.canvasElements,
      backgroundImage: state.backgroundImage || undefined,
      customFields: state.customFields.map(f => ({
        ...f,
        createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
      })) as any,
      createdAt: state.selectedTemplateId
        ? state.savedTemplates.find((t) => t.templateId === state.selectedTemplateId)?.createdAt || now
        : now,
      updatedAt: now,
    }

    await saveTemplateToStorage(storedTemplate)
    await get().loadTemplatesFromStorage()

    set({ selectedTemplateId: templateId })
    saveSelectedTemplateId(templateId)
  },

  updateTemplate: async (templateId: string, name: string) => {
    const state = get()
    const existing = state.savedTemplates.find((t) => t.templateId === templateId)
    if (!existing) return

    const updated: StoredTemplate = {
      ...existing,
      templateName: name,
      updatedAt: new Date().toISOString(),
    }

    await saveTemplateToStorage(updated)
    await get().loadTemplatesFromStorage()
  },

  loadTemplate: (template) => {
    const customFields = (template.customFields || []).map(f => ({
      ...f,
      createdAt: f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt as string),
    }))
    
    set({
      selectedCardSize: template.cardSize,
      canvasElements: template.canvasElements,
      backgroundImage: template.backgroundImage || null,
      customFields,
      selectedTemplateId: template.templateId,
    })
    saveSelectedTemplateId(template.templateId)
  },

  deleteTemplate: async (id) => {
    await deleteTemplateFromStorage(id)
    await get().loadTemplatesFromStorage()

    const state = get()
    if (state.selectedTemplateId === id) {
      set({ selectedTemplateId: null })
      clearSelectedTemplateId()
    }
  },

  setSelectedTemplateId: (id) => {
    set({ selectedTemplateId: id })
    if (id) {
      saveSelectedTemplateId(id)
    } else {
      clearSelectedTemplateId()
    }
  },

  // Step 4
  excelData: [],
  setExcelData: (data) => set({ excelData: data }),
  columnMappings: [],
  setColumnMappings: (mappings) => set({ columnMappings: mappings }),

  // Step 5 & 6
  generatedCards: [],
  setGeneratedCards: (cards) => set({ generatedCards: cards }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating: isGenerating }),

  // Photo ZIP management
  photoZipFile: null,
  setPhotoZipFile: (file) => set({ photoZipFile: file }),
  photoMatchResults: null,
  setPhotoMatchResults: (results) => set({ photoMatchResults: results }),
}))
