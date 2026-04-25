"use client"

import { useState, useEffect } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, CheckCircle2, AlertCircle } from "lucide-react"
import { generateThumbnail, validateTemplate } from "@/lib/template-utils"

interface TemplateManagerProps {
  mode: "save" | "view"
}

export function TemplateManager({ mode }: TemplateManagerProps) {
  const {
    selectedCardSize,
    canvasElements,
    backgroundImage,
    selectedTemplateId,
    savedTemplates,
    saveTemplate,
    updateTemplate,
    loadTemplatesFromStorage,
  } = useCardGeneratorStore()

  const [templateName, setTemplateName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  useEffect(() => {
    loadTemplatesFromStorage()
  }, [loadTemplatesFromStorage])

  useEffect(() => {
    if (selectedTemplateId && savedTemplates.length > 0) {
      const current = savedTemplates.find((t) => t.templateId === selectedTemplateId)
      if (current) {
        setTemplateName(current.templateName)
      }
    }
  }, [selectedTemplateId, savedTemplates])

  const handleSaveTemplate = async () => {
    setSaveError(null)
    setSaveSuccess(false)

    // Validate
    const validation = validateTemplate(templateName, selectedCardSize, canvasElements)
    if (!validation.valid) {
      setSaveError(validation.error || "Validation failed")
      return
    }

    setIsSaving(true)

    try {
      // Generate thumbnail
      const thumbnailDataUrl = await generateThumbnail(selectedCardSize!, canvasElements, backgroundImage || undefined)

      // Save template (will update if selectedTemplateId exists)
      await saveTemplate(templateName)

      // Update thumbnail in storage
      const templates = await import("@/lib/storage").then((m) => m.getAllTemplates())
      const savedTemplate = templates.find((t) => t.templateName === templateName)
      if (savedTemplate) {
        await import("@/lib/storage").then((m) =>
          m.saveTemplateToStorage({
            ...savedTemplate,
            thumbnailDataUrl,
          }),
        )
      }

      await loadTemplatesFromStorage()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save template")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTemplateName = async () => {
    if (!editingTemplateId || !editingName.trim()) return

    try {
      await updateTemplate(editingTemplateId, editingName)
      setEditingTemplateId(null)
      setEditingName("")
    } catch (error) {
      console.error("Failed to update template name:", error)
    }
  }

  const currentTemplate = selectedTemplateId ? savedTemplates.find((t) => t.templateId === selectedTemplateId) : null

  if (mode === "save") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            {selectedTemplateId ? "Update Template" : "Save New Template"}
          </CardTitle>
          <CardDescription>
            {selectedTemplateId
              ? "Update the current template with your changes"
              : "Save your design to reuse it later"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Student ID Card 2024"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value)
                setSaveError(null)
              }}
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Template saved successfully!
            </div>
          )}

          {currentTemplate && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-medium">Currently editing: {currentTemplate.templateName}</p>
              <p className="text-xs text-muted-foreground mt-1">Saving will update this template</p>
            </div>
          )}

          <Button onClick={handleSaveTemplate} disabled={isSaving || !templateName.trim()} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : selectedTemplateId ? "Update Template" : "Save Template"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
