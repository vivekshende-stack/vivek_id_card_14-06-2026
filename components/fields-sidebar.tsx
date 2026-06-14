"use client"

import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FIELD_LABELS, FIELD_PLACEHOLDERS, type FieldType } from "@/lib/types"
import { Plus, Type, ImageIcon, Square, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function FieldsSidebar() {
  const { addCanvasElement, selectedCardSize, customFields, addCustomField, removeCustomField } = useCardGeneratorStore()
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldKey, setNewFieldKey] = useState("")

  const generateKey = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
  }

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return

    const key = newFieldKey.trim() || generateKey(newFieldLabel)
    
    // Check for duplicate keys
    if (customFields.some(f => f.key === key)) {
      alert("A field with this key already exists")
      return
    }

    addCustomField({
      id: `custom-field-${Date.now()}`,
      label: newFieldLabel,
      key,
      createdAt: new Date(),
    })

    setNewFieldLabel("")
    setNewFieldKey("")
  }

  const addCustomFieldToCanvas = (fieldId: string, label: string, key: string) => {
    addCanvasElement({
      id: `field-${Date.now()}`,
      type: "field",
      x: 50,
      y: 50,
      width: 200,
      height: 30,
      rotation: 0,
      customFieldId: fieldId,
      customFieldKey: key,
      fieldPlaceholder: `{{${key}}}`,
      fontSize: 16,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Arial",
      textAlign: "left",
    })
  }

  const addField = (fieldType: FieldType) => {
    addCanvasElement({
      id: `field-${Date.now()}`,
      type: "field",
      x: 50,
      y: 50,
      width: 200,
      height: 30,
      rotation: 0,
      fieldType,
      fieldPlaceholder: FIELD_PLACEHOLDERS[fieldType],
      fontSize: 16,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Arial",
      textAlign: "left",
    })
  }

  const addPhotoBox = () => {
    addCanvasElement({
      id: `photo-box-${Date.now()}`,
      type: "photo_box",
      x: 50,
      y: 50,
      width: 150,
      height: 200,
      rotation: 0,
      fontColor: "#000000", // Used for placeholder border color
    })
  }

  const addText = () => {
    addCanvasElement({
      id: `text-${Date.now()}`,
      type: "text",
      x: 50,
      y: 50,
      width: 150,
      height: 30,
      rotation: 0,
      content: "Sample Text",
      fontSize: 16,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Arial",
      textAlign: "left",
    })
  }

  const addShape = () => {
    addCanvasElement({
      id: `shape-${Date.now()}`,
      type: "shape",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      fontColor: "#6366f1",
    })
  }

  const addImage = () => {
    addCanvasElement({
      id: `image-${Date.now()}`,
      type: "image",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      imageUrl: "/placeholder.svg?height=100&width=100",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Elements</CardTitle>
        <CardDescription className="text-xs">Drag or click to add to canvas</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Create Custom Field */}
            <div className="space-y-3 pb-4 border-b">
              <h4 className="text-sm font-medium text-foreground">Create Custom Field</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Field label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="text-xs h-8"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomField()}
                />
                <Input
                  placeholder="Variable key (auto-generated)"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="text-xs h-8"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomField()}
                />
                <Button
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={handleAddCustomField}
                  disabled={!newFieldLabel.trim()}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Create Field
                </Button>
              </div>
            </div>

            {/* Custom Fields List */}
            {customFields.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Your Custom Fields</h4>
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between gap-2 p-2 rounded border bg-secondary/50">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{field.label}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{`{{${field.key}}}`}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => addCustomFieldToCanvas(field.id, field.label, field.key)}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => removeCustomField(field.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Photo Container</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-auto py-3 bg-primary/5 border-primary/30"
                onClick={addPhotoBox}
              >
                <ImageIcon className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-primary">Photo Box</span>
                  <span className="text-[10px] text-muted-foreground">Student photo container</span>
                </div>
              </Button>
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Dynamic Fields</h4>
              <div className="grid gap-2">
                {(Object.keys(FIELD_LABELS) as FieldType[]).map((fieldType) => (
                  <Button
                    key={fieldType}
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs h-auto py-2 bg-transparent"
                    onClick={() => addField(fieldType)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{FIELD_LABELS[fieldType]}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {FIELD_PLACEHOLDERS[fieldType]}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Basic Elements */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Basic Elements</h4>
              <div className="grid gap-2">
                <Button variant="outline" size="sm" className="justify-start bg-transparent" onClick={addText}>
                  <Type className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-transparent" onClick={addImage}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-transparent" onClick={addShape}>
                  <Square className="h-4 w-4 mr-2" />
                  Shape
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
