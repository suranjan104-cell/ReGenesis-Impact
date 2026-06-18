// Export + color helpers shared by tables and charts.

/** Download helper for CSV exports. */
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const esc = (v: string | number | null) => {
    let s = v == null ? '' : String(v)
    // Neutralize formula injection: a cell starting with =, +, -, @ or a tab
    // is interpreted as a formula by Excel/Sheets when the CSV is opened.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map(r => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Serialize an inline SVG element to a PNG download. */
export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, scale = 2) {
  const xml = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  const vb = svg.viewBox.baseVal
  const w = (vb?.width || svg.clientWidth || 600) * scale
  const h = (vb?.height || svg.clientHeight || 300) * scale
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#020806'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
    canvas.toBlob(blob => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
  img.src = url
}

/** Score → traffic-light color used across heat maps, tables and charts. */
export function scoreColor(score: number | null): string {
  if (score == null) return 'rgba(240,237,232,.15)'
  if (score >= 70) return '#00e87a'
  if (score >= 40) return '#ffb547'
  return '#ff5a3c'
}
