"use client"

import { useState, useRef } from "react"
import { FileUp, X, Check, Loader2, Plus, Trash2, AlertCircle, Hash } from "lucide-react"
import { saveLabsFromPdf } from "@/app/actions/lab-upload"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"
import { toast } from "sonner"

type ExtractedLab = {
  parameter: string
  value: string
  textValue: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
}

export function LabPdfUpload({ patientId }: { patientId: string }) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [extractedDate, setExtractedDate] = useState("")
  const [requestNumber, setRequestNumber] = useState("")
  const [labs, setLabs] = useState<ExtractedLab[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)

    try {
      // 1. Extract text from PDF using pdfjs-dist
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const items = textContent.items as any[]

        // Group items by line (y coordinate) to preserve table structure
        const lineMap: { y: number; text: string }[] = []
        for (const item of items) {
          if (!item.str || !item.str.trim()) continue
          const y = item.transform ? item.transform[5] : 0
          const existingLine = lineMap.find((l) => Math.abs(l.y - y) <= 4)
          if (existingLine) {
            existingLine.text += " " + item.str.trim()
          } else {
            lineMap.push({ y, text: item.str.trim() })
          }
        }
        // Sort lines top-to-bottom (higher y comes first in PDF coordinates)
        lineMap.sort((a, b) => b.y - a.y)
        const pageText = lineMap.map((l) => l.text).join("\n")
        fullText += pageText + "\n"
      }

      if (!fullText.trim()) {
        toast.error("No se pudo extraer texto del PDF. El archivo puede ser una imagen escaneada.")
        return
      }

      // 2. Send to AI endpoint for extraction
      const res = await fetch("/api/ai/extract-labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      })

      if (!res.ok) throw new Error("Error en la extracción con IA")

      const data = await res.json()

      // 3. Set request number
      setRequestNumber(data.requestNumber || "")

      // 4. Set extracted date
      if (data.date) {
        const d = new Date(data.date)
        if (!isNaN(d.getTime())) {
          setExtractedDate(d.toISOString().slice(0, 16))
        } else {
          setExtractedDate(new Date().toISOString().slice(0, 16))
        }
      } else {
        setExtractedDate(new Date().toISOString().slice(0, 16))
      }

      // 5. Set extracted labs (qualitative and quantitative)
      if (data.labs && Array.isArray(data.labs) && data.labs.length > 0) {
        setLabs(
          data.labs.map((l: any) => {
            const numValStr = l.value !== undefined && l.value !== null ? String(l.value) : ""
            let txtValStr = String(l.textValue || numValStr || "").trim()
            let cleanUnit = String(l.unit || "").trim()

            // Extra sanity check: If textValue contains the unit at the end, strip it
            if (cleanUnit && txtValStr.toLowerCase().endsWith(cleanUnit.toLowerCase())) {
              txtValStr = txtValStr.slice(0, -cleanUnit.length).trim()
            }

            return {
              parameter: l.parameter || "",
              value: numValStr,
              textValue: txtValStr,
              unit: cleanUnit,
              referenceRange: l.referenceRange || "",
              isAbnormal: false,
            }
          })
        )
      } else {
        setLabs([])
        toast.warning("No se detectaron valores de laboratorio en el PDF.")
      }

      setShowModal(true)
    } catch (err) {
      console.error("Error procesando PDF:", err)
      toast.error("No se pudo procesar el PDF. Verifica que el archivo sea válido y que el servidor de IA esté disponible.")
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const updateLab = (index: number, field: keyof ExtractedLab, val: string | boolean) => {
    setLabs((prev) =>
      prev.map((lab, i) => {
        if (i !== index) return lab
        const updated = { ...lab, [field]: val }
        // Keep value and textValue in sync when user edits textValue if numeric
        if (field === "textValue" && typeof val === "string") {
          const trimmed = val.trim()
          if (!isNaN(Number(trimmed)) && trimmed !== "") {
            updated.value = trimmed
          } else {
            updated.value = ""
          }
        }
        return updated
      })
    )
  }

  const removeLab = (index: number) => {
    setLabs((prev) => prev.filter((_, i) => i !== index))
  }

  const addLab = () => {
    setLabs((prev) => [
      ...prev,
      { parameter: "", value: "", textValue: "", unit: "", referenceRange: "", isAbnormal: false },
    ])
  }

  const handleConfirm = async () => {
    const validLabs = labs.filter((l) => l.parameter.trim() && (l.textValue.trim() || l.value.trim()))

    if (validLabs.length === 0) {
      toast.error("No hay laboratorios válidos para guardar. Cada parámetro requiere un nombre y un resultado.")
      return
    }

    if (!extractedDate) {
      toast.error("Se requiere una fecha para los laboratorios.")
      return
    }

    setIsSaving(true)
    try {
      const result = await saveLabsFromPdf({
        patientId,
        requestNumber: requestNumber.trim() || null,
        date: new Date(extractedDate).toISOString(),
        labs: validLabs.map((l) => ({
          parameter: l.parameter,
          value: l.value !== "" && !isNaN(Number(l.value)) ? Number(l.value) : null,
          textValue: l.textValue.trim() || l.value.trim(),
          unit: l.unit,
          referenceRange: l.referenceRange,
          isAbnormal: l.isAbnormal,
        })),
      })

      if (result.addedCount > 0) {
        let msg = `Se guardaron ${result.addedCount} laboratorio${result.addedCount > 1 ? "s" : ""}.`
        if (result.skippedCount > 0) {
          msg += ` (${result.skippedCount} parámetro${result.skippedCount > 1 ? "s" : ""} ya existían para este No. de Petición/fecha y se omitieron)`
        }
        toast.success(msg)
      } else if (result.skippedCount > 0) {
        toast.info(`Todos los laboratorios (${result.skippedCount}) ya se encontraban registrados previamente para esta petición.`)
      }

      setShowModal(false)
      setLabs([])
      setExtractedDate("")
      setRequestNumber("")
    } catch (err) {
      console.error("Error guardando labs:", err)
      toast.error("Error al guardar los laboratorios. Intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setLabs([])
    setExtractedDate("")
    setRequestNumber("")
  }

  return (
    <>
      {/* Upload Button */}
      <label
        className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
          isExtracting
            ? "bg-slate-100 text-slate-400 cursor-wait"
            : "bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700"
        }`}
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Procesando…
          </>
        ) : (
          <>
            <FileUp className="h-3 w-3" />
            Importar PDF
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          disabled={isExtracting}
          className="hidden"
        />
      </label>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-cyan-600" />
                  Previsualización de Laboratorios
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Revisa y edita los valores extraídos. Se desduplicarán si la petición ya fue registrada.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Metadata Fields: Request Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                  <label className="text-xs font-semibold text-slate-700 shrink-0">
                    No. Petición / Folio:
                  </label>
                  <input
                    type="text"
                    value={requestNumber}
                    onChange={(e) => setRequestNumber(e.target.value)}
                    placeholder="Ej. PET-2025-0012"
                    className="w-full border border-slate-200 rounded-md px-2.5 py-1 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 shrink-0">
                    Fecha reporte:
                  </label>
                  <input
                    type="datetime-local"
                    value={extractedDate}
                    onChange={(e) => setExtractedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Labs Table */}
              {labs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No se detectaron valores. Puedes agregar manualmente.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">Parámetro</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider w-36">Resultado</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider w-24">Unidad</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider w-28">Ref.</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider w-16">Anorm.</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {labs.map((lab, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-slate-100 ${
                            lab.isAbnormal ? "bg-red-50/50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-3 py-1.5">
                            <input
                              list="lab-params"
                              value={lab.parameter}
                              onChange={(e) => updateLab(idx, "parameter", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-cyan-400 focus:outline-none text-sm py-0.5 text-slate-800"
                              placeholder="Nombre…"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={lab.textValue}
                              onChange={(e) => updateLab(idx, "textValue", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-cyan-400 focus:outline-none text-sm py-0.5 font-bold text-slate-900"
                              placeholder="1.2 / Abundantes"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={lab.unit}
                              onChange={(e) => updateLab(idx, "unit", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-cyan-400 focus:outline-none text-sm py-0.5 text-slate-600"
                              placeholder="mg/dL"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={lab.referenceRange}
                              onChange={(e) => updateLab(idx, "referenceRange", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent focus:border-cyan-400 focus:outline-none text-sm py-0.5 text-slate-500"
                              placeholder="0.7-1.2"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={lab.isAbnormal}
                              onChange={(e) => updateLab(idx, "isAbnormal", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => removeLab(idx)}
                              className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Datalist for autocomplete */}
              <datalist id="lab-params">
                {LAB_PARAMETERS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>

              {/* Add Row Button */}
              <button
                onClick={addLab}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-cyan-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Agregar parámetro
              </button>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
              <p className="text-xs text-muted-foreground">
                {labs.filter((l) => l.parameter.trim() && (l.textValue.trim() || l.value.trim())).length} de {labs.length} parámetros válidos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSaving || labs.filter((l) => l.parameter.trim() && (l.textValue.trim() || l.value.trim())).length === 0}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar y Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
