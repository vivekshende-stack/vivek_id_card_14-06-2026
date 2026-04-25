"use client"

import type React from "react"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Grid, RotateCcw } from "lucide-react"
import { FieldsSidebar } from "@/components/fields-sidebar"
import { PropertiesSidebar } from "@/components/properties-sidebar"
import type { CanvasElement } from "@/lib/types"

export function CanvasDesigner() {
  const {
    selectedCardSize,
    canvasElements,
    setCanvasElements,
    backgroundImage,
    setBackgroundImage,
    updateCanvasElement,
  } = useCardGeneratorStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const canvasWidth = selectedCardSize ? selectedCardSize.width * selectedCardSize.dpi : 600
  const canvasHeight = selectedCardSize ? selectedCardSize.height * selectedCardSize.dpi : 960
  const scale = 0.3 // Scale for display

  useEffect(() => {
    renderCanvas()
  }, [canvasElements, backgroundImage, showGrid, selectedElement])

  useEffect(() => {
    if (selectedElement) {
      const updatedElement = canvasElements.find((el) => el.id === selectedElement.id)
      if (updatedElement) {
        setSelectedElement(updatedElement)
      }
    }
  }, [canvasElements])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return

      const step = e.shiftKey ? 10 : 1
      let updateX = 0
      let updateY = 0

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          updateY = -step
          break
        case "ArrowDown":
          e.preventDefault()
          updateY = step
          break
        case "ArrowLeft":
          e.preventDefault()
          updateX = -step
          break
        case "ArrowRight":
          e.preventDefault()
          updateX = step
          break
        case "Delete":
        case "Backspace":
          e.preventDefault()
          const { removeCanvasElement } = useCardGeneratorStore.getState()
          removeCanvasElement(selectedElement.id)
          setSelectedElement(null)
          return
        default:
          return
      }

      if (updateX !== 0 || updateY !== 0) {
        const newX = selectedElement.x + updateX
        const newY = selectedElement.y + updateY
        updateCanvasElement(selectedElement.id, { x: newX, y: newY })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedElement, updateCanvasElement])

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw background image if exists
    if (backgroundImage) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        drawElements(ctx)
      }
      img.src = backgroundImage
    } else {
      drawElements(ctx)
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }
  }

  const drawElements = (ctx: CanvasRenderingContext2D) => {
    canvasElements.forEach((element) => {
      ctx.save()
      ctx.translate(element.x, element.y)
      ctx.rotate((element.rotation * Math.PI) / 180)

      if (element.type === "text" || element.type === "field") {
        const fontFamily = element.fontFamily || "Arial"
        const fontSize = element.fontSize || 16
        const fontWeight = element.fontWeight || 400
        ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
        ctx.fillStyle = element.fontColor || "#000000"

        const textAlign = element.textAlign || "left"
        ctx.textAlign = textAlign
        ctx.textBaseline = "middle"

        let textX = 0
        if (textAlign === "center") {
          textX = element.width / 2
        } else if (textAlign === "right") {
          textX = element.width
        }

        // Apply user-defined offsets for fine-tuning
        textX += element.offsetX || 0
        const textY = element.height / 2 + (element.offsetY || 0)

        let text = element.content || "Text"
        if (element.type === "field") {
          text = element.fieldPlaceholder || "{{field}}"
        }

        ctx.fillText(text, textX, textY)
      } else if (element.type === "shape") {
        ctx.fillStyle = element.fontColor || "#000000"
        ctx.fillRect(0, 0, element.width, element.height)
      } else if (element.type === "image" && element.imageUrl) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0, element.width, element.height)
        }
        img.src = element.imageUrl
      } else if (element.type === "photo_box") {
        // Black placeholder box with dashed border
        ctx.fillStyle = "#1a1a1a"
        ctx.fillRect(0, 0, element.width, element.height)

        // Dashed white border
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.strokeRect(2, 2, element.width - 4, element.height - 4)
        ctx.setLineDash([])

        // "PHOTO" text
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 20px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("PHOTO", element.width / 2, element.height / 2 - 10)
        ctx.font = "12px Arial"
        ctx.fillText("BOX", element.width / 2, element.height / 2 + 10)
      }

      // Draw selection border
      if (selectedElement?.id === element.id) {
        ctx.strokeStyle = "#6366f1"
        ctx.lineWidth = 2
        ctx.strokeRect(-2, -2, element.width + 4, element.height + 4)
      }

      ctx.restore()
    })
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setBackgroundImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // Check if clicked on an element
    const clickedElement = canvasElements
      .slice()
      .reverse()
      .find((el) => {
        return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
      })

    if (clickedElement) {
      setSelectedElement(clickedElement)
      setIsDragging(true)
      setDragOffset({
        x: x - clickedElement.x,
        y: y - clickedElement.y,
      })
    } else {
      setSelectedElement(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    const newX = Math.max(0, Math.min(canvasWidth - selectedElement.width, x - dragOffset.x))
    const newY = Math.max(0, Math.min(canvasHeight - selectedElement.height, y - dragOffset.y))

    updateCanvasElement(selectedElement.id, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setCanvasElements([])
    setBackgroundImage(null)
    setSelectedElement(null)
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Fields Sidebar */}
      <div className="col-span-3">
        <FieldsSidebar />
      </div>

      {/* Canvas Area */}
      <div className="col-span-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Background
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
            <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
              <Grid className="h-4 w-4 mr-2" />
              {showGrid ? "Hide" : "Show"} Grid
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-muted/30">
          <div className="flex justify-center items-center overflow-auto">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-border bg-white shadow-lg cursor-crosshair"
              style={{
                width: `${canvasWidth * scale}px`,
                height: `${canvasHeight * scale}px`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </Card>
      </div>

      {/* Properties Sidebar */}
      <div className="col-span-3">
        <PropertiesSidebar
          selectedElement={selectedElement}
          onUpdate={(id, updates) => {
            updateCanvasElement(id, updates)
          }}
          onDelete={(id) => {
            const { removeCanvasElement } = useCardGeneratorStore.getState()
            removeCanvasElement(id)
            setSelectedElement(null)
          }}
        />
      </div>
    </div>
  )
}
