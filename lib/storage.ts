// IndexedDB and localStorage utilities for template and generated card management

const DB_NAME = "IDCardGeneratorDB"
const DB_VERSION = 2 // Incremented version for schema update
const TEMPLATE_STORE = "templates"
const GENERATED_CARDS_STORE = "generatedCards"
const BATCHES_STORE = "batches" // New store for batch management

// IndexedDB connection
let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create templates object store
      if (!database.objectStoreNames.contains(TEMPLATE_STORE)) {
        const templateStore = database.createObjectStore(TEMPLATE_STORE, { keyPath: "templateId" })
        templateStore.createIndex("templateName", "templateName", { unique: false })
        templateStore.createIndex("createdAt", "createdAt", { unique: false })
      }

      // Create generated cards object store
      if (!database.objectStoreNames.contains(GENERATED_CARDS_STORE)) {
        const cardsStore = database.createObjectStore(GENERATED_CARDS_STORE, { keyPath: "generatedCardId" })
        cardsStore.createIndex("sourceTemplateId", "sourceTemplateId", { unique: false })
        cardsStore.createIndex("generatedAt", "generatedAt", { unique: false })
        cardsStore.createIndex("batchId", "batchId", { unique: false }) // Added batchId index
      }

      if (!database.objectStoreNames.contains(BATCHES_STORE)) {
        const batchesStore = database.createObjectStore(BATCHES_STORE, { keyPath: "batchId" })
        batchesStore.createIndex("sourceTemplateId", "sourceTemplateId", { unique: false })
        batchesStore.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
  })
}

// Template CRUD Operations
export async function saveTemplateToStorage(template: StoredTemplate): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TEMPLATE_STORE], "readwrite")
    const store = transaction.objectStore(TEMPLATE_STORE)
    const request = store.put(template)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllTemplates(): Promise<StoredTemplate[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TEMPLATE_STORE], "readonly")
    const store = transaction.objectStore(TEMPLATE_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function getTemplateById(templateId: string): Promise<StoredTemplate | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TEMPLATE_STORE], "readonly")
    const store = transaction.objectStore(TEMPLATE_STORE)
    const request = store.get(templateId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteTemplateFromStorage(templateId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TEMPLATE_STORE], "readwrite")
    const store = transaction.objectStore(TEMPLATE_STORE)
    const request = store.delete(templateId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Generated Card CRUD Operations
export async function saveGeneratedCardToStorage(card: StoredGeneratedCard): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readwrite")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)
    const request = store.put(card)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllGeneratedCards(): Promise<StoredGeneratedCard[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readonly")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function getGeneratedCardsByTemplateId(templateId: string): Promise<StoredGeneratedCard[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readonly")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)
    const index = store.index("sourceTemplateId")
    const request = index.getAll(templateId)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteGeneratedCardFromStorage(cardId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readwrite")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)
    const request = store.delete(cardId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteAllGeneratedCardsForTemplate(templateId: string): Promise<void> {
  const cards = await getGeneratedCardsByTemplateId(templateId)
  await Promise.all(cards.map((card) => deleteGeneratedCardFromStorage(card.generatedCardId)))
}

// localStorage utilities for selected template tracking
const SELECTED_TEMPLATE_KEY = "selectedTemplateId"

export function saveSelectedTemplateId(templateId: string): void {
  localStorage.setItem(SELECTED_TEMPLATE_KEY, templateId)
}

export function getSelectedTemplateId(): string | null {
  return localStorage.getItem(SELECTED_TEMPLATE_KEY)
}

export function clearSelectedTemplateId(): void {
  localStorage.removeItem(SELECTED_TEMPLATE_KEY)
}

// Template Storage Types
export interface StoredTemplate {
  templateId: string
  templateName: string
  cardSize: {
    id: string
    name: string
    width: number
    height: number
    dpi: number
  }
  canvasElements: any[]
  backgroundImage?: string
  customFields?: any[]
  createdAt: string
  updatedAt: string
  thumbnailDataUrl?: string
}

// Generated Card Storage Types
export interface StoredGeneratedCard {
  generatedCardId: string
  sourceTemplateId: string
  studentData: any
  imageDataUrl: string
  generatedAt: string
  batchId?: string // Added batchId for batch association
}

// Batch Storage Type for folder-based organization
export interface StoredBatch {
  batchId: string
  batchName: string
  sourceTemplateId: string
  cardCount: number
  createdAt: string
  photoMatchStats?: {
    matched: number
    missing: number
    unmatched: number
  }
}

export async function saveBatchToStorage(batch: StoredBatch): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BATCHES_STORE], "readwrite")
    const store = transaction.objectStore(BATCHES_STORE)
    const request = store.put(batch)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllBatches(): Promise<StoredBatch[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BATCHES_STORE], "readonly")
    const store = transaction.objectStore(BATCHES_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const batches = request.result || []
      // Sort by createdAt descending (newest first)
      batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      resolve(batches)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getBatchById(batchId: string): Promise<StoredBatch | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BATCHES_STORE], "readonly")
    const store = transaction.objectStore(BATCHES_STORE)
    const request = store.get(batchId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteBatchFromStorage(batchId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BATCHES_STORE], "readwrite")
    const store = transaction.objectStore(BATCHES_STORE)
    const request = store.delete(batchId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getCardsByBatchId(batchId: string): Promise<StoredGeneratedCard[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readonly")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)
    const index = store.index("batchId")
    const request = index.getAll(batchId)

    request.onsuccess = () => {
      const cards = request.result || []
      // Sort cards by photo number (ascending)
      cards.sort((a, b) => {
        const numA = Number.parseInt(a.studentData?.photo_no || "0", 10)
        const numB = Number.parseInt(b.studentData?.photo_no || "0", 10)
        return numA - numB
      })
      resolve(cards)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMultipleCardsFromStorage(cardIds: string[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GENERATED_CARDS_STORE], "readwrite")
    const store = transaction.objectStore(GENERATED_CARDS_STORE)

    let completed = 0
    const total = cardIds.length

    if (total === 0) {
      resolve()
      return
    }

    cardIds.forEach((cardId) => {
      const request = store.delete(cardId)
      request.onsuccess = () => {
        completed++
        if (completed === total) resolve()
      }
      request.onerror = () => reject(request.error)
    })
  })
}
