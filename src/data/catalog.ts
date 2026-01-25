
export const ITEMS_CATALOG: Record<string, string> = {
    // --- TASKS ---
    'task_contraction_coord': 'Coordinación de Contracción Perineal',
    'task_knack_practice': 'Práctica del "Knack" (Protección al Esfuerzo)',
    'task_transverso_activation': 'Activación del Transverso Abdominal',
    'task_deadbug_mod': 'Deadbug Modificado (Nivel 1)',
    'task_walk_run_progression': 'Progresión Caminata-Trote',
    'task_calf_strength': 'Fortalecimiento de Pantorrillas',
    'task_delayed_voiding': 'Micción Programada / Retraso',
    'task_relax_breathing': 'Respiración Diafragmática de Relajación',
    'task_hypopressive_intro': 'Iniciación a Hipopresivos',
    'task_keel_elevation': 'Elevación Pélvica (Keel)',
    // --- SYMPTOMS & CONDITIONS ---
    'symptoms': 'Síntomas',
    'comorbidities': 'Comorbilidades',
    'redFlags': 'Banderas Rojas',
    'surgeries': 'Cirugías',
    'medications': 'Medicamentos',
    'lifestyle': 'Estilo de Vida',
    'cSections': 'Cesáreas',
    'c_sections': 'Cesáreas',
    'abortions': 'Abortos',
    'gestations': 'Gestaciones',
    'vaginalBirths': 'Partos Vaginales',
    'vaginal_births': 'Partos Vaginales',
    'episiotomy': 'Episiotomía',
    'tears': 'Desgarros',
    'forceps': 'Fórceps',

    // Symptom Values
    'escape_salto': 'Escape al saltar',
    'escape_tose': 'Escape al toser/estornudar',
    'escape_correr': 'Escape al correr',
    'escape_peso': 'Escape al levantar peso',
    'escape_urgen': 'Urgencia incontrolable',
    'escape_severo': 'Escape severo (gran cantidad)',
    'bulto_palpable': 'Sensación de bulto palpable',
    'bulto_peso': 'Sensación de peso vaginal',
    'dolor_relaciones': 'Dolor en relaciones sexuales',
    'dolor_pelvico': 'Dolor pélvico crónico',
    'constipacion': 'Constipación / Estreñimiento',
    'incont_gases': 'Incontinencia de gases',
    'incont_heces': 'Incontinencia fecal',

    // Postpartum / Specifics
    'postparto_4mo': 'Postparto (4 meses)',
    'postparto_6mo': 'Postparto (6 meses)',
    'postparto_1yr': 'Postparto (1 año)',
    'lactancia': 'Lactancia activa',

    // Physical Exam
    'hiatus': 'Hiato Urogenital',
    'abierto': 'Abierto',
    'cerrado': 'Cerrado/Normal',
    'prolapse': 'Prolapso',
    'avulsion': 'Avulsión',
    'atrophy': 'Atrofia',
    'contracture': 'Contractura',
    'scar_pain': 'Dolor en cicatriz',
    'reflexes': 'Reflejos',
    'sensibility': 'Sensibilidad',
    'tonicity': 'Tonicidad',
    'compliance': 'Compliance',
    'oxford_scale': 'Escala Oxford',

    // Scores
    'score': 'Puntaje',
    'q3_impact': 'Impacto en Calidad de Vida (0-10)',
    'sandvik': 'Índice de Sandvik',
    'iciq': 'ICIQ-SF',


    // --- EDUCATION ---
    'edu_knack': '¿Qué es el Knack? Protección al toser',
    'edu_presion_intra_abd': 'Manejo de la Presión Intra-abdominal',
    'edu_faja_abdominal': 'Uso correcto de la Faja Abdominal',
    'edu_log_rolling': 'Técnica de Log Rolling para salir de la cama',
    'edu_retorno_gradual': 'Protocolo de Retorno Gradual al Impacto',
    'edu_calzado': 'Recomendaciones de Calzado adecuado',
    'edu_irritantes_vesicales': 'Lista de Irritantes Vesicales',
    'edu_entrenamiento_vejiga': 'Técnicas de Entrenamiento Vesical',
    'edu_gestion_presion': 'Gestión de Presiones en la vida diaria',
    'edu_postura_defecatoria': 'Postura Correcta para la Defecación',

    // Fallback constants just in case logic adds new ones
    'edu_lifestyle_general': 'Recomendaciones Generales de Estilo de Vida',
    'task_rest': 'Descanso Activo',

    // --- INTERVENTIONS (PRESETS) ---
    'edu_pain': 'Educación Neurofisiología Dolor',
    'manual_pf': 'Terapia Manual Suelo Pélvico',
    'biofeedback': 'Biofeedback',
    'electro': 'Electroestimulación (TENS/EMS)',
    'ex_core': 'Control Motor / Core',
    'ex_breat': 'Reeducación Respiratoria',
    'ex_str': 'Entrenamiento Fuerza',
    'ex_mob': 'Movilidad Pélvica/Cadera',
    'ex_core_stab': 'Estabilización Lumbopélvica',
    'edu_hygiene': 'Educación Higiene Pélvica',

    // --- CLUSTERS / DIAGNOSIS ---
    'ui_effort': 'Incont. Urinaria de Esfuerzo',
    'ui_urgency': 'Incont. Urinaria de Urgencia',
    'ui_mixed': 'Incont. Urinaria Mixta',
    'prolapse_sensation': 'Sensación de Peso/Bulto',
    'return_run': 'Retorno al Trote/Impacto',
    'dyspareunia': 'Dispareunia (Dolor Sexual)',
    'cpp': 'Dolor Pélvico Crónico',
    'constipation': 'Constipación',

    // --- FUNCTIONAL EVALUATION ---
    'functional': 'Evaluación Funcional',
    'impactTests': 'Tests de Impacto',
    'toleranceTests': 'Tests de Tolerancia',
    'aslrRight': 'ASLR Derecho',
    'aslrLeft': 'ASLR Izquierdo',
    'q1_freq': 'Frecuencia (Q1)',
    'q2_vol': 'Volumen (Q2)',
    'beighton': 'Beighton (Hiperlaxitud)',
    'education': 'Educación',
    'tasks': 'Tareas / Ejercicios',
    'frequency': 'Frecuencia de Sesiones',
    'goals': 'Objetivos Terapéuticos',
    'diagnosis': 'Diagnóstico Kinésico',
    'plan': 'Plan de Tratamiento (Resumen)',

    // --- OTHER FIELD TRANSLATIONS ---
    'anamnesis': 'Anamnesis / Historia',
    'motive': 'Motivo de Consulta',
    'history': 'Historia Clínica',
    'gynaecological': 'Antecedentes Ginecológicos',
    'obstetric': 'Antecedentes Obstétricos',

    'exercise': 'Ejercicio Físico',
    'diet': 'Hábitos Alimenticios',
    'sleep': 'Higiene del Sueño',
    'bladder': 'Vejiga / Urinario',
    'bowel': 'Intestino / Defecatorio',
    'sexual': 'Esfera Sexual',
    'msk': 'Evaluación Musculoesquelética (MSK)',
    'posture': 'Postura',
    'motorControl': 'Control Motor',
    'diastasis': 'Diástasis (DRA)',
    'irdSupra': 'Distancia Inter-Rectos (Supra)',
    'irdInfra': 'Distancia Inter-Rectos (Infra)',
    'doming': 'Abombamiento (Doming)',
    'pelvic': 'Suelo Pélvico',
    'skin': 'Piel / Mucosa',

    'sensation': 'Sensibilidad',
    'oxford': 'Fuerza (Oxford)',
    'endurance': 'Resistencia',
    'reps': 'Repeticiones',
    // Fallbacks
    'true': 'Sí',
    'false': 'No'
};

export function getLabel(id: string): string {
    return ITEMS_CATALOG[id] || id; // Return ID if not found in catalog (fallback)
}
