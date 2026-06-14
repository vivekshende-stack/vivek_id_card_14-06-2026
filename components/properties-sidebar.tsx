"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { CanvasElement } from "@/lib/types"
import { Settings, Trash2 } from "lucide-react"
import { useRef } from "react"

interface PropertiesSidebarProps {
  selectedElement: CanvasElement | null
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void
  onDelete?: (id: string) => void
}

export function PropertiesSidebar({ selectedElement, onUpdate, onDelete }: PropertiesSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!selectedElement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Properties
          </CardTitle>
          <CardDescription className="text-xs">Select an element to edit its properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No element selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      onUpdate(selectedElement.id, { imageUrl: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Properties
        </CardTitle>
        <CardDescription className="text-xs capitalize">{selectedElement.type} Element</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="x" className="text-xs">
                  X
                </Label>
                <Input
                  id="x"
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => onUpdate(selectedElement.id, { x: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="y" className="text-xs">
                  Y
                </Label>
                <Input
                  id="y"
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => onUpdate(selectedElement.id, { y: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="width" className="text-xs">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={selectedElement.width}
                  onChange={(e) => onUpdate(selectedElement.id, { width: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="height" className="text-xs">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={selectedElement.height}
                  onChange={(e) => onUpdate(selectedElement.id, { height: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <Label htmlFor="rotation" className="text-xs">
              Rotation: {selectedElement.rotation}°
            </Label>
            <Slider
              id="rotation"
              min={0}
              max={360}
              step={1}
              value={[selectedElement.rotation]}
              onValueChange={(value) => onUpdate(selectedElement.id, { rotation: value[0] })}
            />
          </div>

          {/* Text/Field Properties */}
          {(selectedElement.type === "text" || selectedElement.type === "field") && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fontFamily" className="text-xs">
                  Font Family
                </Label>
                <select
                  id="fontFamily"
                  value={selectedElement.fontFamily || "Arial"}
                  onChange={(e) => onUpdate(selectedElement.id, { fontFamily: e.target.value })}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Tinos">Tinos</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Text Alignment</Label>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant={selectedElement.textAlign === "left" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdate(selectedElement.id, { textAlign: "left" })}
                  >
                    Left
                  </Button>
                  <Button
                    variant={selectedElement.textAlign === "center" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdate(selectedElement.id, { textAlign: "center" })}
                  >
                    Center
                  </Button>
                  <Button
                    variant={selectedElement.textAlign === "right" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdate(selectedElement.id, { textAlign: "right" })}
                  >
                    Right
                  </Button>
                </div>
              </div>

              {/* Text Offset Controls */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-sm font-medium">Text Offset (Fine-Tuning)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="offsetX" className="text-xs">
                      X Offset: {selectedElement.offsetX || 0}px
                    </Label>
                    <Slider
                      id="offsetX"
                      min={-50}
                      max={50}
                      step={1}
                      value={[selectedElement.offsetX || 0]}
                      onValueChange={(value) => onUpdate(selectedElement.id, { offsetX: value[0] })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="offsetY" className="text-xs">
                      Y Offset: {selectedElement.offsetY || 0}px
                    </Label>
                    <Slider
                      id="offsetY"
                      min={-50}
                      max={50}
                      step={1}
                      value={[selectedElement.offsetY || 0]}
                      onValueChange={(value) => onUpdate(selectedElement.id, { offsetY: value[0] })}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Use offsets to fine-tune text position within the element bounds
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-xs">
                  Font Size: {selectedElement.fontSize}px
                </Label>
                <Slider
                  id="fontSize"
                  min={8}
                  max={72}
                  step={1}
                  value={[selectedElement.fontSize || 16]}
                  onValueChange={(value) => onUpdate(selectedElement.id, { fontSize: value[0] })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fontWeight" className="text-xs">
                  Font Weight: {selectedElement.fontWeight}
                </Label>
                <Slider
                  id="fontWeight"
                  min={100}
                  max={900}
                  step={100}
                  value={[selectedElement.fontWeight || 400]}
                  onValueChange={(value) => onUpdate(selectedElement.id, { fontWeight: value[0] })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fontColor" className="text-xs">
                  Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="fontColor"
                    type="color"
                    value={selectedElement.fontColor || "#000000"}
                    onChange={(e) => onUpdate(selectedElement.id, { fontColor: e.target.value })}
                    className="h-8 w-16"
                  />
                  <Input
                    type="text"
                    value={selectedElement.fontColor || "#000000"}
                    onChange={(e) => onUpdate(selectedElement.id, { fontColor: e.target.value })}
                    className="h-8 flex-1 text-xs font-mono"
                  />
                </div>
              </div>

              {selectedElement.type === "text" && (
                <div className="space-y-1.5">
                  <Label htmlFor="content" className="text-xs">
                    Text Content
                  </Label>
                  <Input
                    id="content"
                    value={selectedElement.content || ""}
                    onChange={(e) => onUpdate(selectedElement.id, { content: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {selectedElement.type === "field" && selectedElement.customFieldId && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                  <p className="text-blue-700 font-medium">Custom Field Detected</p>
                  <p className="text-blue-600 text-[10px] mt-1">This element is linked to a custom field.</p>
                </div>
              )}
            </>
          )}

          {/* Shape Properties */}
          {selectedElement.type === "shape" && (
            <div className="space-y-1.5">
              <Label htmlFor="shapeColor" className="text-xs">
                Fill Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="shapeColor"
                  type="color"
                  value={selectedElement.fontColor || "#000000"}
                  onChange={(e) => onUpdate(selectedElement.id, { fontColor: e.target.value })}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={selectedElement.fontColor || "#000000"}
                  onChange={(e) => onUpdate(selectedElement.id, { fontColor: e.target.value })}
                  className="h-8 flex-1 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Image Properties */}
          {selectedElement.type === "image" && (
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full">
                Upload Image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          )}

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (onDelete) {
                onDelete(selectedElement.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Element
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
