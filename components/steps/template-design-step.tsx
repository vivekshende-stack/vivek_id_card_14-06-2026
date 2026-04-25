"use client"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { CanvasDesigner } from "@/components/canvas-designer"
import { TemplateUpload } from "@/components/template-upload"

export function TemplateDesignStep() {
  const { setCurrentStep, canvasElements } = useCardGeneratorStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">Design Your ID Card</h2>
          <p className="text-muted-foreground">Create a custom design or upload an existing template</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setCurrentStep(3)}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Designer</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="designer">Canvas Designer</TabsTrigger>
              <TabsTrigger value="upload">Upload Template</TabsTrigger>
            </TabsList>
            <TabsContent value="designer" className="mt-6">
              <CanvasDesigner />
            </TabsContent>
            <TabsContent value="upload" className="mt-6">
              <TemplateUpload />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
