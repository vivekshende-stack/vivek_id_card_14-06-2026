"use client"

import { useState } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, Loader2, FolderArchive, FileImage } from "lucide-react"
import JSZip from "jszip"
import saveAs from "file-saver"
import { GeneratedCardsLibrary } from "@/components/generated-cards-library"

export function DownloadStep() {
  const { setCurrentStep, generatedCards } = useCardGeneratorStore()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const handleDownloadAll = async () => {
    if (generatedCards.length === 0) return

    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      const zip = new JSZip()
      const folder = zip.folder("ID_CARDS")

      if (!folder) {
        throw new Error("Failed to create folder")
      }

      // Add each card to the ZIP
      for (let i = 0; i < generatedCards.length; i++) {
        const card = generatedCards[i]

        // Convert data URL to blob
        const response = await fetch(card.dataUrl)
        const blob = await response.blob()

        // Add to ZIP with student's photo number or index as filename
        const filename = `${card.id || `card-${i + 1}`}.png`
        folder.file(filename, blob)

        // Update progress
        setDownloadProgress(((i + 1) / generatedCards.length) * 100)
      }

      // Generate ZIP file
      const content = await zip.generateAsync({ type: "blob" })

      // Download
      saveAs(content, `ID_CARDS_${new Date().getTime()}.zip`)
    } catch (error) {
      console.error("Error creating ZIP file:", error)
      alert("Error creating ZIP file. Please try again.")
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const handleDownloadSingle = async (index: number) => {
    const card = generatedCards[index]
    if (!card) return

    const link = document.createElement("a")
    link.download = `${card.id || `card-${index + 1}`}.png`
    link.href = card.dataUrl
    link.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">Download ID Cards</h2>
          <p className="text-muted-foreground">Download all cards as a ZIP file or individual cards</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentStep(5)} disabled={isDownloading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Current Session Cards */}
      {generatedCards.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderArchive className="h-5 w-5 text-primary" />
                Current Session
              </CardTitle>
              <CardDescription>Download {generatedCards.length} newly generated ID cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isDownloading ? (
                <>
                  <div className="p-6 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <FolderArchive className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-medium text-foreground">ZIP Archive Ready</h4>
                        <p className="text-sm text-muted-foreground">
                          All ID cards will be packaged into a single ZIP file with each card named by its Photo No.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 px-2 py-1 bg-background rounded border border-border">
                            <FileImage className="h-3 w-3" />
                            {generatedCards.length} files
                          </div>
                          <div className="px-2 py-1 bg-background rounded border border-border">PNG format</div>
                          <div className="px-2 py-1 bg-background rounded border border-border">High quality</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadAll}
                    className="w-full"
                    size="lg"
                    disabled={generatedCards.length === 0}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download All as ZIP
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Creating ZIP file...</span>
                      <span className="font-medium text-foreground">{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} />
                  </div>
                  <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-border">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <p className="text-sm text-muted-foreground">Packaging files...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Individual Downloads</CardTitle>
              <CardDescription>Download specific ID cards one by one</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedCards.map((card, index) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden bg-white">
                    <div className="aspect-[2/3.2] relative">
                      <img
                        src={card.dataUrl || "/placeholder.svg"}
                        alt={`Card ${card.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-2 bg-card">
                      <p className="text-xs font-medium text-foreground truncate">{card.studentData.name || "N/A"}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {card.id}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 bg-transparent"
                        onClick={() => handleDownloadSingle(index)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <GeneratedCardsLibrary />
    </div>
  )
}
