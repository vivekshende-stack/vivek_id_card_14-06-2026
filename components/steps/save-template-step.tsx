"use client"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { TemplateManager } from "@/components/template-manager"
import { TemplateLibrary } from "@/components/template-library"

export function SaveTemplateStep() {
  const { setCurrentStep } = useCardGeneratorStore()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">Save & Manage Templates</h2>
          <p className="text-muted-foreground">Save your design or load an existing template</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Design
          </Button>
          <Button onClick={() => setCurrentStep(4)}>
            Continue to Upload
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Save Template */}
        <div className="lg:col-span-1">
          <TemplateManager mode="save" />
        </div>

        {/* Right: Template Library */}
        <div className="lg:col-span-2">
          <TemplateLibrary />
        </div>
      </div>
    </div>
  )
}
