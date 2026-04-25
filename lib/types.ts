// Type definitions for the ID Card Generator System

export type CardSize = {
  id: string
  name: string
  width: number // in inches
  height: number // in inches
  dpi: number
}

export type FieldType =
  | "name"
  | "class"
  | "sec"
  | "dob"
  | "mobile"
  | "address"
  | "mother_name"
  | "aadhaar_no"
  | "photo"
  | "photo_no"

export type CanvasElement = {
  id: string
  type: "text" | "image" | "shape" | "field" | "photo_box"
  x: number
  y: number
  width: number
  height: number
  rotation: number
  content?: string
  fieldType?: FieldType
  fontSize?: number
  fontWeight?: number
  fontColor?: string
  fontFamily?: string
  textAlign?: "left" | "center" | "right"
  fieldPlaceholder?: string
  imageUrl?: string
  offsetX?: number
  offsetY?: number
}

export type Template = {
  id: string
  name: string
  cardSize: CardSize
  elements: CanvasElement[]
  backgroundImage?: string
  createdAt: Date
}

export type StudentData = {
  name: string
  class: string
  sec: string
  dob: string
  mobile: string
  address: string
  mother_name: string
  aadhaar_no: string
  photo_no: string
  photoNumber?: string
  photoUrl?: string
  photoStatus?: "matched" | "missing"
  hasPhotoError?: boolean
}

export const FIELD_LABELS: Record<FieldType, string> = {
  name: "Name",
  class: "Class",
  sec: "Section",
  dob: "Date of Birth",
  mobile: "Mobile Number",
  address: "Address",
  mother_name: "Mother Name",
  aadhaar_no: "Aadhaar Number",
  photo: "Photo",
  photo_no: "Photo Number (P)",
}

export const FIELD_PLACEHOLDERS: Record<FieldType, string> = {
  name: "{{name}}",
  class: "{{class}}",
  sec: "{{sec}}",
  dob: "{{dob}}",
  mobile: "{{mobile}}",
  address: "{{address}}",
  mother_name: "{{mother_name}}",
  aadhaar_no: "{{aadhaar_no}}",
  photo: "{{photo}}",
  photo_no: "{{P-xxx}}",
}

export type StoredTemplate = {
  templateId: string
  templateName: string
  cardSize: CardSize
  canvasElements: CanvasElement[]
  backgroundImage?: string
  createdAt: string
  updatedAt: string
  thumbnailDataUrl?: string
}

export type StoredGeneratedCard = {
  generatedCardId: string
  sourceTemplateId: string
  studentData: StudentData
  imageDataUrl: string
  generatedAt: string
}

export type ExcelColumn = {
  excelHeader: string
  fieldType: FieldType | null
}

export type GeneratedCardsBatch = {
  batchId: string
  batchName: string
  sourceTemplateId: string
  cards: StoredGeneratedCard[]
  createdAt: string
}
