import JSZip from "jszip"
import type { StudentData } from "./types"

export interface PhotoMatchResult {
  studentData: StudentData[]
  matchedCount: number
  missingCount: number
  unmatchedPhotos: string[]
  photoMap: Map<string, string>
}

/**
 * Extract numeric part from photo filename
 * Examples:
 *   DSC_0716.jpg -> 716
 *   DSC_716.jpg -> 716
 *   0716.jpg -> 716
 *   716.jpg -> 716
 */
function extractPhotoNumber(filename: string): string {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png)$/i, "")

  // Extract all digits from the filename (ignoring any prefix like DSC_)
  const digits = nameWithoutExt.match(/\d+/)

  if (!digits) return ""

  // Convert to number to remove leading zeros, then back to string
  return String(Number(digits[0]))
}

/**
 * Extract photos from ZIP file and match with student data
 */
export async function matchPhotosWithStudents(zipFile: File, students: StudentData[]): Promise<PhotoMatchResult> {
  const zip = new JSZip()
  const zipContent = await zip.loadAsync(zipFile)

  // Extract all photo files from ZIP
  const photoMap = new Map<string, { dataUrl: string; originalFilename: string }>()
  const photoPromises: Promise<void>[] = []

  zipContent.forEach((relativePath, file) => {
    // Skip directories and non-image files
    if (file.dir) return

    const fileName = relativePath.split("/").pop() || ""
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (!extension || !["jpg", "jpeg", "png"].includes(extension)) return

    const normalizedNumber = extractPhotoNumber(fileName)

    if (!normalizedNumber) return

    const promise = file.async("base64").then((base64) => {
      const mimeType = extension === "png" ? "image/png" : "image/jpeg"
      const dataUrl = `data:${mimeType};base64,${base64}`
      photoMap.set(normalizedNumber, { dataUrl, originalFilename: fileName })
    })

    photoPromises.push(promise)
  })

  // Wait for all photos to be extracted
  await Promise.all(photoPromises)

  // Match photos with students
  const updatedStudents: StudentData[] = students.map((student) => {
    const rawPhotoNumber = student.photo_no || student.photoNumber || ""
    const normalizedPhotoNumber = String(Number(rawPhotoNumber))
    const photoData = photoMap.get(normalizedPhotoNumber)

    return {
      ...student,
      photoUrl: photoData?.dataUrl || undefined,
      photoStatus: photoData ? "matched" : "missing",
    }
  })

  // Find unmatched photos
  const studentPhotoNumbers = new Set(
    students
      .map((s) => {
        const raw = s.photo_no || s.photoNumber || ""
        return raw ? String(Number(raw)) : ""
      })
      .filter(Boolean),
  )
  const unmatchedPhotos = Array.from(photoMap.keys()).filter(
    (normalizedNumber) => !studentPhotoNumbers.has(normalizedNumber),
  )

  const matchedCount = updatedStudents.filter((s) => s.photoStatus === "matched").length
  const missingCount = updatedStudents.filter((s) => s.photoStatus === "missing").length

  return {
    studentData: updatedStudents,
    matchedCount,
    missingCount,
    unmatchedPhotos,
    photoMap: new Map(Array.from(photoMap.entries()).map(([key, value]) => [key, value.dataUrl])),
  }
}

/**
 * Generate placeholder image for missing photos
 */
export function generatePlaceholderImage(width: number, height: number): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // Gray background
    ctx.fillStyle = "#e5e7eb"
    ctx.fillRect(0, 0, width, height)

    // "No Photo" text
    ctx.fillStyle = "#6b7280"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("NO PHOTO", width / 2, height / 2)
  }

  return canvas.toDataURL("image/png")
}
