"use client"

import type React from "react"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileImage } from "lucide-react"

export function TemplateUpload() {
  const { setBackgroundImage, backgroundImage } = useCardGeneratorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setBackgroundImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Upload ID Card Template</h3>
        <p className="text-sm text-muted-foreground">
          Upload an existing ID card design as a PNG or JPG. You can then overlay dynamic fields on top of it.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {!backgroundImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Click to upload template</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={backgroundImage || "/placeholder.svg"} alt="Template" className="w-full h-auto" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                  <FileImage className="h-4 w-4 mr-2" />
                  Change Template
                </Button>
                <Button onClick={() => setBackgroundImage(null)} variant="outline" className="flex-1">
                  Remove
                </Button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </CardContent>
      </Card>
    </div>
  )
}
