"use client"

import { useCardGeneratorStore, PRESET_SIZES } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Ruler } from "lucide-react"
import { useState } from "react"

export function CardSizeStep() {
  const { selectedCardSize, setSelectedCardSize, setCurrentStep } = useCardGeneratorStore()
  const [customWidth, setCustomWidth] = useState(2)
  const [customHeight, setCustomHeight] = useState(3)
  const [customDpi, setCustomDpi] = useState(300)

  const handleSizeChange = (sizeId: string) => {
    const size = PRESET_SIZES.find((s) => s.id === sizeId)
    if (size) {
      if (size.id === "custom") {
        setSelectedCardSize({
          ...size,
          width: customWidth,
          height: customHeight,
          dpi: customDpi,
        })
      } else {
        setSelectedCardSize(size)
      }
    }
  }

  const handleNext = () => {
    if (selectedCardSize?.id === "custom") {
      setSelectedCardSize({
        ...selectedCardSize,
        width: customWidth,
        height: customHeight,
        dpi: customDpi,
      })
    }
    setCurrentStep(2)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">Select ID Card Size</h2>
        <p className="text-muted-foreground">Choose a preset size or create a custom dimension for your ID cards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Card Dimensions
          </CardTitle>
          <CardDescription>Select the physical size and resolution for your ID cards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="card-size">Preset Sizes</Label>
            <Select value={selectedCardSize?.id} onValueChange={handleSizeChange}>
              <SelectTrigger id="card-size">
                <SelectValue placeholder="Select a card size" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_SIZES.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCardSize?.id === "custom" && (
            <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
              <h4 className="font-medium text-sm text-foreground">Custom Dimensions</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dpi">DPI</Label>
                  <Input
                    id="dpi"
                    type="number"
                    step="50"
                    min="72"
                    value={customDpi}
                    onChange={(e) => setCustomDpi(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedCardSize && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Preview Dimensions</p>
                <p className="text-2xl font-semibold text-primary">
                  {selectedCardSize.id === "custom" ? customWidth : selectedCardSize.width} x{" "}
                  {selectedCardSize.id === "custom" ? customHeight : selectedCardSize.height} inches
                </p>
                <p className="text-sm text-muted-foreground">
                  Resolution: {selectedCardSize.id === "custom" ? customDpi : selectedCardSize.dpi} DPI (
                  {Math.round(
                    (selectedCardSize.id === "custom" ? customWidth : selectedCardSize.width) *
                      (selectedCardSize.id === "custom" ? customDpi : selectedCardSize.dpi),
                  )}{" "}
                  x{" "}
                  {Math.round(
                    (selectedCardSize.id === "custom" ? customHeight : selectedCardSize.height) *
                      (selectedCardSize.id === "custom" ? customDpi : selectedCardSize.dpi),
                  )}{" "}
                  pixels)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!selectedCardSize} size="lg">
          Continue to Design
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
