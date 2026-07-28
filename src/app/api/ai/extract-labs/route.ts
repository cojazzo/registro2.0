import { NextResponse } from "next/server"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://100.125.127.8:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Se requiere texto para analizar" }, { status: 400 })
    }

    const parameterList = LAB_PARAMETERS.join(", ")

    const systemPrompt = `
Eres un asistente médico experto en extracción de datos de laboratorio. Tu trabajo es analizar el texto de un reporte de laboratorio y extraer los datos de la cabecera (No. de Petición/Folio y fecha) y TODOS los parámetros analizados (tanto cualitativos como cuantitativos), devolviéndolos en un objeto JSON STRICT. NO devuelvas saludos ni explicaciones, SOLO un JSON válido.

IMPORTANTE: Los nombres de los parámetros DEBEN normalizarse a los siguientes nombres exactos cuando correspondan:
${parameterList}

REGLAS CRÍTICAS:
1. NUNCA INCLUYAS LA UNIDAD DE MEDIDA DENTRO DE "textValue" O "value". SEPARA SIEMPRE EL RESULTADO DE LA UNIDAD.
   - CORRECTO: "textValue": "161", "unit": "mg/dL"
   - INCORRECTO: "textValue": "161 mg/dL", "unit": "mg/dL" (¡ESTO ES UN ERROR!)

2. EXTRAE OBLIGATORIAMENTE PARÁMETROS CUALITATIVOS DE URANALISIS / EXAMEN GENERAL DE ORINA (EGO) COMO:
   - "Bacterias" (o "Bacterias en orina"): si dice "Abundantes", "Escasas", "Moderadas", "Negativo", "++", etc.
     -> "parameter": "Bacterias", "value": null, "textValue": "Abundantes", "unit": ""
   - "Celulas epiteliales" (o "Células epiteliales"): si dice "Escasas", "Moderadas", "Abundantes", "2-4 /campo", etc.
     -> "parameter": "Celulas epiteliales", "value": null, "textValue": "Escasas", "unit": "" (o "unit": "/campo" si trae unidad)
   - "Nitritos", "Proteinas en tira", "Esterasa leucocitaria", "Sangre urinaria", "Glucosa urinaria", "Cilindros", "Cristales".

3. Las claves del JSON deben ser EXACTAMENTE las siguientes:
{
  "requestNumber": string (Busca el número de petición, folio, No. de orden, número de solicitud o de muestra, ej: "PET-2025-0012", "104829", "SOL-8821". Si no existe, devuelve null),
  "date": string (Busca la fecha del documento/reporte en formato ISO 8601, ej. "2025-03-03T12:40:20". Si no hay fecha, devuelve null),
  "labs": array de objetos con EXACTAMENTE estas claves:
    {
      "parameter": string (nombre del parámetro normalizado),
      "value": número flotante o null (SOLO el número puro, ej: 161, 12.5, 0.9. Si el resultado es texto como "Abundantes", "Negativo", "Escasas", pon null),
      "textValue": string (SOLO el valor del resultado SIN LA UNIDAD. Ej: "161", "Abundantes", "Negativo", "Escasas", "++", "2-4"),
      "unit": string (SOLO la unidad de medida, ej. "mg/dL", "g/dL", "%", "mL/min", "/campo", "mg/L". Si no tiene unidad, usa ""),
      "referenceRange": string (rango de referencia tal como aparece en el reporte, ej. "0.7 - 1.2", "< 30", "Negativo", "Escasas")
    }
}

EJEMPLOS DE EXTRACCIÓN CORRECTA:
- Texto en reporte: "GLUCOSA  161  mg/dL  70 - 100"
  -> { "parameter": "Glucosa", "value": 161, "textValue": "161", "unit": "mg/dL", "referenceRange": "70 - 100" }
- Texto en reporte: "BACTERIAS  Abundantes  Negativo"
  -> { "parameter": "Bacterias", "value": null, "textValue": "Abundantes", "unit": "", "referenceRange": "Negativo" }
- Texto en reporte: "CELULAS EPITELIALES  Escasas  0 - 2 /campo"
  -> { "parameter": "Celulas epiteliales", "value": null, "textValue": "Escasas", "unit": "/campo", "referenceRange": "0 - 2" }
`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: text,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    const jsonStr = data.response

    const extractedData = JSON.parse(jsonStr)

    // POST-PROCESSING CLEANUP: Ensure textValue never contains units and normalize parameter names
    if (extractedData.labs && Array.isArray(extractedData.labs)) {
      extractedData.labs = extractedData.labs.map((lab: any) => {
        let param = String(lab.parameter || "").trim()
        let textVal = String(lab.textValue || lab.value || "").trim()
        let unit = String(lab.unit || "").trim()

        // 1. Parameter Synonyms Normalization
        if (/bacterias?/i.test(param)) {
          param = "Bacterias"
        } else if (/c[eé]lulas?\s*epiteliales?/i.test(param) || /epiteliales?/i.test(param)) {
          param = "Celulas epiteliales"
        } else if (/leucocitos?\s*(en\s*orina|urinarios?|\(sedimento\))/i.test(param)) {
          param = "Leucocitos urinarios"
        } else if (/eritrocitos?\s*(en\s*orina|urinarios?|\(sedimento\))/i.test(param)) {
          param = "Eritrocitos urinarios"
        }

        // 2. Unit separation cleanup: If textValue contains the unit string at the end, strip it
        if (unit && textVal.toLowerCase().endsWith(unit.toLowerCase())) {
          textVal = textVal.slice(0, -unit.length).trim()
        }

        // Regex check if textValue still contains unit like "161 mg/dL", "161mg/dl", "95%"
        const embeddedUnitMatch = textVal.match(/^([\d.,><\-+]+(?:\s*-\s*[\d.]+)?)\s*([a-zA-Z%µ/]+(?:\/[a-zA-Z]+)?)$/)
        if (embeddedUnitMatch) {
          textVal = embeddedUnitMatch[1].trim()
          if (!unit) {
            unit = embeddedUnitMatch[2].trim()
          }
        }

        // 3. Ensure numeric value is clean float if textValue is numeric
        let val = lab.value
        const parsedNum = parseFloat(textVal)
        if (!isNaN(parsedNum) && /^-?\d+(?:\.\d+)?$/.test(textVal)) {
          val = parsedNum
        } else if (typeof val !== "number" || isNaN(val)) {
          val = null
        }

        return {
          ...lab,
          parameter: param,
          value: val,
          textValue: textVal,
          unit: unit,
          referenceRange: lab.referenceRange || ""
        }
      })
    }

    console.log("LLAMA LAB EXTRACTION (POST-PROCESSED):", extractedData)

    return NextResponse.json(extractedData)

  } catch (error) {
    console.error("AI Lab Extraction Error:", error)
    return NextResponse.json({ error: "Fallo en el procesamiento con Ollama o JSON inválido" }, { status: 500 })
  }
}
