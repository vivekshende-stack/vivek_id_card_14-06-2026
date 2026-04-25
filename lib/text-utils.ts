/**
 * Text Auto-Fit Utilities
 * Provides Photoshop-like text box behavior for ID card generation
 */

/**
 * AUTO FIT TEXT - Single line, shrinks to fit box (like Photoshop)
 * Used for: Name field
 *
 * @param ctx Canvas rendering context
 * @param text Text to render
 * @param maxWidth Maximum width of the text box
 * @param fontFamily Font family
 * @param startFontSize Starting font size
 * @param fontWeight Font weight
 * @returns Final font size used
 */
export function autoFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontFamily: string,
  startFontSize: number,
  fontWeight: number,
): number {
  let fontSize = startFontSize

  // Start with the defined font size
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
  let textWidth = ctx.measureText(text).width

  // Reduce font size by 1pt until text fits
  while (textWidth > maxWidth && fontSize > 8) {
    fontSize -= 1
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
    textWidth = ctx.measureText(text).width
  }

  return fontSize
}

/**
 * MULTI-LINE TEXT WRAP - Automatic line breaking (like textarea)
 * Used for: Address field
 *
 * @param ctx Canvas rendering context
 * @param text Text to wrap
 * @param maxWidth Maximum width per line
 * @param fontSize Font size (fixed, no auto-shrink)
 * @param fontFamily Font family
 * @param fontWeight Font weight
 * @returns Array of text lines
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: number,
): string[] {
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`

  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine) {
      // Line is too wide, push current line and start new one
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  // Push the last line
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Render multi-line text starting from TOP of box
 *
 * @param ctx Canvas rendering context
 * @param lines Array of text lines
 * @param x X position
 * @param y Y position (top of box)
 * @param fontSize Font size
 * @param lineHeight Line height multiplier (default 1.2)
 */
export function renderMultiLineText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight = 1.2,
): void {
  const lineSpacing = fontSize * lineHeight

  lines.forEach((line, index) => {
    // Start from top (y), add line spacing for each subsequent line
    const lineY = y + index * lineSpacing + fontSize // +fontSize to account for baseline
    ctx.fillText(line, x, lineY)
  })
}
