/**
 * Calcula la Tasa de Filtración Glomerular estimada (eGFR)
 * utilizando la fórmula CKD-EPI 2021 para adultos (>= 18) 
 * y Schwartz (Bedside) para pacientes pediátricos (< 18).
 * 
 * @param scr Creatinina Sérica (mg/dL)
 * @param ageInYears Edad exacta al momento de la muestra
 * @param gender "M" (Masculino) o "F" (Femenino)
 * @param heightCm Talla en centímetros (Requerida solo para < 18 años)
 * @returns eGFR (ml/min/1.73m2) o nulo si faltan datos críticos.
 */
export function calculateEgfr(
  scr: number, 
  ageInYears: number, 
  gender: string, 
  heightCm?: number | null
): number | null {
  if (!scr || scr <= 0) return null;
  
  // Ecuación de Schwartz (Bedside) para pediátricos: (0.413 x talla[cm]) / Scr[mg/dL]
  if (ageInYears < 18) {
    if (!heightCm || heightCm <= 0) return null; // No podemos calcular sin talla
    return (0.413 * heightCm) / scr;
  }
  
  // Ecuación CKD-EPI 2021 (sin factor de raza)
  // eGFR = 142 * min(Scr/K, 1)^α * max(Scr/K, 1)^-1.200 * 0.9938^Age * [1.012 if female]
  const isFemale = gender.toUpperCase() === 'F';
  const k = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  
  const minScrK = Math.min(scr / k, 1);
  const maxScrK = Math.max(scr / k, 1);
  
  const egfr = 142 
    * Math.pow(minScrK, alpha) 
    * Math.pow(maxScrK, -1.200) 
    * Math.pow(0.9938, ageInYears) 
    * (isFemale ? 1.012 : 1);
    
  return Number(egfr.toFixed(2));
}

// Alias to match uppercase usage in patients page
export const calculateEGFR = calculateEgfr;

/**
 * Calculates Body Mass Index (BMI).
 * Formula: weight (kg) / (height (m) ^ 2)
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
}

export const calculateBmi = calculateBMI;

/**
 * Calculates the G-stage of ERC (Enfermedad Renal Crónica)
 * based on the eGFR (Tasa de Filtrado Glomerular) value.
 */
export function getEgfrStage(egfr: number): { stage: string; description: string } {
  if (egfr >= 90) return { stage: "G1", description: "Normal o elevado" };
  if (egfr >= 60) return { stage: "G2", description: "Ligeramente disminuido" };
  if (egfr >= 45) return { stage: "G3a", description: "Ligeramente a moderadamente disminuido" };
  if (egfr >= 30) return { stage: "G3b", description: "Moderadamente a gravemente disminuido" };
  if (egfr >= 15) return { stage: "G4", description: "Gravemente disminuido" };
  return { stage: "G5", description: "Fallo renal" };
}

/**
 * Calculates the A-stage of ERC (Enfermedad Renal Crónica)
 * based on the ACR (Relación Albúmina/Creatinina) value in mg/g.
 */
export function getAcrStage(acr: number): { stage: string; description: string } {
  if (acr < 30) return { stage: "A1", description: "Normal a ligeramente aumentado" };
  if (acr <= 300) return { stage: "A2", description: "Moderadamente aumentado" };
  return { stage: "A3", description: "Gravemente aumentado" };
}

/**
 * Calculates the overall ERC classification based on latest eGFR and ACR values.
 */
export function getErcClassification(egfrVal: number | null, acrVal: number | null): {
  stage: string;
  colorClass: string;
  risk: "Bajo" | "Moderado" | "Alto" | "Muy Alto" | "Desconocido";
} {
  if (egfrVal === null && acrVal === null) {
    return { stage: "Sin estadificar", colorClass: "text-slate-500 bg-slate-50 border-slate-200", risk: "Desconocido" };
  }

  const g = egfrVal !== null ? getEgfrStage(egfrVal).stage : "G?";
  const a = acrVal !== null ? getAcrStage(acrVal).stage : "A?";

  const stage = `ERC ${g}${a !== "A?" ? " " + a : ""}`;

  // Risk stratification according to KDIGO heat map
  // Green: Low risk (G1/G2 + A1)
  // Yellow: Moderately increased risk (G1/G2 + A2, or G3a + A1)
  // Orange: High risk (G1/G2 + A3, G3a + A2, G3b + A1)
  // Red: Very high risk (G3a + A3, G3b + A2/A3, G4/G5 + any A)
  let risk: "Bajo" | "Moderado" | "Alto" | "Muy Alto" | "Desconocido" = "Desconocido";
  let colorClass = "text-slate-500 bg-slate-50 border-slate-200";

  if (egfrVal !== null) {
    const egfr = egfrVal;
    const acr = acrVal ?? 0; // Default to normal if not present for basic coloring

    if (egfr >= 60) {
      if (acrVal === null || acr < 30) {
        risk = "Bajo";
        colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
      } else if (acr <= 300) {
        risk = "Moderado";
        colorClass = "text-amber-700 bg-amber-50 border-amber-200";
      } else {
        risk = "Alto";
        colorClass = "text-orange-700 bg-orange-50 border-orange-200";
      }
    } else if (egfr >= 45) { // G3a
      if (acrVal === null || acr < 30) {
        risk = "Moderado";
        colorClass = "text-amber-700 bg-amber-50 border-amber-200";
      } else if (acr <= 300) {
        risk = "Alto";
        colorClass = "text-orange-700 bg-orange-50 border-orange-200";
      } else {
        risk = "Muy Alto";
        colorClass = "text-red-700 bg-red-50 border-red-200";
      }
    } else if (egfr >= 30) { // G3b
      if (acrVal === null || acr < 30) {
        risk = "Alto";
        colorClass = "text-orange-700 bg-orange-50 border-orange-200";
      } else {
        risk = "Muy Alto";
        colorClass = "text-red-700 bg-red-50 border-red-200";
      }
    } else { // G4 and G5
      risk = "Muy Alto";
      colorClass = "text-red-700 bg-red-50 border-red-200";
    }
  } else if (acrVal !== null) {
    // Only have ACR
    if (acrVal < 30) {
      risk = "Bajo";
      colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (acrVal <= 300) {
      risk = "Moderado";
      colorClass = "text-amber-700 bg-amber-50 border-amber-200";
    } else {
      risk = "Alto";
      colorClass = "text-orange-700 bg-orange-50 border-orange-200";
    }
  }

  return { stage, colorClass, risk };
}


