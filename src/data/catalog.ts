
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
    'edu_hygiene': 'Educación Higiene Pélvica'
    'ex_core_stab': 'Estabilización Lumbopélvica',
    'edu_hygiene': 'Educación Higiene Pélvica',

    // --- FIELD TRANSLATIONS ---
    'anamnesis': 'Anamnesis / Historia',
    'motive': 'Motivo de Consulta',
    'history': 'Historia Clínica',
    'gynaecological': 'Antecedentes Ginecológicos',
    'obstetric': 'Antecedentes Obstétricos',
    'surgeries': 'Cirugías',
    'lifestyle': 'Estilo de Vida',
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
    'reflexes': 'Reflejos',
    'sensation': 'Sensibilidad',
    'oxford': 'Fuerza (Oxford)',
    'endurance': 'Resistencia',
    'reps': 'Repeticiones',
    'hiatus': 'Hiato Urogenital',
    'prolapse': 'Prolapso',
    'painMap': 'Mapa de Dolor',
    'plan': 'Plan de Tratamiento',
    'diagnosis': 'Diagnóstico Kinésico',
    'goals': 'Objetivos Terapéuticos',
    'frequency': 'Frecuencia de Sesiones'
};

export function getLabel(id: string): string {
    return ITEMS_CATALOG[id] || id; // Return ID if not found in catalog (fallback)
}
