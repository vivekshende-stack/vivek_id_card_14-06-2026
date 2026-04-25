// Utility functions for template operations

import type { CanvasElement, CardSize, StoredTemplate } from "./types"

// Generate a thumbnail from canvas elements
export async function generateThumbnail(
  cardSize: CardSize,
  canvasElements: CanvasElement[],
  backgroundImage?: string,
): Promise<string> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  // Create smaller thumbnail (300px wide max)
  const thumbnailWidth = 300
  const aspectRatio = cardSize.height / cardSize.width
  const thumbnailHeight = thumbnailWidth * aspectRatio

  canvas.width = thumbnailWidth
  canvas.height = thumbnailHeight

  // Scale factor from full size to thumbnail
  const scale = thumbnailWidth / (cardSize.width * cardSize.dpi)

  // Draw background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw background image if exists
  if (backgroundImage) {
    await new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = backgroundImage
    })
  }

  // Draw elements (scaled down)
  for (const element of canvasElements) {
    ctx.save()
    ctx.translate(element.x * scale, element.y * scale)
    ctx.rotate((element.rotation * Math.PI) / 180)

    if (element.type === "text" || element.type === "field") {
      const fontFamily = element.fontFamily || "Arial"
      const fontSize = (element.fontSize || 16) * scale
      const fontWeight = element.fontWeight || 400
      ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
      ctx.fillStyle = element.fontColor || "#000000"

      const textAlign = element.textAlign || "left"
      ctx.textAlign = textAlign
      ctx.textBaseline = "middle"

      let textX = 0
      if (textAlign === "center") {
        textX = (element.width * scale) / 2
      } else if (textAlign === "right") {
        textX = element.width * scale
      }

      const textY = (element.height * scale) / 2
      const text = element.fieldPlaceholder || element.content || "Text"
      ctx.fillText(text, textX, textY)
    } else if (element.type === "shape") {
      ctx.fillStyle = element.fontColor || "#000000"
      ctx.fillRect(0, 0, element.width * scale, element.height * scale)
    } else if (element.type === "image" && element.imageUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0, element.width * scale, element.height * scale)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = element.imageUrl!
      })
    }

    ctx.restore()
  }

  return canvas.toDataURL("image/png")
}

// Validate template before saving
export function validateTemplate(
  templateName: string,
  cardSize: CardSize | null,
  canvasElements: CanvasElement[],
): { valid: boolean; error?: string } {
  if (!templateName.trim()) {
    return { valid: false, error: "Template name is required" }
  }

  if (!cardSize) {
    return { valid: false, error: "Card size must be selected" }
  }

  if (canvasElements.length === 0) {
    return { valid: false, error: "Template must have at least one element" }
  }

  return { valid: true }
}

// Clone template for safe generation
export function cloneTemplate(template: StoredTemplate): StoredTemplate {
  return JSON.parse(JSON.stringify(template))
}
