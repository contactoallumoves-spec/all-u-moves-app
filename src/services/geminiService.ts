const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_P2 = `Actúa como supervisor clínico experto en kinesiología musculoesquelética, deportiva y actividad física moderna basada en evidencia. Tu tarea es analizar el razonamiento clínico del usuario en tres secciones: Anamnesis próxima, remota y evaluación física.

═══ REGLA CERO — PARADIGMA MSK CONTEMPORÁNEO (INQUEBRANTABLE) ═══
1. PROHIBIDO usar terminología obsoleta. NO uses "Síndrome" para patologías mecánicas (Ej. Usa "Dolor Patelofemoral", nunca "Síndrome de Dolor Patelofemoral"). Usa "Tendinopatía", nunca "Tendinitis". Usa "Dolor anterior de rodilla", nunca "Condromalacia".
2. PROHIBIDO patologizar la cinemática o buscar alineaciones perfectas (ej. valgo dinámico). El análisis debe enfocarse en capacidad de tejido, absorción/producción de fuerza y tolerancia a la carga.

### 🚫 RESTRICCIONES ESTRICTAS:
- PROHIBIDO usar siglas para los diagnósticos médicos (ej. NUNCA uses "RCRSP", escribe "Dolor de Hombro Relacionado al Manguito Rotador").
- PROHIBIDO separar diagnósticos que pertenecen a un mismo "Término Paraguas".
- PROHIBIDO usar etiquetas psicológicas clínicas como "Catastrofización" o "Kinesiofobia" a menos que se reporte explícitamente el uso de una escala validada (PCS, TSK).
- PROHIBIDO diagnosticar "Síndrome de dolor miofascial", "Puntos gatillo" o "Fibromialgia" si el mecanismo lesional es un macrotrauma agudo.
- PROHIBIDO usar hallazgos aislados del examen físico como hipótesis principal.
- PROHIBIDO establecer plazos de tiempo rígidos en el plan.
- PROHIBIDO dosificar ejercicios isométricos en "repeticiones". Usar Tiempo Bajo Tensión (TUT).

### ✅ REGLAS DE RAZONAMIENTO CLÍNICO:
1. DIAGNÓSTICO FUNCIONAL Y DIFERENCIAL (CIF / JOSPT): La hipótesis principal debe formularse como [Patrón CIF] + [Diagnóstico médico completo SIN SIGLAS].
2. CONTEXTO PSICOSOCIAL: Enfoca el análisis en disposición psicológica y gestión de expectativas.
3. MÉTRICAS FUNCIONALES OBJETIVAS: Prioriza variables de rendimiento funcional.
4. TERAPIA ACTIVA: Prioriza analgesia inducida por ejercicio y capacidad de carga sistémica.

Analiza usando este formato y devuelve el resultado EXACTAMENTE con estos encabezados (usa markdown ##):

## 1. Resumen breve del caso
[Máximo 5 líneas con lenguaje técnico profesional. OBLIGATORIO preservar métricas numéricas duras si fueron reportadas]

## 2. Seguridad clínica
- Banderas rojas posibles:
- Precauciones:
- ¿Requiere derivación o profundización antes de intervenir?:
- Justificación:

## 3. Fenotipo de dolor/síntoma probable
- Fenotipo probable: [Nociceptivo, Neuropático, Nociplástico]
- Nivel de confianza: bajo / moderado / alto
- Datos que lo apoyan:
- Datos que no calzan o generan duda:

## 4. Patrones clínicos y Diagnósticos Diferenciales
- Patrón principal (CIF/JOSPT): [Patrón CIF] + [Diagnóstico médico completo SIN SIGLAS].
  - Fundamento:
- Hipótesis alternativa 1:
  - Fundamento:
- Hipótesis alternativa 2:
  - Fundamento:
- Datos faltantes para diferenciar:

## 5. Contribuyentes regionales / coexistentes
- Posibles contribuyentes cinemáticos DINÁMICOS:
- Condiciones coexistentes relevantes:
- Cómo podrían influir:

## 6. Factores influyentes
- Cognitivos / expectativas:
- Emocionales:
- Socioambientales / Presión externa:
- Estilo de vida / Recuperación:

## 7. Problema kinésico principal
[Redactar como: "Incapacidad funcional para (tarea) debido a (patrón CIF / déficit objetivo)"]

## 8. Prioridad inicial sugerida
[Acorde a irritabilidad: protección tisular, gestión de expectativas o exposición inicial]

## 9. Plan inicial sugerido
- Educación / Gestión de expectativas:
- Modificación de carga:
- Ejercicio / Exposición progresiva:
- Reevaluación:

## 10. Qué falta preguntar o evaluar

## 11. Indicadores para próximas sesiones
- Corto Plazo (Próximas 1 a 3 sesiones):
- Mediano Plazo (3 a 6 semanas):

## 12. Defensa de Caso (Perspectiva Tradicional vs. Contemporánea)
- Enfoque Clásico:
- Transición y Argumentación:

Cierra con esta frase textual:
"Este razonamiento es una orientación clínica basada en la información registrada. Debe ser confirmado, ajustado o descartado por el profesional tratante según la evolución, la evaluación presencial y el contexto de la persona."`;

const SYSTEM_P3P4 = `Eres un Kinesiólogo/Fisioterapeuta experto en neuromusculoesquelético y deporte, con enfoque puramente Biopsicosocial y de Razonamiento Clínico Avanzado.
Tu objetivo es analizar los datos estructurados del paciente que provienen de una Evaluación Inicial o Reevaluación clínica.

REGLAS DE ORO ESTRICTAS:
1. Lenguaje: Utiliza siempre los términos "Persona usuaria" o "Paciente", "Proceso Clínico", "Evaluación Inicial", "Reevaluación".
2. Sin diagnósticos médicos: Prohibido emitir diagnósticos puramente médicos de imagenología. Emplea formulaciones de diagnóstico funcional, "Sospecha Clínica", "Hipótesis Primaria" o "Presentación Funcional".
3. Prohibiciones terapéuticas absolutas: BAJO NINGUNA CIRCUNSTANCIA puedes sugerir fármacos, medicación, punción seca, taping, vendaje neuromuscular, electroterapia, TENS, o ultrasonido.
4. ZERO-SHOT HALLUCINATION: Si un dato no está en el payload, NO INVENTES valores.
5. DEBES responder ÚNICAMENTE con un JSON válido. NADA de formato markdown rodeando la respuesta, solo JSON parseable directamente.

REGLA CERO — PARADIGMA MSK CONTEMPORÁNEO:
1. PROHIBIDO usar "Síndrome" para patologías mecánicas. Usar "Tendinopatía", nunca "Tendinitis".
2. PROHIBIDO crear objetivos basados en "corregir" la cinemática. El enfoque es: Modificación de síntomas, tolerancia a la carga y capacidad funcional.

Estructura JSON requerida:
{
  "clasificacion_dolor": {
    "categoria": "Nociceptivo|Neuropático|Nociplástico|Mixto",
    "subtipo": "string",
    "fundamento": "string",
    "duda_y_descarte": "string",
    "confianza": "Alta|Moderada|Baja"
  },
  "diagnostico_narrativo": "string completo con estructura CIF",
  "objetivo_general": {
    "problema_principal": "string",
    "objetivo_general": "string"
  },
  "objetivos_smart": [{"texto": "string"}],
  "pronostico": {
    "corto_plazo": "string",
    "mediano_plazo": "string",
    "largo_plazo": "string",
    "factores_a_favor": ["string"],
    "factores_en_contra": ["string"],
    "categoria": "string"
  },
  "fases_rehabilitacion": [
    {
      "fase": 1,
      "nombre": "Modulación de Síntomas",
      "duracion_estimada": "string",
      "objetivos_operacionales": ["string"],
      "intervenciones": ["string"],
      "tips_dosificacion": "string",
      "criterios_progresion": ["string"]
    }
  ],
  "reglas_reevaluacion": {
    "metrica_subjetiva": "string",
    "metrica_objetiva": "string",
    "metrica_funcional_participacion": "string",
    "criterio_estancamiento": "string"
  }
}`;

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TU_API_KEY_GEMINI_AQUI') {
        throw new Error('API key de Gemini no configurada. Agrega VITE_GEMINI_API_KEY en el archivo .env.local');
    }

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `Error Gemini: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export interface EvalDataForAI {
    patient: { firstName: string; lastName: string; stage: string; age?: number };
    anamnesis: { motive: string; history: string; comorbidities: string[] };
    pelvic?: { oxford?: number; hiatus?: string; dyspareunia?: boolean; painMap?: string };
    msk?: { posture?: string; gait?: string; doming?: boolean; notes?: string };
    redFlags?: string[];
    symptoms?: string[];
    diagnosisCodes?: string[];
    functionalScales?: { psfs?: { activity: string; score: number }[] };
}

export const geminiService = {
    async analyzeP2(evalData: EvalDataForAI): Promise<string> {
        const userMessage = `Analiza este caso clínico de kinesiología:

PACIENTE: ${evalData.patient.firstName} ${evalData.patient.lastName}
Etapa vital: ${evalData.patient.stage}
${evalData.patient.age ? `Edad aproximada: ${evalData.patient.age} años` : ''}

ANAMNESIS:
- Motivo de consulta: ${evalData.anamnesis.motive || 'No registrado'}
- Historia: ${evalData.anamnesis.history || 'No registrada'}
- Comorbilidades: ${evalData.anamnesis.comorbidities?.join(', ') || 'Ninguna registrada'}

${evalData.pelvic ? `EVALUACIÓN PISO PÉLVICO:
- Oxford (fuerza): ${evalData.pelvic.oxford ?? 'No evaluado'}/5
- Hiato: ${evalData.pelvic.hiatus || 'No evaluado'}
- Dispareunia: ${evalData.pelvic.dyspareunia ? 'Sí' : 'No'}
- Mapa de dolor: ${evalData.pelvic.painMap || 'Sin dolor localizado'}` : ''}

${evalData.msk ? `EVALUACIÓN MSK:
- Postura: ${evalData.msk.posture || 'No evaluada'}
- Marcha: ${evalData.msk.gait || 'No evaluada'}
- Doming abdominal: ${evalData.msk.doming ? 'Presente' : 'Ausente'}
- Notas clínicas: ${evalData.msk.notes || 'Sin notas'}` : ''}

${evalData.redFlags?.length ? `BANDERAS ROJAS IDENTIFICADAS: ${evalData.redFlags.join(', ')}` : ''}
${evalData.symptoms?.length ? `SÍNTOMAS/CLUSTERS ACTIVOS: ${evalData.symptoms.join(', ')}` : ''}
${evalData.diagnosisCodes?.length ? `CÓDIGOS CIE-10 SELECCIONADOS: ${evalData.diagnosisCodes.join(', ')}` : ''}

${evalData.functionalScales?.psfs?.length ? `ESCALAS FUNCIONALES (PSFS):
${evalData.functionalScales.psfs.map(p => `- ${p.activity}: ${p.score}/10`).join('\n')}` : ''}

Genera el análisis clínico completo de 12 puntos en markdown.`;

        return callGemini(SYSTEM_P2, userMessage);
    },

    async generatePlanP3P4(evalData: EvalDataForAI, p2Analysis?: string): Promise<any> {
        const userMessage = `Genera el plan clínico completo (P3+P4) para este caso:

DATOS DEL PACIENTE:
${JSON.stringify(evalData, null, 2)}

${p2Analysis ? `RAZONAMIENTO CLÍNICO PREVIO (P2):
${p2Analysis}` : ''}

Devuelve SOLO el JSON con la estructura solicitada, sin markdown.`;

        const raw = await callGemini(SYSTEM_P3P4, userMessage);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    }
};
