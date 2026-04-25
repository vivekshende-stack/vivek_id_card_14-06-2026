"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useCardGeneratorStore } from "@/lib/card-generator-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, FileArchive, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import type { FieldType, StudentData, ExcelColumn } from "@/lib/types"
import { FIELD_LABELS } from "@/lib/types"
import { TemplateSelectionBanner } from "@/components/template-selection-banner"
import { normalizeDOB } from "@/lib/date-utils"
import { matchPhotosWithStudents } from "@/lib/photo-utils"

export function ExcelUploadStep() {
  const {
    setCurrentStep,
    setExcelData,
    excelData,
    columnMappings,
    setColumnMappings,
    selectedTemplateId,
    photoZipFile,
    setPhotoZipFile,
    photoMatchResults,
    setPhotoMatchResults,
  } = useCardGeneratorStore()
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [zipFileName, setZipFileName] = useState<string>("")
  const [isMatchingPhotos, setIsMatchingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        if (jsonData.length > 0) {
          const headers = jsonData[0]
          setExcelHeaders(headers)

          // Auto-map columns
          const mappings: ExcelColumn[] = headers.map((header) => {
            const normalizedHeader = header.toLowerCase().replace(/\s+/g, "_")
            let fieldType: FieldType | null = null

            // Auto-mapping logic
            if (normalizedHeader.includes("name") && !normalizedHeader.includes("mother")) {
              fieldType = "name"
            } else if (normalizedHeader.includes("class")) {
              fieldType = "class"
            } else if (normalizedHeader.includes("sec")) {
              fieldType = "sec"
            } else if (normalizedHeader.includes("dob") || normalizedHeader.includes("birth")) {
              fieldType = "dob"
            } else if (normalizedHeader.includes("mobile") || normalizedHeader.includes("phone")) {
              fieldType = "mobile"
            } else if (normalizedHeader.includes("address")) {
              fieldType = "address"
            } else if (normalizedHeader.includes("mother")) {
              fieldType = "mother_name"
            } else if (normalizedHeader.includes("aadhaar") || normalizedHeader.includes("aadhar")) {
              fieldType = "aadhaar_no"
            } else if (normalizedHeader.includes("photo") && !normalizedHeader.includes("no")) {
              fieldType = "photo"
            } else if (
              header === "P" ||
              header.toLowerCase() === "p" ||
              (normalizedHeader.includes("photo") && normalizedHeader.includes("no"))
            ) {
              fieldType = "photo_no"
            }

            return { excelHeader: header, fieldType }
          })

          setColumnMappings(mappings)

          // Parse data rows
          const studentData: StudentData[] = jsonData.slice(1).map((row) => {
            const student: any = {}
            headers.forEach((header, index) => {
              const mapping = mappings.find((m) => m.excelHeader === header)
              const cellValue = row[index]

              if (header === "P" || header.toLowerCase() === "p") {
                student.photoNumber = cellValue?.toString() || ""
                student.photo_no = cellValue?.toString() || ""
              }

              if (mapping?.fieldType) {
                if (mapping.fieldType === "dob") {
                  student[mapping.fieldType] = normalizeDOB(cellValue)
                } else {
                  student[mapping.fieldType] = cellValue?.toString() || ""
                }
              }
            })
            return student as StudentData
          })

          setExcelData(studentData)

          if (photoZipFile) {
            performPhotoMatching(studentData, photoZipFile)
          }
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        alert("Error parsing Excel file. Please check the file format.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setZipFileName(file.name)
    setPhotoZipFile(file)

    // If Excel data already loaded, trigger photo matching
    if (excelData.length > 0) {
      performPhotoMatching(excelData, file)
    }
  }

  const performPhotoMatching = async (students: StudentData[], zipFile: File) => {
    setIsMatchingPhotos(true)
    try {
      const results = await matchPhotosWithStudents(zipFile, students)
      setPhotoMatchResults(results)
      setExcelData(results.studentData)
    } catch (error) {
      console.error("Error matching photos:", error)
      alert("Error processing photo ZIP file. Please check the file format.")
    } finally {
      setIsMatchingPhotos(false)
    }
  }

  const updateMapping = (excelHeader: string, fieldType: FieldType | null) => {
    const updatedMappings = columnMappings.map((mapping) =>
      mapping.excelHeader === excelHeader ? { ...mapping, fieldType } : mapping,
    )
    setColumnMappings(updatedMappings)
  }

  const canProceed = excelData.length > 0 && selectedTemplateId !== null && photoZipFile !== null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">Upload Excel Data & Photos</h2>
          <p className="text-muted-foreground">Upload your Excel file and photo ZIP for ID card generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setCurrentStep(5)} disabled={!canProceed}>
            {photoMatchResults ? "Preview & Generate" : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <TemplateSelectionBanner />

      {/* Excel Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Excel File
          </CardTitle>
          <CardDescription>Select an .xlsx file containing student data</CardDescription>
        </CardHeader>
        <CardContent>
          {!fileName ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Click to upload Excel file</p>
                <p className="text-xs text-muted-foreground">.xlsx format, up to 10MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {excelData.length} records • {excelHeaders.length} columns
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Change File
                </Button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      {/* Photo ZIP Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-primary" />
            Upload Photo ZIP
          </CardTitle>
          <CardDescription>Select a ZIP file containing student photos (named by Photo Number)</CardDescription>
        </CardHeader>
        <CardContent>
          {!zipFileName ? (
            <button
              onClick={() => zipInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileArchive className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Click to upload photo ZIP</p>
                <p className="text-xs text-muted-foreground">.zip format, photos named as 918.jpg, 0198.jpeg, etc.</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{zipFileName}</p>
                    {photoMatchResults && (
                      <p className="text-sm text-muted-foreground">
                        {photoMatchResults.matchedCount} matched • {photoMatchResults.missingCount} missing
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => zipInputRef.current?.click()}>
                  Change File
                </Button>
              </div>

              {/* Matching Progress */}
              {isMatchingPhotos && (
                <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <p className="text-sm text-muted-foreground">Matching photos with student data...</p>
                </div>
              )}

              {/* Match Summary */}
              {photoMatchResults && !isMatchingPhotos && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{photoMatchResults.matchedCount}</p>
                      <p className="text-xs text-muted-foreground">Photos Matched</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">{photoMatchResults.missingCount}</p>
                      <p className="text-xs text-muted-foreground">Photos Missing</p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{photoMatchResults.unmatchedPhotos.length}</p>
                      <p className="text-xs text-muted-foreground">Unmatched Photos</p>
                    </div>
                  </div>

                  {photoMatchResults.unmatchedPhotos.length > 0 && (
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">Unmatched Photo Numbers:</p>
                      <p className="text-xs text-muted-foreground">
                        {photoMatchResults.unmatchedPhotos.slice(0, 10).join(", ")}
                        {photoMatchResults.unmatchedPhotos.length > 10 &&
                          ` +${photoMatchResults.unmatchedPhotos.length - 10} more`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={handleZipUpload} />
        </CardContent>
      </Card>

      {excelHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>Map Excel columns to ID card fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-foreground">{mapping.excelHeader}</Label>
                    <p className="text-xs text-muted-foreground mt-1">Excel column name</p>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={mapping.fieldType || "none"}
                      onValueChange={(value) =>
                        updateMapping(mapping.excelHeader, value === "none" ? null : (value as FieldType))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Mapped</SelectItem>
                        {(Object.keys(FIELD_LABELS) as FieldType[]).map((fieldType) => (
                          <SelectItem key={fieldType} value={fieldType}>
                            {FIELD_LABELS[fieldType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {excelData.length > 0 && photoMatchResults && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  Ready to generate {excelData.length} ID cards with {photoMatchResults.matchedCount} matched photos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
