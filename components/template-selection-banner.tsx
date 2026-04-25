"use client"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, FileText } from "lucide-react"

export function TemplateSelectionBanner() {
  const { selectedTemplateId, savedTemplates, setCurrentStep } = useCardGeneratorStore()

  const selectedTemplate = selectedTemplateId ? savedTemplates.find((t) => t.templateId === selectedTemplateId) : null

  if (selectedTemplate) {
    return (
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">Active Template: {selectedTemplate.templateName}</p>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.cardSize.width} x {selectedTemplate.cardSize.height}" •{" "}
                {selectedTemplate.canvasElements.length} elements
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
            <FileText className="h-4 w-4 mr-2" />
            Change Template
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-destructive/10 border-destructive/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-destructive">No Template Selected</p>
            <p className="text-sm text-muted-foreground">You must select a template before generating ID cards</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
          <FileText className="h-4 w-4 mr-2" />
          Select Template
        </Button>
      </div>
    </Card>
  )
}
