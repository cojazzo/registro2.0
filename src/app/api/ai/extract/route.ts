import { NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://100.125.127.8:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Se requiere texto para analizar" }, { status: 400 })
    }

    const systemPrompt = `
Eres un asistente médico experto de extracción de datos. Tu único trabajo es analizar el texto clínico proporcionado (puede venir de un PDF desordenado o una nota libre) y extraer los valores clínicos requeridos, devolviéndolos en un objeto JSON STRICT. NO devuelvas saludos, ni explicaciones, SOLO un JSON válido.

Las claves del JSON deben ser EXACTAMENTE las siguientes (si no encuentras el dato, asigna null):
{
  "date": string (Busca la fecha del documento, como "Fecha y hora de realización", "Fecha de recolección", "Fecha de muestra", "Fecha de emisión", etc. y conviértela a formato ISO 8601, ej. "2025-03-03T12:40:20". Si no hay, omite el campo o devuelve null),
  "weight": número flotante (Peso en kg),
  "height": número flotante (Talla en cm. IMPORTANTE: Si viene en metros como "1.69 mts", conviértelo a centímetros multiplicando por 100, ej. 169),
  "waist": número flotante (Perímetro abdominal en cm),
  "bloodPressure": string (Presión arterial, ej. "120/80" extraído de TA o PA),
  "heartRate": número entero (Frecuencia cardíaca extraída de FC, latidos, lpm),
  "respiratoryRate": número entero (Frecuencia respiratoria extraída de FR, rpm),
  "oxygenSaturation": número flotante (Saturación de oxígeno extraída de SO2, SpO2, porcentaje),
  "temperature": número flotante (Temperatura en grados, extraída de T, Temp),
  "physicalExam": string (Resumen del examen físico o hallazgos relevantes),
  "evolution": string (Extrae el texto de la sección EVOLUCION copiando "tal cual" y literal todo su contenido sin resumirlo),
  "diagnosis": string (Extrae el texto de la sección DIAGNOSTICOS copiando "tal cual" y literal todo su contenido),
  "plan": string (Extrae el texto de la sección PLAN A SEGUIR copiando "tal cual" y literal todo su contenido),
  "prognosis": string (Extrae el texto de la sección PRONOSTICO copiando "tal cual" y literal todo su contenido),
  "labs": array de objetos (Extraer laboratorios detectados: { "parameter": string, "value": número flotante }. IMPORTANTE: Si el documento menciona "NOTA DE EVOLUCION", ignora esto y devuelve un array vacío []),
  "medications": array de objetos (Extraer del PLAN o TRATAMIENTO: { "name": string, "dosage": string, "frequency": string }. Si es nota de evolución, opcionalmente extraer medicamentos si están en el plan)
}

Recuerda: El JSON resultante debe ser válido (RFC 8259).
`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: text,
        stream: false,
        format: "json", // Fuerza a Ollama a intentar formato JSON
        options: {
          temperature: 0.1 // Baja temperatura para consistencia
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    const jsonStr = data.response
    
    const extractedData = JSON.parse(jsonStr)
    
    // Fuerza bruta: Si es una nota de evolución, elimina los laboratorios por completo
    if (text.toUpperCase().includes("NOTA DE EVOLUCION") || text.toUpperCase().includes("NOTA DE EVOLUCIÓN")) {
      extractedData.labs = []
    }

    console.log("LLAMA EXTRACTED DATA:", extractedData)

    return NextResponse.json(extractedData)

  } catch (error) {
    console.error("AI Extraction Error:", error)
    return NextResponse.json({ error: "Fallo en el procesamiento con Ollama o JSON inválido" }, { status: 500 })
  }
}
