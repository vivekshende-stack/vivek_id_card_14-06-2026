"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

const steps = [
  { number: 1, label: "Card Size" },
  { number: 2, label: "Design Template" },
  { number: 3, label: "Save Template" },
  { number: 4, label: "Upload Excel" },
  { number: 5, label: "Generate Cards" },
  { number: 6, label: "Download" },
]

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => onStepClick(step.number)}
                  className="group flex items-center w-full"
                  disabled={step.number > currentStep + 1}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all",
                        currentStep === step.number && "border-primary bg-primary text-primary-foreground",
                        currentStep > step.number && "border-primary bg-primary text-primary-foreground",
                        currentStep < step.number && "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors hidden md:block",
                        currentStep >= step.number ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 transition-colors",
                      currentStep > step.number ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
