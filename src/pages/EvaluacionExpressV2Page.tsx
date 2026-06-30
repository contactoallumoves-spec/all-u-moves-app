import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ─── UTILS ────────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── TIPOS DE ÁREA CLÍNICA ────────────────────────────────────────────────────
type AreaClinica = 'pisoPelvico' | 'msk' | 'deportiva';

const AREAS: { id: AreaClinica; label: string; emoji: string; color: string }[] = [
    { id: 'pisoPelvico', label: 'Piso Pélvico', emoji: '🌸', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'msk',         label: 'Kine MSK',      emoji: '🦴', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'deportiva',   label: 'Kine Deportiva', emoji: '⚡', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

// ─── GEMINI CALL ──────────────────────────────────────────────────────────────
async function callGemini(systemPrompt: string, userMessage: string, mimeType: 'text/plain' | 'application/json' = 'text/plain'): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TU_API_KEY_GEMINI_AQUI') {
        throw new Error('API key de Gemini no configurada. Agrega VITE_GEMINI_API_KEY en .env.local');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                responseMimeType: mimeType,
            }
        })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Error Gemini: ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── SYSTEM PROMPTS POR ÁREA ──────────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<AreaClinica, string> = {
pisoPelvico: `Eres un kinesiólogo/a experto/a en disfunciones del suelo pélvico (DSP), uroginecología funcional y rehabilitación perineal, con formación en las guías ICS/IUGA 2023, evidencia Bø et al. 2018, Dumoulin 2018, Hagen et al. 2017 y el paradigma biopsicosocial contemporáneo.

═══ REGLA CERO — PARADIGMA PISO PÉLVICO CONTEMPORÁNEO (INQUEBRANTABLE) ═══
1. PROHIBIDO patologizar la anatomía normal. La disfunción se define por síntomas funcionales y calidad de vida, no por hallazgos morfológicos aislados.
2. PROHIBIDO reducir la evaluación a "Oxford 3/5, prescribir Kegel". El razonamiento debe integrar mecanismo, fenotipo sintomático, contexto biopsicosocial y función global del suelo pélvico.
3. Usa terminología ICS/IUGA actualizada: "incontinencia urinaria de esfuerzo (IUE)", "vejiga hiperactiva (VHA)", "prolapso de órganos pélvicos (POP)", "dispareunia", "vaginismo", "hipertonía del suelo pélvico (HSP)", "diastasis del recto abdominal (DRA)".
4. PROHIBIDO asumir diagnóstico por imagen sin correlación clínica.
5. La escala Oxford modificada (0-5) evalúa fuerza, no lo único relevante: integrar también PERFECT (P-E-R-F-E-C-T), coordinación, relax activo y función bajo carga (tos, salto, sentadilla).

### REGLAS DE RAZONAMIENTO CLÍNICO SUELO PÉLVICO:
1. FENOTIPO DE DISFUNCIÓN (no diagnóstico): Hipotonía / Hipertonía / Coordinación / Mixto / Dolor pélvico crónico.
2. CONTEXTO OBSTÉTRICO-GINECOLÓGICO: Integra paridad, tipo de parto, trauma perineal, estado hormonal (postparto, perimenopausia, menopausia).
3. PRESIÓN ABDOMINAL Y SINERGIA: Evalúa mecanismos de aumento de presión intraabdominal (PIA), estrategia respiratoria, DRA, función de transversus abdominis.
4. BANDERAS ROJAS PÉLVICAS: Hematuria, masa pélvica, prolapso grado III-IV, dolor pélvico severo de inicio súbito, infección, neuropatía progresiva → derivar.
5. FACTORES BPS: Trauma, historia de abuso, imagen corporal, sexualidad, rol social de cuidadora, vergüenza/estigma.

Analiza usando este formato con encabezados ## exactos:

## 1. Resumen del caso
[Máximo 5 líneas. Incluye fenotipo sintomático, contexto obstétrico/hormonal, tiempo de evolución e impacto funcional.]

## 2. Seguridad clínica y banderas
- Banderas rojas pélvicas:
- Precauciones:
- ¿Requiere derivación o evaluación médica previa?:
- Justificación:

## 3. Fenotipo de disfunción del suelo pélvico
- Fenotipo predominante: [Hipotonía / Hipertonía / Coordinación / Dolor pélvico / Mixto]
- Nivel de confianza: bajo / moderado / alto
- Hallazgos que lo apoyan (Oxford, PERFECT, síntomas, comportamiento funcional):
- Datos que no calzan o generan duda:

## 4. Hipótesis clínicas y Diagnósticos Funcionales
- Diagnóstico funcional principal (ICS + CIF):
  - Fundamento:
- Hipótesis alternativa 1:
  - Fundamento:
- Hipótesis alternativa 2:
  - Fundamento:
- Datos faltantes para diferenciar:

## 5. Contribuyentes regionales y sistémicos
- Sinergia lumbopélvica (postura, respiración, transversus):
- Condiciones coexistentes relevantes (DRA, prolapso, dolor lumbar, endometriosis, menopausia):
- Cómo podrían influir en la disfunción:

## 6. Factores biopsicosociales
- Contexto hormonal y obstétrico:
- Factores emocionales / historia de trauma:
- Impacto en sexualidad y rol social:
- Barreras de adherencia y estigma:

## 7. Problema kinésico principal de suelo pélvico
[Redactar como: "Disfunción funcional de [tipo] manifestada como [síntoma/limitación] en el contexto de [factores contribuyentes]"]

## 8. Prioridad inicial de intervención
[Según fenotipo e irritabilidad: educación neurofisiológica / modulación del tono / entrenamiento de fuerza y coordinación / manejo del dolor / rehabilitación bajo carga]

## 9. Plan inicial sugerido
- Educación y desmitificación (anatomía, mecanismo, rol del SP):
- Intervención prioritaria según fenotipo:
- Progresión de entrenamiento suelo pélvico (PERFECT, carga funcional):
- Abordaje BPS complementario:
- Reevaluación (criterios y plazo):

## 10. Qué falta preguntar o evaluar
[Incluir: ICIQ-UI-SF, UDI-6/IIQ-7, POP-Q si no evaluado, función sexual, mapeo de dolor si corresponde]

## 11. Indicadores para próximas sesiones
- Corto Plazo (Próximas 1 a 3 sesiones):
- Mediano Plazo (3 a 6 semanas):

## 12. Defensa de Caso (Perspectiva Tradicional vs. Contemporánea)
- Enfoque Clásico (solo Kegel, enfoque en fuerza):
- Transición Contemporánea (fenotipo, contexto, función, BPS):

Cierra con: "Este razonamiento es una orientación clínica basada en la información registrada. Debe ser confirmado, ajustado o descartado por el profesional tratante según la evaluación presencial y el contexto de la persona."`,

msk: `Actúa como supervisor clínico experto en kinesiología musculoesquelética y actividad física moderna basada en evidencia. Analiza el razonamiento clínico en tres secciones: Anamnesis próxima, remota y evaluación física.

═══ REGLA CERO — PARADIGMA MSK CONTEMPORÁNEO (INQUEBRANTABLE) ═══
1. PROHIBIDO usar terminología obsoleta. NO uses "Síndrome" para patologías mecánicas. Usa "Tendinopatía", nunca "Tendinitis". Usa "Dolor patelofemoral", nunca "Condromalacia". Usa "Dolor de hombro", nunca "Bursitis" como diagnóstico principal.
2. PROHIBIDO patologizar la cinemática. El análisis se centra en capacidad de tejido, absorción/producción de fuerza y tolerancia a la carga.
3. PROHIBIDO usar etiquetas psicológicas clínicas como "catastrofización" sin escala validada (PCS/TSK).
4. PROHIBIDO dosificar isométricos en repeticiones. Usar Tiempo Bajo Tensión (TUT).

### REGLAS DE RAZONAMIENTO CLÍNICO MSK:
1. DIAGNÓSTICO FUNCIONAL (CIF/JOSPT): Hipótesis como [Patrón CIF] + [Diagnóstico médico SIN SIGLAS].
2. CONTEXTO PSICOSOCIAL: Disposición psicológica y gestión de expectativas.
3. MÉTRICAS FUNCIONALES OBJETIVAS: Variables de rendimiento funcional.
4. TERAPIA ACTIVA: Analgesia inducida por ejercicio y capacidad de carga sistémica.

Analiza con encabezados ## exactos:

## 1. Resumen breve del caso
## 2. Seguridad clínica
- Banderas rojas posibles:
- Precauciones:
- ¿Requiere derivación?:
- Justificación:
## 3. Fenotipo de dolor/síntoma probable
- Fenotipo: [Nociceptivo / Neuropático / Nociplástico]
- Nivel de confianza:
- Datos que lo apoyan:
- Datos que no calzan:
## 4. Patrones clínicos y Diagnósticos Diferenciales
- Patrón principal (CIF/JOSPT):
  - Fundamento:
- Hipótesis alternativa 1:
  - Fundamento:
- Hipótesis alternativa 2:
  - Fundamento:
- Datos faltantes:
## 5. Contribuyentes regionales / coexistentes
## 6. Factores influyentes
- Cognitivos / expectativas:
- Emocionales:
- Socioambientales:
- Estilo de vida / Recuperación:
## 7. Problema kinésico principal
## 8. Prioridad inicial sugerida
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

Cierra con: "Este razonamiento es una orientación clínica basada en la información registrada. Debe ser confirmado, ajustado o descartado por el profesional tratante según la evaluación presencial y el contexto de la persona."`,

deportiva: `Eres un kinesiólogo/a deportivo/a experto/a en medicina y rehabilitación del deporte, retorno al deporte (RTS), periodización de carga y criterios de alta deportiva, con base en las guías BJSM, IOC 2023, consensos de retorno al deporte (Grindem 2016, Ardern 2016) y el paradigma biopsicosocial contemporáneo.

═══ REGLA CERO — PARADIGMA KINE DEPORTIVA CONTEMPORÁNEO (INQUEBRANTABLE) ═══
1. PROHIBIDO usar "Síndrome" como diagnóstico en patologías mecánicas. "Tendinopatía", nunca "Tendinitis". "Dolor patelofemoral", nunca "Condromalacia".
2. PROHIBIDO establecer plazos rígidos de retorno ("en 3 semanas vuelves"). El RTS es criterio-dependiente, no tiempo-dependiente.
3. PROHIBIDO recomendar reposo absoluto salvo banderas rojas estructurales. La carga relativa y el entrenamiento alternativo son la norma.
4. PROHIBIDO ignorar la carga de entrenamiento previa y picos de carga aguda:crónica como factor etiológico clave.

### REGLAS DE RAZONAMIENTO CLÍNICO DEPORTIVO:
1. MECANISMO DE LESIÓN: Distinguir macrotrauma (agudo, contacto, no-contacto) de sobreuso (sobrecarga progresiva, error de entrenamiento, déficit de recuperación).
2. CARGA: Evalúar ratio aguda:crónica (ACWR), spikes de carga, cambios de superficie, calzado, intensidad, volumen o frecuencia.
3. RETORNO AL DEPORTE (RTS): Aplicar framework de 3 etapas: Retorno al entrenamiento → Retorno al deporte → Retorno al rendimiento.
4. CRITERIOS FUNCIONALES: Priorizar criterios cuantitativos (LSI ≥90%, fuerza excéntrica/concéntrica, SL squat, hop tests, reactive agility) sobre tiempo.
5. FACTORES BPS DEPORTIVOS: Miedo a relesionar (KOOS-Sport, FAAM), identidad deportiva, presión de entrenador/equipo, temporada/competencia cercana.

Analiza con encabezados ## exactos:

## 1. Resumen del caso deportivo
[Deporte, nivel, mecanismo, tiempo de evolución, demandas deportivas específicas e impacto en rendimiento/competencia]
## 2. Seguridad clínica y banderas
- Banderas rojas estructurales (fractura, ruptura completa, neuropatía, vascular):
- Precauciones:
- ¿Requiere imagen, derivación médica o cirugía?:
- Justificación:
## 3. Fenotipo de la lesión/síntoma deportivo
- Mecanismo dominante: [Macrotrauma agudo / Sobreuso / Error de entrenamiento / Mixto]
- Fenotipo de dolor: [Nociceptivo / Neuropático / Nociplástico]
- Nivel de confianza:
- Hallazgos que lo apoyan:
## 4. Hipótesis clínicas y Diagnósticos Diferenciales (deportivos)
- Hipótesis principal (CIF + denominación contemporánea SIN SIGLAS):
  - Fundamento:
- Hipótesis alternativa 1:
  - Fundamento:
- Hipótesis alternativa 2:
  - Fundamento:
- Datos faltantes para diferenciar:
## 5. Factores de carga y entrenamiento
- ACWR estimado / pico de carga identificado:
- Factores de entrenamiento contribuyentes:
- Recuperación y factores sistémicos (sueño, nutrición, estrés):
## 6. Factores biopsicosociales deportivos
- Miedo a relesión / kinesiofobia deportiva:
- Identidad deportiva y presión de rendimiento:
- Temporada y contexto competitivo:
- Apoyo del cuerpo técnico:
## 7. Problema kinésico deportivo principal
[Incapacidad para (gesto/demanda deportiva) debido a (patrón funcional) en el contexto de (factores de carga/BPS)]
## 8. Etapa de retorno al deporte
[Retorno al entrenamiento / Retorno al deporte / Retorno al rendimiento — con criterios para avanzar]
## 9. Plan inicial deportivo
- Carga relativa y entrenamiento alternativo:
- Intervención prioritaria según etapa RTS:
- Criterios cuantitativos para progresar (LSI, hop test, SL squat, etc.):
- Abordaje BPS (confianza, comunicación con cuerpo técnico):
- Reevaluación:
## 10. Qué falta preguntar o evaluar
[Tests funcionales deportivos pendientes, ACWR objetivo, evaluación de fuerza excéntrica/concéntrica, escalas de RTS]
## 11. Indicadores para próximas sesiones
- Corto Plazo (Próximas 1 a 3 sesiones):
- Mediano Plazo (3 a 6 semanas):
## 12. Defensa de Caso (Perspectiva Tradicional vs. Contemporánea)
- Enfoque Clásico (reposo, tiempo, vendajes):
- Transición Contemporánea (carga guiada por criterio, RTS funcional, BPS):

Cierra con: "Este razonamiento es una orientación clínica basada en la información registrada. Debe ser confirmado, ajustado o descartado por el profesional tratante según la evaluación presencial y el contexto deportivo."`,
};

// ─── PLANTILLAS POR ÁREA ──────────────────────────────────────────────────────
const PLANTILLAS_ANAMNESIS_PROXIMA: Record<AreaClinica, string> = {
pisoPelvico: `■ MOTIVO DE CONSULTA
[Palabras textuales. ¿Qué le molesta, qué la preocupa, por qué consulta ahora?]

■ SÍNTOMA PRINCIPAL DE SUELO PÉLVICO
[Pérdida de orina (esfuerzo/urgencia/mixta), pesadez/bulto vaginal, dolor pélvico/perineal, dificultad para vaciar vejiga/intestino, dolor en relaciones sexuales, otros]

■ CARACTERÍSTICAS DEL SÍNTOMA
[Cuándo ocurre, frecuencia, cantidad (gotas/chorro/protector completo), provocado por tos/estornudo/salto/urgencia, nocturno, impacto en calidad de vida]

■ ESCALAS APLICADAS (anotar puntajes si se dispone)
[ICIQ-UI-SF (0-21): __ / UDI-6: __ / IIQ-7: __ / POP-Q estadio si evaluado: __ / EVA dolor: __/10]

■ INICIO Y EVOLUCIÓN
[Desde cuándo, relación con parto/cirugía/menopausia/cambio de peso/actividad física, evolución (estable/progresivo/fluctuante)]

■ CONTEXTO OBSTÉTRICO-GINECOLÓGICO
[Gestas/Partos/Abortos (G-P-A), vía de parto (vaginal/cesárea), instrumental (fórceps/ventosa), duración del expulsivo, desgarro perineal (grado), episiotomía, lactancia, tiempo postparto]

■ ESTADO HORMONAL
[Premenopausia/Perimenopausia/Menopausia. TRH. Ciclo menstrual. Anticonceptivos. Sequedad vaginal.]

■ HÁBITOS VESICALES E INTESTINALES
[Frecuencia miccional (normal: 6-8/día), nocturia (veces), urgencia, chorro interrumpido, pujo, constipación, heces duras, frecuencia defecatoria]

■ SÍNTOMAS SEXUALES
[Dispareunia (superficial/profunda/entrada/fondo), vaginismo, disminución de sensibilidad, evitación de relaciones]

■ COMPORTAMIENTO BAJO CARGA
[Pérdida con tos, estornudo, risa, salto, carrera, levantamiento de peso — ¿cuánto peso provoca síntoma?]

■ SEVERIDAD FUNCIONAL
[Qué evita o ha dejado de hacer: deporte, actividad física, vida social, intimidad]

■ ATENUANTES Y AGRAVANTES
[Qué mejora, qué empeora: posición, esfuerzo, hora del día, estrés]

■ MANEJO PREVIO
[Fisioterapia pélvica previa, ejercicios prescritos, pesario, cirugía (colporrafia, TOT, TVT), medicamentos (antimuscarínicos, estrógenos tópicos)]

■ BANDERAS ROJAS PÉLVICAS
[Hematuria, masa pélvica, prolapso que no reduce, dolor pélvico severo de inicio súbito, infección activa, síntomas neurológicos progresivos]

■ CREENCIAS / PREOCUPACIONES
[¿Qué cree que tiene? ¿Qué teme? ¿Vergüenza/estigma? ¿Expectativas del tratamiento?]

■ NOTAS RELEVANTES
[Información que no calza en los campos anteriores]`,

msk: `■ MOTIVO DE CONSULTA
[Palabras textuales. Qué le molesta, qué le preocupa y por qué consulta ahora]

■ OBJETIVO / EXPECTATIVA
[Qué quiere lograr, en qué plazo, qué actividad quiere recuperar]

■ CONTEXTO ACTUAL
[Edad, ocupación, deporte/actividad física, nivel de actividad, demandas laborales o familiares actuales]

■ INICIO Y EVOLUCIÓN
[Desde cuándo, cómo empezó, si fue traumático/progresivo, si mejora, empeora, fluctúa o está en meseta]

■ MECANISMO O CAMBIO DE CARGA
[Caída, golpe, torsión, sobrecarga, cambio de entrenamiento, aumento de volumen/intensidad, inicio sin causa clara]

■ LOCALIZACIÓN Y EXTENSIÓN
[Zona principal, zonas secundarias, puntual/difuso, superficial/profundo, unilateral/bilateral]

■ IRRADIACIÓN / SÍNTOMAS NEUROLÓGICOS
[Si corre a otra zona, hormigueo, adormecimiento, corriente, pérdida de fuerza, cambios de sensibilidad]

■ CARÁCTER DEL SÍNTOMA
[Punzante, quemante, eléctrico, opresivo, tirantez, rigidez, pesadez, bloqueo, inestabilidad, fatiga, debilidad]

■ INTENSIDAD (NRS/EVA)
[Actual / peor 24 h / mejor 24 h / durante la actividad más limitante]

■ COMPORTAMIENTO MECÁNICO
[Qué movimientos, posiciones, cargas, gestos o repeticiones lo aumentan, reducen o reproducen]

■ COMPORTAMIENTO 24 HORAS
[Mañana, tarde/noche, después de actividad, al día siguiente, rigidez matinal, despertar nocturno]

■ SEVERIDAD FUNCIONAL
[Qué no puede hacer o evita: AVD, trabajo, deporte, sueño, vida social]

■ IRRITABILIDAD
[Qué tan fácil se gatilla, cuánto demora en calmarse]

■ MANEJO PREVIO Y RESPUESTA
[Medicamentos, reposo, kinesiterapia previa, ejercicios, infiltraciones, imágenes, automanejo]

■ CREENCIAS / PREOCUPACIONES
[Qué cree que tiene, qué teme, qué cree que pasaría si se mueve o carga]

■ SEGURIDAD CLÍNICA
[Trauma importante, fiebre, baja de peso, dolor nocturno no mecánico, síntomas neurológicos progresivos, antecedentes oncológicos, otros signos de alerta]

■ NOTAS RELEVANTES
[Información libre que no calza en los campos anteriores]`,

deportiva: `■ MOTIVO DE CONSULTA / GESTO LIMITANTE
[Palabras textuales. ¿Qué le molesta? ¿En qué gesto deportivo específico? ¿Por qué consulta ahora?]

■ DEPORTE Y NIVEL
[Deporte/actividad, nivel (recreativo/amateur/semiprofesional/profesional), posición/especialidad, horas/semana, años de práctica]

■ CONTEXTO DE TEMPORADA
[¿Pretemporada/competencia/postemporada? ¿Hay competencia o evento importante próximo y en cuánto tiempo?]

■ MECANISMO DE LESIÓN
[¿Agudo (fecha, gesto, contacto/no contacto, sonido) o insidioso (inicio gradual, sobrecarga progresiva)? Describir exactamente qué pasó.]

■ CAMBIO DE CARGA PREVIO A LA LESIÓN
[¿Aumento de volumen, intensidad, frecuencia o cambio de superficie/calzado en las últimas 4-8 semanas?]

■ SÍNTOMA DURANTE EL DEPORTE
[¿Cuándo aparece: inicio/mitad/final del entrenamiento/competencia? ¿Limita el rendimiento, obliga a detenerse o solo molesta?]

■ SÍNTOMA EN REPOSO Y 24 HORAS
[¿Dolor en reposo? ¿Al despertar? ¿Rigidez matinal? ¿Dolores nocturnos? ¿Reacción post-esfuerzo (empeoramiento al día siguiente)?]

■ INTENSIDAD (NRS/EVA)
[Durante la actividad deportiva / en reposo / peor momento / mejor momento]

■ LOCALIZACIÓN Y SÍNTOMAS ASOCIADOS
[Zona exacta, irradiación, hormigueo, hinchazón, inestabilidad, hematoma, crepitación, bloqueo]

■ INTENTOS DE RETORNO ANTERIORES
[¿Ha intentado volver antes? ¿Qué pasó? ¿Empeoramiento, mismo dolor, diferente dolor?]

■ MANEJO PREVIO
[Reposo, hielo, fisioterapia previa, médico deportivo, imágenes (Rx/RM/eco), infiltraciones, cirugía]

■ RECUPERACIÓN Y ESTILO DE VIDA
[Horas de sueño, calidad, estrés, nutrición (déficit calórico, timing), hidratación, cargas de competencia acumuladas]

■ CREENCIAS Y PRESIÓN EXTERNA
[¿Qué cree que tiene? ¿Teme relesionar? ¿Hay presión del entrenador/selección para volver? ¿Identidad deportiva (el deporte es central en su vida)?]

■ OBJETIVO DE RETORNO
[¿Qué nivel quiere recuperar? ¿En qué plazo? ¿Hay una fecha objetivo (torneo, selección, contrato)?]

■ SEGURIDAD CLÍNICA
[Pérdida de consciencia, signos de fractura (deformidad, impotencia funcional total), signos vasculares/neurológicos, fiebre, pérdida de peso]

■ NOTAS RELEVANTES
[Información que no calza en los campos anteriores]`,
};

const PLANTILLAS_ANAMNESIS_REMOTA: Record<AreaClinica, string> = {
pisoPelvico: `■ ANTECEDENTES MÉDICOS
[Condiciones crónicas: diabetes, patología tiroidea, esclerosis múltiple, Parkinson, conectivopatías (síndrome de hiperlaxitud ligamentaria), otros]

■ ANTECEDENTES GINECOLÓGICOS-OBSTÉTRICOS
[Número de embarazos/partos/abortos. Tipo de parto. Trauma perineal. Recién nacido macrosómico. Uso de fórceps/ventosa. Tiempo de expulsivo.]

■ CIRUGÍAS PREVIAS PÉLVICAS/ABDOMINALES
[Histerectomía, colporrafia anterior/posterior, TOT/TVT, cesárea, laparoscopia, apendicectomía, cirugía colorrectal — fecha y resultado]

■ ESTADO HORMONAL ACTUAL
[Menopáusica (cuántos años), perimenopausia, HRT/TRH (tipo, dosis), anticonceptivos, sequedad vaginal, atrofia genitourinaria]

■ MEDICAMENTOS Y PRECAUCIONES
[Diuréticos, anticolinérgicos, opioides (estreñimiento), alfa-bloqueantes, antidepresivos, AINEs crónicos, anticoagulantes, corticoides]

■ PESO E IMC
[Peso actual, cambio de peso reciente, sobrepeso (aumenta PIA), trayectoria nutricional]

■ ACTIVIDAD FÍSICA Y DEPORTE
[Tipo, frecuencia, impacto (alto/moderado/bajo), deporte con elevada PIA: halterofilia, CrossFit, atletismo, deportes de raqueta]

■ HÁBITOS INTESTINALES
[Frecuencia, consistencia (escala Bristol), esfuerzo defecatorio crónico, laxantes habituales, fibra y agua]

■ HISTORIA DE DOLOR PÉLVICO
[Endometriosis, vulvodinia, cistitis intersticial, síndrome de vejiga dolorosa, fibromialgia, SII, episodios previos]

■ HISTORIA PSICOSOCIAL RELEVANTE
[Historia de abuso/trauma sexual o físico, ansiedad/depresión, imagen corporal, relación con el cuerpo]

■ RED DE APOYO
[Pareja, cuidadora de hijos/terceros, aislamiento, tiempo disponible para tratamiento, contexto económico]

■ NOTAS RELEVANTES
[Información libre que no calza en los campos anteriores]`,

msk: `■ ANTECEDENTES MÉDICOS
[Enfermedades relevantes, condiciones crónicas, cardiovasculares, metabólicas, reumatológicas, neurológicas, hormonales u otras]

■ ANTECEDENTES MUSCULOESQUELÉTICOS
[Lesiones previas, dolores recurrentes, cirugías, fracturas, esguinces, luxaciones, episodios similares]

■ MEDICAMENTOS Y PRECAUCIONES
[Anticoagulantes, corticoides, analgésicos, AINEs, osteoporosis, embarazo, prótesis, hiperlaxitud]

■ EXÁMENES / IMÁGENES / DIAGNÓSTICOS PREVIOS
[Rx, RM, ecografía, TAC, laboratorio, diagnóstico médico previo, fecha y relevancia actual]

■ HISTORIA DE TRATAMIENTOS
[Qué tratamientos tuvo, qué funcionó, qué no funcionó, adherencia, experiencias negativas]

■ PERFIL DE ACTIVIDAD FÍSICA
[Deporte, frecuencia, volumen, intensidad, años de práctica, nivel, cambios recientes]

■ CONTEXTO LABORAL
[Tipo de trabajo, posturas, carga física, horas, turnos, pausas, estrés laboral, licencia]

■ SUEÑO Y RECUPERACIÓN
[Horas, calidad, despertares, fatiga, recuperación percibida]

■ ESTADO EMOCIONAL Y ESTRÉS
[Estrés sostenido, ansiedad, ánimo bajo, frustración, eventos vitales relevantes]

■ CONTEXTO SOCIAL Y APOYO
[Con quién vive, apoyo familiar, barreras de tiempo/económicas, transporte]

■ NOTAS RELEVANTES
[Información libre que no calza en los campos anteriores]`,

deportiva: `■ ANTECEDENTES DE LESIONES PREVIAS
[Lesiones anteriores en el mismo segmento o relacionadas, tratamiento recibido, tiempo de recuperación, si el retorno fue completo]

■ HISTORIAL DE LESIONES RECURRENTES
[¿Ha tenido la misma lesión más de una vez? ¿Con qué frecuencia? ¿Factores que precipitaron recaídas?]

■ CIRUGÍAS PREVIAS
[Artroscopia, LCA, meniscectomía, reparaciones tendinosas u otras — fecha, resultado, rehabilitación recibida]

■ ANTECEDENTES MÉDICOS RELEVANTES
[Condiciones que afectan recuperación: diabetes, patología tiroidea, anemia, síndrome de hiperlaxitud, trastornos del sueño]

■ MEDICAMENTOS Y SUPLEMENTOS
[AINEs crónicos, corticoides, anticoagulantes, suplementos de recuperación, creatina, beta-bloqueantes]

■ EXÁMENES E IMÁGENES
[Rx, RM, eco musculotendinosa, TAC — fecha, hallazgos, correlación clínica]

■ PERFIL DE ENTRENAMIENTO CRÓNICO
[Años de práctica del deporte, volumen habitual (horas/semana), periodos de pausa o baja de carga previos]

■ HISTORIAL DE CARGA RECIENTE (4-12 semanas previas)
[Cambios de volumen, intensidad, superficie, calzado, metodología de entrenamiento, bloque de alta demanda]

■ RECUPERACIÓN Y ESTILO DE VIDA
[Sueño (horas y calidad), nutrición (energía disponible, proteínas), hidratación, alcohol, tabaco, suplementos]

■ ESTRÉS PSICOLÓGICO Y CONTEXTO VITAL
[Estrés académico/laboral/relacional, eventos vitales, salud mental, burnout deportivo]

■ HISTORIA DE SOBREENTRENAMIENTO
[Síndrome de sobreentrenamiento previo: fatiga persistente, rendimiento estancado, infecciones frecuentes, irritabilidad]

■ RED DE APOYO DEPORTIVO
[Entrenador, kinesiólogo de club, médico deportivo, nutricionista — acceso y comunicación]

■ NOTAS RELEVANTES
[Información que no calza en los campos anteriores]`,
};

const PLANTILLAS_EVALUACION_FISICA: Record<AreaClinica, string> = {
pisoPelvico: `■ SÍNTOMA BASE PREVIO A LA EVALUACIÓN
[Dolor/síntoma actual pre-evaluación: EVA/NRS __/10, fatiga perineal, urgencia, confort — irritabilidad antes de evaluar]

■ OBSERVACIÓN GENERAL Y POSTURA
[Postura lumbopélvica, lordosis lumbar, retroversión pélvica, protrusión abdominal, cicatrices perineales visibles, edema, coloración]

■ EVALUACIÓN RESPIRATORIA Y SINERGIA LCA
[Patrón respiratorio (costal/diafragmático/mixto), estrategia expiratoria, capacidad de activar transversus abdominis sin apnea, coordinación SP-diafragma-TAIs]

■ DIASTASIS DEL RECTO ABDOMINAL (DRA)
[Presencia: Sí / No / No evaluada. IRD (Inter-Recti Distance) en cm a nivel umbilical: __ cm. IRD sobre ombligo: __ cm. Bajo ombligo: __ cm. Profundidad: __ cm. Signo de manguera de jardín: positivo/negativo. Linea alba: firme/laxa/ausente]

■ FUNCIÓN DEL SUELO PÉLVICO — ESCALA OXFORD MODIFICADA
[Escala Oxford (0-5): __ . Descripción: 0=sin contracción, 1=centelleo, 2=débil sin elevación, 3=moderada con elevación, 4=buena resistencia, 5=fuerte contracción bilateral]

■ PERFECT SCHEME (si aplica)
[P (Power/Oxford): __ / E (Endurance en segundos): __ / R (Repetitions al 100%): __ / F (Fast contractions): __ / ECT (Every Contraction Timed): completado / No completado]

■ TONO EN REPOSO Y RELAX ACTIVO
[Hipertonía / Normotonía / Hipotonía. Capacidad de relax activo (descenso consciente del SP): preservada/disminuida/ausente. Trigger points miofasciales: presentes/ausentes/localización]

■ HIATO UROGENITAL Y POP (si corresponde)
[Hiato: pequeño/medio/grande. POP-Q estadio (si evaluado): __ . Tipo predominante: cistocele/rectocele/uterovaginal/apical]

■ EVALUACIÓN FUNCIONAL BAJO CARGA (PIA AUMENTADA)
[Test de tos: positivo/negativo. Test de salto monopodal: positivo/negativo (fuga). Sentadilla con carga: __ kg sin síntoma. Running (si aplica): velocidad/tiempo antes de síntoma]

■ PAD TEST (si aplica)
[1-hora o 24-hora. Resultado: __ gramos. Interpretación: leve/moderado/grave]

■ EVALUACIÓN LUMBOPÉLVICA COMPLEMENTARIA
[Movilidad lumbar: ROM, dolor al movimiento. Cadera: ROM, fuerza aductores/abductores/glúteo mayor (MMT: __/5). Test de Trendelenburg: positivo/negativo. Control de carga lumbopélvica en sentadilla/peso muerto]

■ SCREENING NEUROLÓGICO
[Sensibilidad perineal, reflejo bulbocavernoso (si aplica), reflejo anal (si aplica), signos de afectación de cono medular/cola de caballo]

■ EVALUACIÓN DEL DOLOR (si aplica)
[Mapeo de dolor: localización, provocación, intensidad (NRS __/10). Dolor a la palpación: localización, intensidad. Dispareunia (superficial/profunda, NRS). Test Q-tip (si aplica).]

■ ESCALAS FUNCIONALES APLICADAS
[PSFS: _/10 para actividad: __ . ICIQ-UI-SF: __ / 21. Otras escalas aplicadas: __]

■ RESPUESTA POST EVALUACIÓN
[Cambio del síntoma después de la evaluación: igual/mejor/peor. Irritabilidad posterior. Tolerancia general a la evaluación]

■ HALLAZGOS PRINCIPALES
[Hallazgos que sí explican el problema. Hallazgos que no calzan o generan duda. Qué falta evaluar.]`,

msk: `■ SÍNTOMA BASE PREVIO
[Dolor/síntoma actual, intensidad NRS __/10, fatiga, confianza, irritabilidad antes de evaluar]

■ OBSERVACIÓN GENERAL
[Postura, marcha, protección, actitud frente al movimiento, asimetrías, edema, coloración, cicatrices, atrofia]

■ TAREA FUNCIONAL PRINCIPAL
[Sentarse/pararse, caminar, escaleras, agacharse, levantar carga, correr, saltar, gesto laboral relevante]

■ MOVIMIENTO ACTIVO
[Rango (°), calidad, dolor, rigidez, compensaciones, miedo, control, reproducción del síntoma]

■ MOVIMIENTO PASIVO
[Rango (°), dolor, resistencia, sensación terminal, diferencia lado a lado]

■ MOVIMIENTOS REPETIDOS / SOSTENIDOS
[Respuesta con repetición, centralización/periferización si aplica, fatiga, recuperación]

■ FUERZA ISOMÉTRICA
[Músculo/gesto, ángulo, dolor, fuerza (MMT: __/5 o dinamometría: __ kg), inhibición, asimetría]

■ FUERZA DINÁMICA / CAPACIDAD
[Carga, repeticiones, control, velocidad, fatiga, dolor durante/después]

■ CONTROL MOTOR
[Coordinación, estrategia, rigidez protectora, control lumbopélvico/escapular/cadera/rodilla/pie]

■ PALPACIÓN / SENSIBILIDAD
[Zona sensible, temperatura, edema, tono, dolor a presión, sensibilidad local/difusa]

■ SCREENING NEUROLÓGICO
[Sensibilidad por dermatomas, fuerza por miotomas, reflejos, coordinación, signos de déficit]

■ PRUEBAS NEURODINÁMICAS (si aplica)
[Test usado, respuesta, diferenciación estructural, lado a lado, reproducción del síntoma]

■ TESTS ORTOPÉDICOS / CLUSTERS
[Test usado, resultado, si reproduce el síntoma, impacto en toma de decisiones]

■ CONTRIBUYENTES REGIONALES
[Regiones vecinas que podrían influir: columna, cadera, tobillo, tórax, hombro, cuello]

■ MEDIDAS DE RESULTADO
[PSFS __/10 para actividad: __ . NRS/EVA: __ . LEFS/QuickDASH/NDI/ODI/KOOS: __ ]

■ RESPUESTA POST EVALUACIÓN
[Cambio del síntoma, fatiga, irritabilidad posterior, tolerancia general, signos de alerta]

■ HALLAZGOS PRINCIPALES
[Qué hallazgos explican el problema, qué no calza, qué falta evaluar]`,

deportiva: `■ SÍNTOMA BASE PREVIO A LA EVALUACIÓN
[Dolor/síntoma actual antes de comenzar: NRS __/10. Calor local, hinchazón, rigidez residual. Irritabilidad pre-evaluación.]

■ OBSERVACIÓN GENERAL Y FUNCIÓN DEPORTIVA
[Marcha, trote si aplica, postura en set deportivo, patrones de movimiento compensatorios, actitud kinesiofóbica]

■ TAREA FUNCIONAL PRINCIPAL Y GESTO DEPORTIVO
[Gesto más limitante: ___ . Reproducción del síntoma: sí/no. Compensación observada: ___]

■ MOVIMIENTO ACTIVO
[ROM activo de articulación/segmento afectado: __° (lado afecto) vs __° (lado sano). Dolor: NRS __/10. Compensaciones. Calidad del movimiento.]

■ MOVIMIENTO PASIVO
[ROM pasivo: __°. Sensación terminal (suave/duro/vacío/espasmo). Dolor: NRS __/10. Diferencia bilateral.]

■ FUERZA E ISOMETRÍA
[MMT: __/5. Dinamometría si disponible: __ kg. Ángulo de evaluación. Dolor con isometría (NILF positivo/negativo). Inhibición.]

■ FUERZA CONCÉNTRICA / EXCÉNTRICA
[Prueba de fuerza funcional: tipo, carga, repeticiones, compensación, dolor. Ratio excéntrico:concéntrico estimado. Asimetría bilateral.]

■ TESTS DE SALTO / HOP TESTS (si aplica)
[SLH (Single Leg Hop): lado afecto __ cm / lado sano __ cm. LSI: __%. Triple Hop, Cross-over Hop, Timed 6m Hop: resultados. Criterio de RTS: LSI ≥90%]

■ SENTADILLA MONOPODAL (SL SQUAT)
[Calidad: buena/moderada/pobre. Valgus dinámico: presente/ausente. Dolor: NRS __/10. Compensaciones observadas.]

■ PRUEBA DE CARRERA / AGILIDAD (si aplica)
[Velocidad tolerada sin síntoma: __ km/h o __ min/km. Tiempo hasta aparición: __ min. Reactive agility test: completado/no. Resultado.]

■ PRUEBA DE GESTO DEPORTIVO ESPECÍFICO
[Gesto evaluado: ___. Resultado: sin dolor / con dolor NRS __/10 / limitación técnica / compensación. Reproducción del síntoma: sí/no.]

■ PALPACIÓN
[Zona sensible: localización exacta, temperatura, edema (presente/ausente), punto máximo de dolor, reproducción del síntoma con palpación.]

■ TESTS ORTOPÉDICOS/CLÚSTERES ESPECÍFICOS (según hipótesis)
[Test usado: ___ . Resultado: positivo/negativo. Reproducción del síntoma: sí/no. Impacto en toma de decisiones.]

■ SCREENING NEUROLÓGICO
[Sensibilidad, miotomas, reflejos. Signos de compromiso neurológico periférico. Neurodinamia si aplica.]

■ MEDIDAS DE RESULTADO DEPORTIVAS
[PSFS __/10 para: ___. NRS/EVA: __. KOOS-Sport: __. FAAM: __. VISA-A/P: __ (tendón). Otras: ___]

■ RESPUESTA POST EVALUACIÓN
[Cambio del síntoma post evaluación: igual/mejor/peor. Dolor post-ejercicio (24-48h). Irritabilidad. Signos de alarma.]

■ HALLAZGOS PRINCIPALES Y PENDIENTES
[Hallazgos que explican el problema. Qué no calza. Tests funcionales deportivos pendientes para RTS.]`,
};

// ─── BEAUTIFUL CLINICAL MARKDOWN ─────────────────────────────────────────────
function BeautifulClinicalMarkdown({ text }: { text: string }) {
    if (!text) return null;
    const sections: { title: string; contentLines: string[] }[] = [];
    let currentSection: { title: string; contentLines: string[] } | null = null;
    text.split('\n').forEach(line => {
        if (line.startsWith('## ')) {
            currentSection = { title: line.replace('## ', '').trim(), contentLines: [] };
            sections.push(currentSection);
        } else if (currentSection) {
            currentSection.contentLines.push(line);
        } else if (line.trim()) {
            currentSection = { title: 'Orientación General', contentLines: [line] };
            sections.push(currentSection);
        }
    });

    const getBorderColor = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('seguridad') || t.includes('banderas')) return 'border-t-amber-500';
        if (t.includes('fenotipo')) return 'border-t-indigo-600';
        if (t.includes('hipótesis') || t.includes('diagnos') || t.includes('diferenciales')) return 'border-t-purple-600';
        if (t.includes('contribuyentes') || t.includes('regionales') || t.includes('sistémicos')) return 'border-t-teal-600';
        if (t.includes('plan') || t.includes('indicadores')) return 'border-t-emerald-600';
        if (t.includes('resumen')) return 'border-t-blue-500';
        if (t.includes('problema kinésico')) return 'border-t-rose-500';
        if (t.includes('factores') || t.includes('biopsicosocial') || t.includes('influyentes')) return 'border-t-orange-500';
        if (t.includes('defensa')) return 'border-t-slate-500';
        return 'border-t-slate-400';
    };

    return (
        <div className="space-y-6 text-slate-700">
            {sections.map((sec, sIdx) => (
                <div key={sIdx} className={`bg-white rounded-2xl shadow-xs border border-slate-200/60 overflow-hidden border-t-4 ${getBorderColor(sec.title)}`}>
                    <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{sec.title}</h3>
                    </div>
                    <div className="p-5">
                        <div className="mt-1 text-slate-700 leading-relaxed space-y-2">
                            {sec.contentLines.map((line, idx) => {
                                const t = line.trim();
                                if (!t) return <div key={idx} className="h-1" />;
                                if (t.startsWith('### ')) return <h4 key={idx} className="text-xs font-black text-slate-900 mt-4 mb-2 uppercase tracking-wider border-b border-slate-100 pb-1">{t.replace('### ', '')}</h4>;
                                if (t.match(/^[0-9]+\./)) {
                                    const m = t.match(/^([0-9]+\.)(.*)/);
                                    return <div key={idx} className="flex gap-2 mt-3 mb-1 items-start"><span className="bg-slate-200 text-slate-800 font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5">{m?.[1]}</span><span className="text-xs font-bold text-slate-800">{m?.[2]?.trim()}</span></div>;
                                }
                                if (t.startsWith('- Corto Plazo')) return <div key={idx} className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 my-2"><span className="font-black text-emerald-800 block text-[10px] uppercase mb-1">Corto Plazo</span><span className="text-slate-700 text-xs font-medium leading-relaxed">{t.replace(/^- Corto Plazo[^:]*:/, '').trim()}</span></div>;
                                if (t.startsWith('- Mediano Plazo')) return <div key={idx} className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 my-2"><span className="font-black text-blue-800 block text-[10px] uppercase mb-1">Mediano Plazo</span><span className="text-slate-700 text-xs font-medium leading-relaxed">{t.replace(/^- Mediano Plazo[^:]*:/, '').trim()}</span></div>;
                                if (t.startsWith('- Fundamento:') || t.startsWith('- Justificación:')) {
                                    const m = t.match(/^- (Fundamento:|Justificación:)(.*)/);
                                    return <div key={idx} className="ml-4 pl-3 border-l-2 border-indigo-400 text-xs text-slate-600 py-1 my-1 bg-slate-50/50 rounded-r font-medium"><strong className="text-slate-700">{m?.[1]} </strong>{m?.[2]?.trim()}</div>;
                                }
                                if (t.startsWith('- ')) return <div key={idx} className="flex gap-2 mb-1 ml-1 text-xs items-start"><span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-2"></span><span className="text-slate-600 font-medium">{t.replace(/^- /, '')}</span></div>;
                                return <p key={idx} className="text-xs text-slate-700 mb-1 leading-relaxed font-medium">{line}</p>;
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── AUTO TEXTAREA ─────────────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className, minRows = 3 }: any) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = Math.max(ref.current.scrollHeight, minRows * 24) + 'px';
        }
    }, [value, minRows]);
    return <textarea ref={ref} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed overflow-hidden ${className || ''}`} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

// ─── CLINICAL PLANNING SECTION (P3/P4) ───────────────────────────────────────
function ClinicalPlanningSection({ area, clasificacionDolor, setClasificacionDolor, diagnosticoNarrativo, setDiagnosticoNarrativo, objetivoGeneral, setObjetivoGeneral, objetivosSmart, setObjetivosSmart, pronostico, setPronostico, fases, setFases, reglasReeval, setReglasReeval, collapsed, setCollapsed, razonamientoIA, anamnesisProxima, anamnesisRemota, evaluacionFisica }: any) {
    const [isGenerating, setIsGenerating] = useState(false);
    const toggle = useCallback((id: string) => setCollapsed((prev: any) => ({ ...prev, [id]: !prev[id] })), [setCollapsed]);
    const isC = (id: string) => collapsed[id] !== false;
    const addSmart = () => setObjetivosSmart([...objetivosSmart, { id: genId(), texto: '' }]);
    const removeSmart = (id: string) => setObjetivosSmart(objetivosSmart.filter((o: any) => o.id !== id));
    const addFase = () => setFases([...fases, { fase: fases.length + 1, nombre: `Fase ${fases.length + 1}: Nueva Fase`, duracion_estimada: '', objetivos_operacionales: [], intervenciones: [], criterios_progresion: [] }]);
    const removeFase = (idx: number) => setFases(fases.filter((_: any, i: number) => i !== idx));

    const SYSTEM_P4 = `Eres un kinesiólogo experto. Genera un plan clínico completo en formato JSON. El área de especialidad es: ${area === 'pisoPelvico' ? 'suelo pélvico / uroginecología funcional' : area === 'msk' ? 'kinesiología musculoesquelética' : 'kinesiología deportiva y retorno al deporte'}. DEBES responder ÚNICAMENTE con un JSON válido, sin markdown. Estructura: { "clasificacion_dolor": { "categoria": "string", "subtipo": "string", "fundamento": "string", "confianza": "string" }, "diagnostico_narrativo": "string", "objetivo_general": { "problema_principal": "string", "objetivo_general": "string" }, "objetivos_smart": [{"texto": "string"}], "pronostico": { "corto_plazo": "string", "mediano_plazo": "string", "largo_plazo": "string", "factores_a_favor": ["string"], "factores_en_contra": ["string"], "categoria": "string" }, "fases_rehabilitacion": [{ "fase": 1, "nombre": "string", "duracion_estimada": "string", "objetivos_operacionales": ["string"], "intervenciones": ["string"], "criterios_progresion": ["string"] }], "reglas_reevaluacion": { "metrica_subjetiva": "string", "metrica_objetiva": "string", "metrica_funcional_participacion": "string", "criterio_estancamiento": "string" } }`;

    const handleGenerateAi = async () => {
        if (!razonamientoIA && !anamnesisProxima) return alert('Primero genera el razonamiento con IA en la sección de arriba.');
        setIsGenerating(true);
        try {
            const userMsg = `Genera el plan clínico completo (P4) para este caso.\n\nANAMNESIS PRÓXIMA:\n${anamnesisProxima || ''}\n\nANAMNESIS REMOTA:\n${anamnesisRemota || ''}\n\nEVALUACIÓN FÍSICA:\n${evaluacionFisica || ''}\n\nRAZONAMIENTO IA PREVIO:\n${razonamientoIA || ''}\n\nDevuelve solo el JSON.`;
            const raw = await callGemini(SYSTEM_P4, userMsg, 'application/json');
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.clasificacion_dolor) setClasificacionDolor(parsed.clasificacion_dolor);
            if (parsed.diagnostico_narrativo) setDiagnosticoNarrativo(parsed.diagnostico_narrativo);
            if (parsed.objetivo_general) setObjetivoGeneral(parsed.objetivo_general);
            if (parsed.objetivos_smart) setObjetivosSmart(parsed.objetivos_smart.map((o: any) => ({ ...o, id: genId() })));
            if (parsed.pronostico) setPronostico(parsed.pronostico);
            if (parsed.fases_rehabilitacion) setFases(parsed.fases_rehabilitacion);
            if (parsed.reglas_reevaluacion) setReglasReeval(parsed.reglas_reevaluacion);
        } catch (e: any) {
            alert('Error generando plan: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const SectionBox = ({ id, title, icon, children }: any) => (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button onClick={() => toggle(id)} className="w-full flex justify-between items-center px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-700 text-sm flex items-center gap-2"><span>{icon}</span>{title}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isC(id) ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {!isC(id) && <div className="p-5 space-y-4 bg-white">{children}</div>}
        </div>
    );

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 text-lg">Diagnóstico y Plan Clínico</h3>
                <button onClick={handleGenerateAi} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                    {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</> : <><span>✨</span> Generar con IA</>}
                </button>
            </div>

            <div className="space-y-3">
                {/* Clasificación Dolor */}
                <SectionBox id="dolor" title="Clasificación del Dolor / Disfunción" icon="🎯">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Categoría</label><input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={clasificacionDolor?.categoria || ''} onChange={e => setClasificacionDolor({ ...clasificacionDolor, categoria: e.target.value })} placeholder="Nociceptivo / Neuropático / Nociplástico / Mixto" /></div>
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Confianza</label><select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={clasificacionDolor?.confianza || ''} onChange={e => setClasificacionDolor({ ...clasificacionDolor, confianza: e.target.value })}><option value="">—</option><option>Alta</option><option>Moderada</option><option>Baja</option></select></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 block mb-1">Fundamento clínico</label><AutoTextarea value={clasificacionDolor?.fundamento || ''} onChange={(v: string) => setClasificacionDolor({ ...clasificacionDolor, fundamento: v })} placeholder="Fundamento del fenotipo..." /></div>
                </SectionBox>

                {/* Diagnóstico Narrativo */}
                <SectionBox id="diag" title="Diagnóstico Kinesiológico Narrativo" icon="📋">
                    <AutoTextarea value={diagnosticoNarrativo} onChange={setDiagnosticoNarrativo} placeholder="Diagnóstico funcional narrativo con estructura CIF..." minRows={4} />
                </SectionBox>

                {/* Objetivo General */}
                <SectionBox id="obj" title="Objetivo General" icon="🎯">
                    <div><label className="text-xs font-bold text-slate-500 block mb-1">Problema Principal</label><AutoTextarea value={objetivoGeneral?.problema_principal || ''} onChange={(v: string) => setObjetivoGeneral({ ...objetivoGeneral, problema_principal: v })} placeholder="Problema principal identificado..." /></div>
                    <div><label className="text-xs font-bold text-slate-500 block mb-1">Objetivo Maestro</label><AutoTextarea value={objetivoGeneral?.objetivo_general || ''} onChange={(v: string) => setObjetivoGeneral({ ...objetivoGeneral, objetivo_general: v })} placeholder="Objetivo maestro del proceso de rehabilitación..." /></div>
                </SectionBox>

                {/* Objetivos SMART */}
                <SectionBox id="smart" title="Objetivos SMART" icon="✅">
                    {objetivosSmart.map((o: any) => (
                        <div key={o.id} className="flex gap-2 items-start">
                            <AutoTextarea value={o.texto} onChange={(v: string) => setObjetivosSmart(objetivosSmart.map((x: any) => x.id === o.id ? { ...x, texto: v } : x))} placeholder="Objetivo SMART específico..." minRows={2} />
                            <button onClick={() => removeSmart(o.id)} className="p-2 text-slate-400 hover:text-red-500 shrink-0">✕</button>
                        </div>
                    ))}
                    <button onClick={addSmart} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">+ Agregar objetivo</button>
                </SectionBox>

                {/* Pronóstico */}
                <SectionBox id="prog" title="Pronóstico Biopsicosocial" icon="📈">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="text-xs font-bold text-emerald-600 block mb-1">Corto Plazo</label><AutoTextarea value={pronostico?.corto_plazo || ''} onChange={(v: string) => setPronostico({ ...pronostico, corto_plazo: v })} placeholder="1-3 sesiones..." /></div>
                        <div><label className="text-xs font-bold text-blue-600 block mb-1">Mediano Plazo</label><AutoTextarea value={pronostico?.mediano_plazo || ''} onChange={(v: string) => setPronostico({ ...pronostico, mediano_plazo: v })} placeholder="3-6 semanas..." /></div>
                        <div><label className="text-xs font-bold text-purple-600 block mb-1">Largo Plazo</label><AutoTextarea value={pronostico?.largo_plazo || ''} onChange={(v: string) => setPronostico({ ...pronostico, largo_plazo: v })} placeholder="3-6 meses..." /></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 block mb-1">Categoría pronóstica</label><input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={pronostico?.categoria || ''} onChange={e => setPronostico({ ...pronostico, categoria: e.target.value })} placeholder="Bueno / Reservado / Incierto..." /></div>
                </SectionBox>

                {/* Fases de Rehabilitación */}
                <SectionBox id="fases" title="Plan Maestro — Fases de Rehabilitación" icon="📅">
                    {fases.map((f: any, i: number) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-700 text-sm">{f.nombre || `Fase ${i + 1}`}</span>
                                <button onClick={() => removeFase(i)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs font-bold text-slate-500 block mb-1">Nombre</label><input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" value={f.nombre || ''} onChange={e => setFases(fases.map((x: any, j: number) => j === i ? { ...x, nombre: e.target.value } : x))} /></div>
                                <div><label className="text-xs font-bold text-slate-500 block mb-1">Duración estimada</label><input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" value={f.duracion_estimada || ''} onChange={e => setFases(fases.map((x: any, j: number) => j === i ? { ...x, duracion_estimada: e.target.value } : x))} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 block mb-1">Intervenciones</label><AutoTextarea value={(f.intervenciones || []).join('\n')} onChange={(v: string) => setFases(fases.map((x: any, j: number) => j === i ? { ...x, intervenciones: v.split('\n').filter(Boolean) } : x))} placeholder="Una intervención por línea..." minRows={2} /></div>
                            <div><label className="text-xs font-bold text-slate-500 block mb-1">Criterios de progresión</label><AutoTextarea value={(f.criterios_progresion || []).join('\n')} onChange={(v: string) => setFases(fases.map((x: any, j: number) => j === i ? { ...x, criterios_progresion: v.split('\n').filter(Boolean) } : x))} placeholder="Un criterio por línea..." minRows={2} /></div>
                        </div>
                    ))}
                    <button onClick={addFase} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">+ Agregar fase</button>
                </SectionBox>

                {/* Reglas de Reevaluación */}
                <SectionBox id="reeval" title="Reglas de Reevaluación" icon="🔄">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Métrica subjetiva (PSFS, NRS)</label><AutoTextarea value={reglasReeval?.metrica_subjetiva || ''} onChange={(v: string) => setReglasReeval({ ...reglasReeval, metrica_subjetiva: v })} placeholder="Ej: NRS ≤3/10 en actividad limitante..." /></div>
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Métrica objetiva (fuerza, ROM, test)</label><AutoTextarea value={reglasReeval?.metrica_objetiva || ''} onChange={(v: string) => setReglasReeval({ ...reglasReeval, metrica_objetiva: v })} placeholder="Ej: Oxford ≥4/5, LSI ≥90%..." /></div>
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Métrica funcional / participación</label><AutoTextarea value={reglasReeval?.metrica_funcional_participacion || ''} onChange={(v: string) => setReglasReeval({ ...reglasReeval, metrica_funcional_participacion: v })} placeholder="Ej: Retorno sin síntomas a actividad relevante..." /></div>
                        <div><label className="text-xs font-bold text-slate-500 block mb-1">Criterio de estancamiento</label><AutoTextarea value={reglasReeval?.criterio_estancamiento || ''} onChange={(v: string) => setReglasReeval({ ...reglasReeval, criterio_estancamiento: v })} placeholder="Ej: Sin cambio en 2 sesiones consecutivas..." /></div>
                    </div>
                </SectionBox>
            </div>
        </div>
    );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function EvaluacionExpressV2Page() {
    const user = auth.currentUser;
    const { patientId } = useParams<{ patientId?: string }>();
    const navigate = useNavigate();
    const [patientName, setPatientName] = useState('');

    // Load patient name if patientId is provided
    useEffect(() => {
        if (!patientId) return;
        getDoc(doc(db, 'patients', patientId)).then(snap => {
            if (snap.exists()) {
                const d = snap.data() as any;
                setPatientName(`${d.firstName || ''} ${d.lastName || ''}`.trim());
            }
        }).catch(() => {});
    }, [patientId]);

    // ─── ÁREA CLÍNICA ─────────────────────────────────────────────────────────
    const [area, setArea] = useState<AreaClinica>('pisoPelvico');
    const [patientContext, setPatientContext] = useState('');

    // ─── APUNTES CLÍNICOS ─────────────────────────────────────────────────────
    const [anamnesisProxima, setAnamnesisProxima] = useState('');
    const [anamnesisRemota, setAnamnesisRemota] = useState('');
    const [evaluacionFisica, setEvaluacionFisica] = useState('');
    const [razonamientoIA, setRazonamientoIA] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isEditingIA, setIsEditingIA] = useState(false);

    // ─── FULLSCREEN ───────────────────────────────────────────────────────────
    const [activeFullscreen, setActiveFullscreen] = useState<'anamnesisProxima' | 'anamnesisRemota' | 'evaluacionFisica' | 'razonamientoIA' | null>(null);
    const [showHelp, setShowHelp] = useState<'anamnesisProxima' | 'anamnesisRemota' | 'evaluacionFisica' | null>(null);

    // ─── P4 STATE ─────────────────────────────────────────────────────────────
    const [clasificacionDolor, setClasificacionDolor] = useState<any>({ categoria: '', subtipo: '', fundamento: '', confianza: '' });
    const [diagnosticoNarrativo, setDiagnosticoNarrativo] = useState('');
    const [objetivoGeneral, setObjetivoGeneral] = useState<any>({ problema_principal: '', objetivo_general: '' });
    const [objetivosSmart, setObjetivosSmart] = useState<any[]>([]);
    const [pronostico, setPronostico] = useState<any>({ corto_plazo: '', mediano_plazo: '', largo_plazo: '', factores_a_favor: [], factores_en_contra: [], categoria: '' });
    const [fases, setFases] = useState<any[]>([]);
    const [reglasReeval, setReglasReeval] = useState<any>({ metrica_subjetiva: '', metrica_objetiva: '', metrica_funcional_participacion: '', criterio_estancamiento: '' });
    const [p4Collapsed, setP4Collapsed] = useState<Record<string, boolean>>({});

    // ─── SAVE STATE ───────────────────────────────────────────────────────────
    const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Auto-reset AI output when area changes
    const handleAreaChange = (newArea: AreaClinica) => {
        setArea(newArea);
        setAnamnesisProxima('');
        setAnamnesisRemota('');
        setEvaluacionFisica('');
        setRazonamientoIA('');
    };

    const handleInsertTemplate = (type: 'anamnesisProxima' | 'anamnesisRemota' | 'evaluacionFisica') => {
        const templates = { anamnesisProxima: PLANTILLAS_ANAMNESIS_PROXIMA[area], anamnesisRemota: PLANTILLAS_ANAMNESIS_REMOTA[area], evaluacionFisica: PLANTILLAS_EVALUACION_FISICA[area] };
        const t = templates[type];
        if (type === 'anamnesisProxima') setAnamnesisProxima(prev => prev ? prev + '\n\n' + t : t);
        else if (type === 'anamnesisRemota') setAnamnesisRemota(prev => prev ? prev + '\n\n' + t : t);
        else setEvaluacionFisica(prev => prev ? prev + '\n\n' + t : t);
    };

    const handleRazonarIA = async () => {
        if (!anamnesisProxima && !anamnesisRemota && !evaluacionFisica) return alert('Escribe algo primero en las notas clínicas.');
        setIsAiProcessing(true);
        try {
            const areaLabel = AREAS.find(a => a.id === area)?.label || area;
            const userMsg = `ÁREA CLÍNICA: ${areaLabel}\n\n${patientContext ? `CONTEXTO DEL PACIENTE: ${patientContext}\n\n` : ''}ANAMNESIS PRÓXIMA:\n${anamnesisProxima || '(no registrada)'}\n\nANAMNESIS REMOTA / CONTEXTO:\n${anamnesisRemota || '(no registrada)'}\n\nEVALUACIÓN FÍSICA:\n${evaluacionFisica || '(no registrada)'}\n\nGenera el análisis clínico completo con los encabezados indicados.`;
            const result = await callGemini(SYSTEM_PROMPTS[area], userMsg);
            setRazonamientoIA(result);
        } catch (e: any) {
            alert('Error procesando IA: ' + e.message);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!user) return alert('Debes estar autenticado para guardar.');
        setSavingState('saving');
        try {
            const docId = genId();
            await setDoc(doc(db, 'evaluaciones_express_v2', docId), {
                userId: user.uid,
                ...(patientId ? { patientId } : {}),
                area,
                patientContext: patientName || patientContext,
                anamnesisProxima,
                anamnesisRemota,
                evaluacionFisica,
                razonamientoIA,
                p4: { clasificacionDolor, diagnosticoNarrativo, objetivoGeneral, objetivosSmart, pronostico, fases, reglasReeval },
                createdAt: new Date().toISOString(),
            });
            setSavingState('saved');
            setTimeout(() => setSavingState('idle'), 2500);
        } catch (e: any) {
            alert('Error al guardar: ' + e.message);
            setSavingState('idle');
        }
    };

    const areaConfig = AREAS.find(a => a.id === area)!;

    // ─── FULLSCREEN OVERLAY ───────────────────────────────────────────────────
    if (activeFullscreen) {
        const labels: Record<string, string> = { anamnesisProxima: '💬 Anamnesis Próxima', anamnesisRemota: '📚 Anamnesis Remota / Contexto', evaluacionFisica: '🩺 Evaluación Física', razonamientoIA: '🤖 Razonamiento sugerido por IA' };
        const currentValue = activeFullscreen === 'anamnesisProxima' ? anamnesisProxima : activeFullscreen === 'anamnesisRemota' ? anamnesisRemota : activeFullscreen === 'evaluacionFisica' ? evaluacionFisica : razonamientoIA;
        const setCurrentValue = (v: string) => {
            if (activeFullscreen === 'anamnesisProxima') setAnamnesisProxima(v);
            else if (activeFullscreen === 'anamnesisRemota') setAnamnesisRemota(v);
            else if (activeFullscreen === 'evaluacionFisica') setEvaluacionFisica(v);
            else setRazonamientoIA(v);
        };
        return (
            <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in duration-150">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-black text-slate-800">{labels[activeFullscreen]}</h3>
                    <div className="flex items-center gap-2">
                        {activeFullscreen !== 'razonamientoIA' && (
                            <button onClick={() => handleInsertTemplate(activeFullscreen as any)} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs">📋 Plantilla</button>
                        )}
                        <button onClick={() => setActiveFullscreen(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm">Listo</button>
                    </div>
                </div>
                {activeFullscreen === 'razonamientoIA' ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
                        <div className="max-w-4xl mx-auto">
                            <BeautifulClinicalMarkdown text={razonamientoIA} />
                        </div>
                    </div>
                ) : (
                    <textarea autoFocus className="flex-1 w-full p-6 text-base resize-none focus:outline-none bg-white leading-relaxed text-slate-700" placeholder="Anota libremente..." value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
                )}
            </div>
        );
    }

    // ─── MAIN RENDER ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {patientId && (
                        <button onClick={() => navigate(`/users/${patientId}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Volver
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                            <span>⚡</span> Evaluación Inicial
                            {patientName && <span className="text-base font-semibold text-indigo-400">— {patientName}</span>}
                        </h2>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">Toma notas libres y deja que la IA razone las hipótesis.</p>
                    </div>
                </div>
                <button onClick={handleSave} disabled={savingState === 'saving'} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-1.5 ${savingState === 'saved' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700'}`}>
                    {savingState === 'saving' ? <><div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> Guardando...</> : savingState === 'saved' ? <><span>✅</span> Guardado</> : <><span>💾</span> Guardar</>}
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">

                {/* SELECTOR DE ÁREA */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider mb-4">Área clínica</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {AREAS.map(a => (
                            <button key={a.id} onClick={() => handleAreaChange(a.id)} className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 font-bold text-sm transition-all ${area === a.id ? `${a.color} border-current shadow-sm scale-[1.02]` : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                                <span className="text-2xl">{a.emoji}</span>
                                <span className="text-xs text-center leading-tight">{a.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Contexto rápido del paciente (opcional)</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder={`Ej: ${area === 'pisoPelvico' ? 'Mujer 42 años, 2 partos vaginales, IUE' : area === 'msk' ? 'Hombre 35 años, dolor lumbar crónico 3 meses' : 'Futbolista 22 años, esguince tobillo grado II'}`} value={patientContext} onChange={e => setPatientContext(e.target.value)} />
                    </div>
                </div>

                {/* APUNTES CLÍNICOS */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
                    <h3 className="font-black text-slate-800 text-lg mb-6 text-center">Apuntes Clínicos</h3>

                    <div className="space-y-6">
                        {/* Anamnesis Próxima */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <label className="font-bold text-slate-700 text-sm flex items-center gap-2"><span className="text-blue-500">💬</span> Anamnesis Próxima</label>
                                    <div className="relative">
                                        <button onClick={() => setShowHelp(showHelp === 'anamnesisProxima' ? null : 'anamnesisProxima')} className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center text-xs font-bold">?</button>
                                        {showHelp === 'anamnesisProxima' && (
                                            <div className="absolute z-50 mt-2 w-72 -left-4 p-4 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in">
                                                <strong className="text-white block mb-1 text-sm">💡 Tips:</strong>
                                                <p className="text-slate-300">{area === 'pisoPelvico' ? 'Registra síntoma principal (IUE/urgencia/pesadez), escala ICIQ, contexto obstétrico, comportamiento bajo carga.' : area === 'msk' ? 'Registra motivo de consulta, S.I.N.S.S, comportamiento 24h, mapa de dolor, agravantes/atenuantes.' : 'Registra deporte/nivel, mecanismo de lesión, ACWR, gesto limitante, objetivo de retorno.'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleInsertTemplate('anamnesisProxima')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1 px-3 rounded-lg flex items-center gap-1">📋 Plantilla</button>
                                    <button onClick={() => setActiveFullscreen('anamnesisProxima')} className="text-xs text-indigo-500 font-bold hover:text-indigo-700 md:hidden">⛶</button>
                                </div>
                            </div>
                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" placeholder={`Anota libremente la historia del paciente (${areaConfig.label})...`} rows={5} value={anamnesisProxima} onChange={e => setAnamnesisProxima(e.target.value)} onFocus={() => { if (window.innerWidth < 768) setActiveFullscreen('anamnesisProxima'); }} />
                        </div>

                        {/* Anamnesis Remota */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <label className="font-bold text-slate-700 text-sm flex items-center gap-2"><span className="text-purple-500">📚</span> Anamnesis Remota / Contexto</label>
                                    <div className="relative">
                                        <button onClick={() => setShowHelp(showHelp === 'anamnesisRemota' ? null : 'anamnesisRemota')} className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center text-xs font-bold">?</button>
                                        {showHelp === 'anamnesisRemota' && (
                                            <div className="absolute z-50 mt-2 w-72 -left-4 p-4 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in">
                                                <strong className="text-white block mb-1 text-sm">💡 Tips:</strong>
                                                <p className="text-slate-300">{area === 'pisoPelvico' ? 'Historia ginecológica/obstétrica, cirugías pélvicas, estado hormonal, medicamentos, actividad física de alto impacto.' : area === 'msk' ? 'Antecedentes médicos, lesiones previas, fármacos, nivel de actividad, sueño, estrés, red de apoyo.' : 'Lesiones anteriores, historial de carga, recuperación (sueño/nutrición), estrés psicológico, cirugías previas.'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleInsertTemplate('anamnesisRemota')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1 px-3 rounded-lg flex items-center gap-1">📋 Plantilla</button>
                                    <button onClick={() => setActiveFullscreen('anamnesisRemota')} className="text-xs text-purple-500 font-bold hover:text-purple-700 md:hidden">⛶</button>
                                </div>
                            </div>
                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-300 transition-all" placeholder="Antecedentes médicos, contexto de vida..." rows={4} value={anamnesisRemota} onChange={e => setAnamnesisRemota(e.target.value)} onFocus={() => { if (window.innerWidth < 768) setActiveFullscreen('anamnesisRemota'); }} />
                        </div>

                        {/* Evaluación Física */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <label className="font-bold text-slate-700 text-sm flex items-center gap-2"><span className="text-emerald-500">🩺</span> Evaluación Física</label>
                                    <div className="relative">
                                        <button onClick={() => setShowHelp(showHelp === 'evaluacionFisica' ? null : 'evaluacionFisica')} className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center text-xs font-bold">?</button>
                                        {showHelp === 'evaluacionFisica' && (
                                            <div className="absolute z-50 mt-2 w-72 -left-4 p-4 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in">
                                                <strong className="text-white block mb-1 text-sm">💡 Tips:</strong>
                                                <p className="text-slate-300">{area === 'pisoPelvico' ? 'Oxford/PERFECT, tono en reposo, hiato, DRA, test de tos/salto, evaluación lumbopélvica, escalas funcionales.' : area === 'msk' ? 'ROM activo/pasivo, fuerza (MMT/dinamometría), control motor, neurodinamia, tests ortopédicos, contribuyentes regionales.' : 'ROM, fuerza excéntrica/concéntrica, hop tests (LSI%), SL squat, gesto deportivo, tests específicos RTS.'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleInsertTemplate('evaluacionFisica')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1 px-3 rounded-lg flex items-center gap-1">📋 Plantilla</button>
                                    <button onClick={() => setActiveFullscreen('evaluacionFisica')} className="text-xs text-emerald-500 font-bold hover:text-emerald-700 md:hidden">⛶</button>
                                </div>
                            </div>
                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all" placeholder="Anota libremente tus hallazgos de evaluación..." rows={5} value={evaluacionFisica} onChange={e => setEvaluacionFisica(e.target.value)} onFocus={() => { if (window.innerWidth < 768) setActiveFullscreen('evaluacionFisica'); }} />
                        </div>
                    </div>

                    {/* BOTÓN IA */}
                    <div className="mt-8">
                        <button onClick={handleRazonarIA} disabled={isAiProcessing || (!anamnesisProxima && !anamnesisRemota && !evaluacionFisica)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none disabled:shadow-none">
                            {isAiProcessing ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Razonando con IA Clínica ({areaConfig.label})...</>
                            ) : (
                                <><span className="text-xl">{areaConfig.emoji}</span> Razonar con IA — {areaConfig.label}</>
                            )}
                        </button>
                    </div>

                    {/* RESULTADO IA */}
                    {razonamientoIA && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-indigo-900 text-lg flex items-center gap-2"><span className="text-indigo-500">🤖</span> Razonamiento sugerido por IA</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingIA(!isEditingIA)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs">{isEditingIA ? '👁️ Ver' : '✏️ Editar'}</button>
                                    <button onClick={() => setActiveFullscreen('razonamientoIA')} className="text-xs text-indigo-500 font-bold hover:text-indigo-700 md:hidden">Ampliar</button>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3 text-amber-800 text-sm">
                                <span className="text-xl">⚠️</span>
                                <p><strong>Aviso:</strong> El razonamiento de IA es solo una orientación clínica. Debe ser confirmado, ajustado o descartado por el profesional tratante. <strong>Podés editar este texto antes de guardar.</strong></p>
                            </div>
                            {isEditingIA ? (
                                <textarea className="w-full bg-white border border-indigo-200 rounded-2xl p-6 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 leading-relaxed text-slate-700" rows={20} value={razonamientoIA} onChange={e => setRazonamientoIA(e.target.value)} />
                            ) : (
                                <div className="w-full bg-slate-50/60 rounded-2xl p-4 md:p-5 text-sm max-h-[600px] overflow-y-auto border border-slate-100">
                                    <BeautifulClinicalMarkdown text={razonamientoIA} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* P3/P4 PLANNING */}
                <ClinicalPlanningSection
                    area={area}
                    clasificacionDolor={clasificacionDolor} setClasificacionDolor={setClasificacionDolor}
                    diagnosticoNarrativo={diagnosticoNarrativo} setDiagnosticoNarrativo={setDiagnosticoNarrativo}
                    objetivoGeneral={objetivoGeneral} setObjetivoGeneral={setObjetivoGeneral}
                    objetivosSmart={objetivosSmart} setObjetivosSmart={setObjetivosSmart}
                    pronostico={pronostico} setPronostico={setPronostico}
                    fases={fases} setFases={setFases}
                    reglasReeval={reglasReeval} setReglasReeval={setReglasReeval}
                    collapsed={p4Collapsed} setCollapsed={setP4Collapsed}
                    razonamientoIA={razonamientoIA}
                    anamnesisProxima={anamnesisProxima}
                    anamnesisRemota={anamnesisRemota}
                    evaluacionFisica={evaluacionFisica}
                />

            </div>
        </div>
    );
}
