"use client"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { StepIndicator } from "@/components/step-indicator"
import { CardSizeStep } from "@/components/steps/card-size-step"
import { TemplateDesignStep } from "@/components/steps/template-design-step"
import { SaveTemplateStep } from "@/components/steps/save-template-step"
import { ExcelUploadStep } from "@/components/steps/excel-upload-step"
import { GenerateCardsStep } from "@/components/steps/generate-cards-step"
import { DownloadStep } from "@/components/steps/download-step"
import { CreditCard } from "lucide-react"
import { useEffect } from "react"

export default function HomePage() {
  const { currentStep, setCurrentStep, initializeApp } = useCardGeneratorStore()

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <CreditCard className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">ID Card Generator</h1>
              <p className="text-sm text-muted-foreground">Create bulk ID cards from Excel data</p>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {currentStep === 1 && <CardSizeStep />}
        {currentStep === 2 && <TemplateDesignStep />}
        {currentStep === 3 && <SaveTemplateStep />}
        {currentStep === 4 && <ExcelUploadStep />}
        {currentStep === 5 && <GenerateCardsStep />}
        {currentStep === 6 && <DownloadStep />}
      </main>
    </div>
  )
}
