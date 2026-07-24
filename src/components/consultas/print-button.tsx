"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer shadow-xs screen-only"
    >
      <Printer className="h-4 w-4" />
      Imprimir / PDF
    </button>
  )
}
