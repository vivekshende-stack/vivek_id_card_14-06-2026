"use client"

import { useState } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Search, User, ImageIcon } from "lucide-react"
import { generatePlaceholderImage } from "@/lib/photo-utils"

export function PhotoPreviewScreen() {
  const { excelData, photoMatchResults } = useCardGeneratorStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "matched" | "missing">("all")

  const filteredData = excelData.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.photo_no?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "matched" && student.photoStatus === "matched") ||
      (filterStatus === "missing" && student.photoStatus === "missing")

    return matchesSearch && matchesFilter
  })

  const placeholder = generatePlaceholderImage(100, 120)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{photoMatchResults?.matchedCount || 0}</p>
                <p className="text-sm text-muted-foreground">Photos Matched</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <XCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{photoMatchResults?.missingCount || 0}</p>
                <p className="text-sm text-muted-foreground">Photos Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <ImageIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{photoMatchResults?.unmatchedPhotos.length || 0}</p>
                <p className="text-sm text-muted-foreground">Unmatched Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Student Preview</CardTitle>
          <CardDescription>Review student data and photo matching status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or photo number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({excelData.length})
              </Button>
              <Button
                variant={filterStatus === "matched" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("matched")}
              >
                Matched ({photoMatchResults?.matchedCount || 0})
              </Button>
              <Button
                variant={filterStatus === "missing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("missing")}
              >
                Missing ({photoMatchResults?.missingCount || 0})
              </Button>
            </div>
          </div>

          {/* Student List */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredData.map((student, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
                  {/* Photo Preview */}
                  <div className="relative">
                    <div className="w-20 h-24 rounded-md overflow-hidden border-2 border-border bg-muted">
                      <img
                        src={student.photoUrl || placeholder}
                        alt={student.name || "Student"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {student.photoStatus === "matched" ? (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-background">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{student.name || "No Name"}</h4>
                      <Badge variant={student.photoStatus === "matched" ? "default" : "secondary"}>
                        {student.photoStatus === "matched" ? "Photo OK" : "Photo Missing"}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>P: {student.photo_no || "N/A"}</span>
                      {student.class && <span>Class: {student.class}</span>}
                      {student.sec && <span>Sec: {student.sec}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No students found matching your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Unmatched Photos Section */}
      {photoMatchResults && photoMatchResults.unmatchedPhotos.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-600">Unmatched Photos</CardTitle>
            <CardDescription>These photos in the ZIP don't match any student Photo Number in the Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {photoMatchResults.unmatchedPhotos.map((photoNum, index) => (
                <Badge key={index} variant="destructive">
                  {photoNum}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
