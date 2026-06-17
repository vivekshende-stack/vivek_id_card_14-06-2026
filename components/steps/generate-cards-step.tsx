"use client"

import { useEffect, useRef, useState } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, CreditCard, AlertTriangle } from "lucide-react"
import type { StudentData } from "@/lib/types"
import { TemplateSelectionBanner } from "@/components/template-selection-banner"
import { cloneTemplate } from "@/lib/template-utils"
import {
  saveGeneratedCardToStorage,
  saveBatchToStorage,
  type StoredGeneratedCard,
  type StoredBatch,
} from "@/lib/storage"
import { normalizeDOB, formatDOBForDisplay } from "@/lib/date-utils"
import { generatePlaceholderImage } from "@/lib/photo-utils"
import { PhotoPreviewScreen } from "@/components/photo-preview-screen"
import { format } from "date-fns"
import { autoFitText, wrapText, renderMultiLineText } from "@/lib/text-utils"

export function GenerateCardsStep() {
  const {
    setCurrentStep,
    selectedTemplateId,
    savedTemplates,
    excelData,
    generatedCards,
    setGeneratedCards,
    isGenerating,
    setIsGenerating,
    photoMatchResults,
  } = useCardGeneratorStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const generationProgress = generatedCards.length
  const [savingToStorage, setSavingToStorage] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const selectedTemplate = selectedTemplateId ? savedTemplates.find((t) => t.templateId === selectedTemplateId) : null

  useEffect(() => {
    if (isGenerating) {
      generateAllCards()
    }
  }, [isGenerating])

  const generateAllCards = async () => {
    if (!canvasRef.current || !selectedTemplate) return

    const templateClone = cloneTemplate(selectedTemplate)

    const cards: { id: string; dataUrl: string; studentData: StudentData }[] = []

    for (let i = 0; i < excelData.length; i++) {
      const studentData = excelData[i]

      const normalizedStudentData = {
        ...studentData,
        dob: normalizeDOB(studentData.dob),
      }

      const dataUrl = await generateSingleCard(normalizedStudentData, templateClone)
      if (dataUrl) {
        const cardId = normalizedStudentData.photoNumber || normalizedStudentData.photo_no || `card-${i + 1}`
        cards.push({
          id: `P_${cardId}`,
          dataUrl,
          studentData: normalizedStudentData,
        })
        setGeneratedCards([...cards])
      }
      // Small delay to prevent UI freezing
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    setIsGenerating(false)

    setSavingToStorage(true)
    await saveGeneratedCardsToBatch(cards, selectedTemplate.templateId)
    setSavingToStorage(false)
  }

  const saveGeneratedCardsToBatch = async (
    cards: { id: string; dataUrl: string; studentData: StudentData }[],
    templateId: string,
  ) => {
    try {
      const batchId = `batch-${Date.now()}`
      const batchName = `Batch_${format(new Date(), "yyyy_MM_dd_HHmmss")}`

      const batch: StoredBatch = {
        batchId,
        batchName,
        sourceTemplateId: templateId,
        cardCount: cards.length,
        createdAt: new Date().toISOString(),
        photoMatchStats: photoMatchResults
          ? {
              matched: photoMatchResults.matchedCount,
              missing: photoMatchResults.missingCount,
              unmatched: photoMatchResults.unmatchedPhotos.length,
            }
          : undefined,
      }

      await saveBatchToStorage(batch)

      for (const card of cards) {
        const storedCard: StoredGeneratedCard = {
          generatedCardId: card.id,
          sourceTemplateId: templateId,
          studentData: card.studentData,
          imageDataUrl: card.dataUrl,
          generatedAt: new Date().toISOString(),
          batchId,
        }
        await saveGeneratedCardToStorage(storedCard)
      }
    } catch (error) {
      console.error("Error saving cards to storage:", error)
    }
  }

  const generateSingleCard = async (
    studentData: StudentData,
    template: typeof selectedTemplate,
  ): Promise<string | null> => {
    const canvas = canvasRef.current
    if (!canvas || !template) return null

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const { cardSize, canvasElements, backgroundImage } = template

    const width = cardSize.width * cardSize.dpi
    const height = cardSize.height * cardSize.dpi

    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw background image if exists
    if (backgroundImage) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = backgroundImage
      })
    }

    let hasPhotoMissing = false

    // Draw elements with data substitution
    for (const element of canvasElements) {
      ctx.save()
      ctx.translate(element.x, element.y)
      ctx.rotate((element.rotation * Math.PI) / 180)

      if (element.type === "text") {
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

        textX += element.offsetX || 0
        const textY = element.height / 2 + (element.offsetY || 0)

        const content = element.content || ""
        ctx.fillText(content, textX, textY)
      } else if (element.type === "photo_box") {
        const photoUrl = studentData.photoUrl

        if (photoUrl) {
          // Photo exists - render it
          await new Promise<void>((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              const targetWidth = element.width
              const targetHeight = element.height
              const targetRatio = targetWidth / targetHeight
              const imgRatio = img.width / img.height

              let drawWidth = img.width
              let drawHeight = img.height
              let sourceX = 0
              let sourceY = 0

              // Cover mode: crop to fit
              if (imgRatio > targetRatio) {
                drawHeight = img.height
                drawWidth = img.height * targetRatio
                sourceX = (img.width - drawWidth) / 2
                sourceY = 0
              } else {
                drawWidth = img.width
                drawHeight = img.width / targetRatio
                sourceX = 0
                sourceY = (img.height - drawHeight) / 2
              }

              ctx.drawImage(img, sourceX, sourceY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight)
              resolve()
            }
            img.onerror = () => {
              // Photo failed to load - use placeholder
              hasPhotoMissing = true
              ctx.fillStyle = "#e5e7eb"
              ctx.fillRect(0, 0, element.width, element.height)

              ctx.fillStyle = "#6b7280"
              ctx.font = "bold 16px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText("NO PHOTO", element.width / 2, element.height / 2)
              resolve()
            }
            img.src = photoUrl
          })
        } else {
          // Photo missing - mark for red indication
          hasPhotoMissing = true

          // Draw placeholder
          ctx.fillStyle = "#e5e7eb"
          ctx.fillRect(0, 0, element.width, element.height)

          ctx.fillStyle = "#6b7280"
          ctx.font = "bold 16px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("NO PHOTO", element.width / 2, element.height / 2)
        }
      } else if (element.type === "field" && (element.fieldType || element.customFieldId)) {
        if (element.fieldType === "photo") {
          const photoUrl = studentData.photoUrl || generatePlaceholderImage(element.width, element.height)
          await new Promise<void>((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              const targetWidth = element.width
              const targetHeight = element.height
              const targetRatio = targetWidth / targetHeight
              const imgRatio = img.width / img.height

              let drawWidth = img.width
              let drawHeight = img.height
              let sourceX = 0
              let sourceY = 0

              if (imgRatio > targetRatio) {
                drawHeight = img.height
                drawWidth = img.height * targetRatio
                sourceX = (img.width - drawWidth) / 2
                sourceY = 0
              } else {
                drawWidth = img.width
                drawHeight = img.width / targetRatio
                sourceX = 0
                sourceY = (img.height - drawHeight) / 2
              }

              ctx.drawImage(img, sourceX, sourceY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight)
              resolve()
            }
            img.onerror = () => {
              const placeholder = generatePlaceholderImage(element.width, element.height)
              const placeholderImg = new Image()
              placeholderImg.onload = () => {
                ctx.drawImage(placeholderImg, 0, 0, element.width, element.height)
                resolve()
              }
              placeholderImg.onerror = () => {
                resolve()
              }
              placeholderImg.src = placeholder
            }
            img.src = photoUrl
          })
        } else {
          let value = ""
          
          if (element.fieldType) {
            value = studentData[element.fieldType as keyof StudentData] || ""
            if (element.fieldType === "photo_no") {
              value = value ? `P-${value}` : ""
            } else if (element.fieldType === "dob") {
              value = formatDOBForDisplay(value)
            }
          } else if (element.customFieldId) {
            // For custom fields, we need to find the key from store
            // Get store state for customFields
            const storeCustomFields = useCardGeneratorStore.getState().customFields
            const customField = storeCustomFields.find(f => f.id === element.customFieldId)
            if (customField) {
              value = studentData[customField.key] || ""
            }
          }

          const fontFamily = element.fontFamily || "Arial"
          const fontSize = element.fontSize || 16
          const fontWeight = element.fontWeight || 400
          const textAlign = element.textAlign || "left"

          ctx.fillStyle = element.fontColor || "#000000"
          ctx.textAlign = textAlign

          // Calculate available width for text (respecting text alignment)
          const availableWidth = element.width - (element.offsetX ? Math.abs(element.offsetX) * 2 : 0)

          // NAME FIELD: Auto-fit single line (Photoshop-like behavior)
          if (element.fieldType === "name") {
            // Auto-fit: shrink font size to fit text in box
            const finalFontSize = autoFitText(ctx, value, availableWidth, fontFamily, fontSize, fontWeight)

            // Re-set font with final size
            ctx.font = `${fontWeight} ${finalFontSize}px "${fontFamily}"`
            ctx.textBaseline = "middle"

            // Calculate X position based on alignment
            let textX = 0
            if (textAlign === "center") {
              textX = element.width / 2
            } else if (textAlign === "right") {
              textX = element.width
            }
            textX += element.offsetX || 0

            // Render vertically centered
            const textY = element.height / 2 + (element.offsetY || 0)
            ctx.fillText(value, textX, textY)
          }
          // ADDRESS FIELD: Multi-line wrapping (textarea-like behavior)
          else if (element.fieldType === "address") {
            // Wrap text into multiple lines
            const lines = wrapText(ctx, value, availableWidth, fontSize, fontFamily, fontWeight)

            // Re-set font (wrapText might have changed it)
            ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
            ctx.textBaseline = "top"

            // Calculate X position based on alignment
            let textX = 0
            if (textAlign === "center") {
              textX = element.width / 2
            } else if (textAlign === "right") {
              textX = element.width
            }
            textX += element.offsetX || 0

            // Start from TOP of box (not center)
            const startY = element.offsetY || 0
            renderMultiLineText(ctx, lines, textX, startY, fontSize, 1.3)
          }
          // OTHER FIELDS: Keep original behavior
          else {
            ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
            ctx.textBaseline = "middle"

            let textX = 0
            if (textAlign === "center") {
              textX = element.width / 2
            } else if (textAlign === "right") {
              textX = element.width
            }
            textX += element.offsetX || 0

            const textY = element.height / 2 + (element.offsetY || 0)
            ctx.fillText(value, textX, textY)
          }
        }
      } else if (element.type === "shape") {
        ctx.fillStyle = element.fontColor || "#000000"
        ctx.fillRect(0, 0, element.width, element.height)
      } else if (element.type === "image" && element.imageUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            ctx.drawImage(img, 0, 0, element.width, element.height)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = element.imageUrl!
        })
      }

      ctx.restore()
    }

    if (hasPhotoMissing) {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, width - 8, height - 8)

      studentData.hasPhotoError = true
    }

    return canvas.toDataURL("image/png")
  }

  const handleStartGeneration = () => {
    if (!selectedTemplate) {
      alert("Please select a template before generating cards")
      return
    }
    setGeneratedCards([])
    setShowPreview(false)
    setIsGenerating(true)
  }

  const progressPercentage = excelData.length > 0 ? (generationProgress / excelData.length) * 100 : 0

  const cardsWithPhotoErrors = generatedCards.filter((card) => card.studentData.hasPhotoError).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">
            {showPreview ? "Preview & Generate" : "Generate ID Cards"}
          </h2>
          <p className="text-muted-foreground">
            {showPreview
              ? "Review student data and photo matching before generation"
              : "Generate all ID cards from your template and data"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(4)} disabled={isGenerating}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {!showPreview && generatedCards.length > 0 && (
            <Button onClick={() => setCurrentStep(6)}>
              View & Download
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <TemplateSelectionBanner />

      {/* Preview Screen */}
      {showPreview && photoMatchResults && (
        <div className="space-y-6">
          <PhotoPreviewScreen />

          <div className="flex justify-center">
            <Button onClick={handleStartGeneration} size="lg" className="px-8" disabled={!selectedTemplate}>
              Start Generation ({excelData.length} Cards)
            </Button>
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {!showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Bulk Generation
            </CardTitle>
            <CardDescription>Generate {excelData.length} ID cards from your template and data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedTemplate && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">No Template Selected</p>
                  <p className="text-sm text-muted-foreground">Please select a template before generating cards</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Generating cards with embedded photos...</span>
                    <span className="font-medium text-foreground">
                      {generationProgress} / {excelData.length}
                    </span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>
                <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-border">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p className="text-sm text-muted-foreground">Processing ID cards...</p>
                </div>
              </div>
            )}

            {generatedCards.length > 0 && !isGenerating && (
              <div className="space-y-4">
                <div className="p-6 bg-primary/10 rounded-lg border border-primary/20 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                  <div className="space-y-1">
                    <p className="font-medium text-primary">Generation Complete!</p>
                    <p className="text-sm text-muted-foreground">
                      {generatedCards.length} ID cards generated successfully with embedded photos
                      {savingToStorage && " and saved to storage"}
                    </p>
                    {cardsWithPhotoErrors > 0 && (
                      <p className="text-sm text-red-600 font-medium mt-2">
                        ⚠️ {cardsWithPhotoErrors} card{cardsWithPhotoErrors > 1 ? "s" : ""} marked with RED border
                        (missing photos)
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview Grid */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-foreground">Preview (First 6 cards)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {generatedCards.slice(0, 6).map((card, index) => (
                      <div key={index} className="border border-border rounded-lg overflow-hidden bg-white">
                        <img
                          src={card.dataUrl || "/placeholder.svg"}
                          alt={`Card ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <div
                          className={`p-2 text-center ${card.studentData.hasPhotoError ? "bg-red-100" : "bg-muted/50"}`}
                        >
                          <p
                            className={`text-xs ${card.studentData.hasPhotoError ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                          >
                            {card.id} {card.studentData.hasPhotoError && "⚠️"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
