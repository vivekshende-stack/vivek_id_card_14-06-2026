"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Trash2, Calendar, FileImage, Folder, CheckSquare, XSquare } from "lucide-react"
import {
  getAllBatches,
  getCardsByBatchId,
  deleteMultipleCardsFromStorage,
  deleteBatchFromStorage,
  type StoredBatch,
  type StoredGeneratedCard,
} from "@/lib/storage"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function GeneratedCardsLibrary() {
  const [batches, setBatches] = useState<StoredBatch[]>([])
  const [batchCards, setBatchCards] = useState<Record<string, StoredGeneratedCard[]>>({})
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [deleteConfirmBatchId, setDeleteConfirmBatchId] = useState<string | null>(null)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    const allBatches = await getAllBatches()
    setBatches(allBatches)
  }

  const loadBatchCards = async (batchId: string) => {
    if (batchCards[batchId]) return // Already loaded

    const cards = await getCardsByBatchId(batchId)
    setBatchCards((prev) => ({ ...prev, [batchId]: cards }))
  }

  const handleDownloadSingle = (card: StoredGeneratedCard) => {
    const link = document.createElement("a")
    link.download = `${card.generatedCardId}.png`
    link.href = card.imageDataUrl
    link.click()
  }

  const handleDownloadSelected = async () => {
    if (selectedCards.size === 0) return

    const { default: JSZip } = await import("jszip")
    const { default: saveAs } = await import("file-saver")

    const zip = new JSZip()

    // Get all cards from all batches
    const allCards = Object.values(batchCards).flat()

    for (const cardId of selectedCards) {
      const card = allCards.find((c) => c.generatedCardId === cardId)
      if (!card) continue

      const response = await fetch(card.imageDataUrl)
      const blob = await response.blob()
      zip.file(`${card.generatedCardId}.png`, blob)
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `SELECTED_CARDS_${format(new Date(), "yyyy_MM_dd_HHmmss")}.zip`)
    setSelectedCards(new Set())
  }

  const handleDownloadBatch = async (batchId: string) => {
    const cards = batchCards[batchId]
    if (!cards || cards.length === 0) return

    const { default: JSZip } = await import("jszip")
    const { default: saveAs } = await import("file-saver")

    const zip = new JSZip()

    for (const card of cards) {
      const response = await fetch(card.imageDataUrl)
      const blob = await response.blob()
      zip.file(`${card.generatedCardId}.png`, blob)
    }

    const batch = batches.find((b) => b.batchId === batchId)
    const batchName = batch?.batchName || batchId

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `${batchName}.zip`)
  }

  const handleDeleteSelected = async () => {
    if (selectedCards.size === 0) return

    await deleteMultipleCardsFromStorage(Array.from(selectedCards))
    setSelectedCards(new Set())
    // Reload batches and cards
    await loadBatches()
    const reloadPromises = Object.keys(batchCards).map(async (batchId) => {
      const cards = await getCardsByBatchId(batchId)
      return { batchId, cards }
    })
    const results = await Promise.all(reloadPromises)
    const newBatchCards: Record<string, StoredGeneratedCard[]> = {}
    results.forEach(({ batchId, cards }) => {
      newBatchCards[batchId] = cards
    })
    setBatchCards(newBatchCards)
  }

  const handleDeleteBatch = async (batchId: string) => {
    const cards = batchCards[batchId]
    if (cards && cards.length > 0) {
      await deleteMultipleCardsFromStorage(cards.map((c) => c.generatedCardId))
    }
    await deleteBatchFromStorage(batchId)
    await loadBatches()
    setBatchCards((prev) => {
      const newBatchCards = { ...prev }
      delete newBatchCards[batchId]
      return newBatchCards
    })
    setDeleteConfirmBatchId(null)
  }

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards)
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId)
    } else {
      newSelection.add(cardId)
    }
    setSelectedCards(newSelection)
  }

  const selectAllInBatch = (batchId: string) => {
    const cards = batchCards[batchId] || []
    const newSelection = new Set(selectedCards)
    cards.forEach((card) => newSelection.add(card.generatedCardId))
    setSelectedCards(newSelection)
  }

  const deselectAllInBatch = (batchId: string) => {
    const cards = batchCards[batchId] || []
    const newSelection = new Set(selectedCards)
    cards.forEach((card) => newSelection.delete(card.generatedCardId))
    setSelectedCards(newSelection)
  }

  const handleAccordionChange = (batchId: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null)
    } else {
      setExpandedBatch(batchId)
      loadBatchCards(batchId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generated Cards Library</CardTitle>
            <CardDescription>Organized by generation batch, sorted by photo number</CardDescription>
          </div>
          {selectedCards.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedCards.size})
              </Button>
              <Button onClick={handleDownloadSelected}>
                <Download className="h-4 w-4 mr-2" />
                Download ({selectedCards.size})
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted mb-4">
              <FileImage className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">No Generated Batches</p>
            <p className="text-sm text-muted-foreground">Generated cards will be organized into batches here</p>
          </div>
        ) : (
          <Accordion type="single" collapsible value={expandedBatch || undefined} className="space-y-4">
            {batches.map((batch) => {
              const cards = batchCards[batch.batchId] || []
              const selectedInBatch = cards.filter((c) => selectedCards.has(c.generatedCardId)).length
              const allSelectedInBatch = cards.length > 0 && selectedInBatch === cards.length

              return (
                <AccordionItem
                  key={batch.batchId}
                  value={batch.batchId}
                  className="border border-border rounded-lg bg-card"
                >
                  <AccordionTrigger
                    className="px-4 hover:no-underline"
                    onClick={() => handleAccordionChange(batch.batchId)}
                  >
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <h3 className="font-semibold text-foreground">{batch.batchName}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(batch.createdAt), "MMM d, yyyy HH:mm")}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {batch.cardCount} cards
                            </Badge>
                            {batch.photoMatchStats && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 border-green-500/20"
                                >
                                  {batch.photoMatchStats.matched} matched
                                </Badge>
                                {batch.photoMatchStats.missing > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                  >
                                    {batch.photoMatchStats.missing} missing
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedInBatch > 0 && (
                        <Badge variant="default" className="mr-2">
                          {selectedInBatch} selected
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {cards.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Loading cards...</p>
                    ) : (
                      <div className="space-y-3">
                        {/* Batch Actions */}
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <div className="flex gap-2">
                            {allSelectedInBatch ? (
                              <Button variant="outline" size="sm" onClick={() => deselectAllInBatch(batch.batchId)}>
                                <XSquare className="h-4 w-4 mr-2" />
                                Deselect All
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => selectAllInBatch(batch.batchId)}>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Select All
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleDownloadBatch(batch.batchId)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Batch
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmBatchId(batch.batchId)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Batch
                            </Button>
                          </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {cards.map((card) => {
                            const isSelected = selectedCards.has(card.generatedCardId)

                            return (
                              <div
                                key={card.generatedCardId}
                                className={`group relative border rounded-lg overflow-hidden transition-all cursor-pointer ${
                                  isSelected
                                    ? "ring-2 ring-primary border-primary"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => toggleCardSelection(card.generatedCardId)}
                              >
                                <div className="aspect-[2/3.2] relative">
                                  <img
                                    src={card.imageDataUrl || "/placeholder.svg"}
                                    alt={card.studentData?.name || "Card"}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleCardSelection(card.generatedCardId)}
                                      className="bg-white"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  {isSelected && <div className="absolute inset-0 bg-primary/20" />}
                                </div>

                                <div className="p-2 space-y-1 bg-card">
                                  <p className="text-[10px] font-medium text-foreground truncate">
                                    {card.studentData?.name || "Unknown"}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground truncate">{card.generatedCardId}</p>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-6 text-[10px] bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadSingle(card)
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>

      <AlertDialog open={deleteConfirmBatchId !== null} onOpenChange={() => setDeleteConfirmBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all cards in this batch from your local
              storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmBatchId && handleDeleteBatch(deleteConfirmBatchId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
