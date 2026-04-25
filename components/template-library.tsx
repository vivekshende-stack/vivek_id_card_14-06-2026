"use client"

import { useEffect, useState } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trash2, CheckCircle2, Edit, Calendar } from "lucide-react"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { StoredTemplate } from "@/lib/types"

export function TemplateLibrary() {
  const { savedTemplates, selectedTemplateId, loadTemplate, deleteTemplate, loadTemplatesFromStorage, setCurrentStep } =
    useCardGeneratorStore()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplatesFromStorage()
  }, [loadTemplatesFromStorage])

  const handleSelectTemplate = (template: StoredTemplate) => {
    loadTemplate(template)
    setCurrentStep(2)
  }

  const handleDelete = async (templateId: string) => {
    await deleteTemplate(templateId)
    setDeleteConfirmId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Library</CardTitle>
        <CardDescription>Select a template to work with or create a new one from Step 2</CardDescription>
      </CardHeader>
      <CardContent>
        {savedTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">No templates yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first template in Step 2 and save it to get started
            </p>
            <Button onClick={() => setCurrentStep(2)}>Create Template</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedTemplates.map((template) => (
              <div
                key={template.templateId}
                className={`group relative border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                  selectedTemplateId === template.templateId
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-[2/3.2] bg-muted relative overflow-hidden">
                  {template.thumbnailDataUrl ? (
                    <img
                      src={template.thumbnailDataUrl || "/placeholder.svg"}
                      alt={template.templateName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {selectedTemplateId === template.templateId && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground line-clamp-1">{template.templateName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {template.cardSize.width} x {template.cardSize.height}" • {template.canvasElements.length}{" "}
                      elements
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTemplateId === template.templateId ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {selectedTemplateId === template.templateId ? "Selected" : "Select"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(template.templateId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template from your local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
