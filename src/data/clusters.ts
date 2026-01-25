import { Cluster } from '../types/clinical';

export const CLUSTERS: Cluster[] = [
    {
        id: 'ui_effort',
        label: 'Incontinencia de Esfuerzo',
        category: 'pelvic',
        description: 'Pérdida involuntaria al toser, estornudar, reír o hacer ejercicio.',
        triggers: {
            symptoms: ['escape_tos', 'escape_salto', 'escape_peso', 'incontinencia_general', 'escape_severo']
        },
        suggestions: {
            tests: ['test_tos_stress', 'eval_fuerza_piso'],
            education: ['edu_knack', 'edu_presion_intra_abd'],
            tasks: ['task_contraction_coord', 'task_knack_practice'],
            cif: [
                { code: 'b6200', description: 'Funciones de la micción' }
            ]
        }
    },
    {
        id: 'ui_urgency',
        label: 'Urgencia / Frecuencia',
        category: 'pelvic',
        description: 'Deseo repentino e imperioso de orinar difícil de posponer.',
        triggers: {
            symptoms: ['urgencia_fuerte', 'frecuencia_alta', 'nocturia']
        },
        suggestions: {
            tests: ['diario_miccional', 'test_retencion'],
            education: ['edu_irritantes_vesicales', 'edu_entrenamiento_vejiga'],
            tasks: ['task_delayed_voiding', 'task_relax_breathing'],
            cif: [
                { code: 'b6202', description: 'Sensación de micción' }
            ]
        }
    },
    {
        id: 'prolapse_sensation',
        label: 'Sensación de Peso / Bulto',
        category: 'pelvic',
        description: 'Sensación de cuerpo extraño o pesadez vaginal.',
        triggers: {
            symptoms: ['peso_vaginal', 'bulto_palpable', 'molestia_tarde']
        },
        suggestions: {
            tests: ['pop_q_simplificado', 'eval_maniobra_valsalva'],
            education: ['edu_gestion_presion', 'edu_postura_defecatoria'],
            tasks: ['task_hypopressive_intro', 'task_keel_elevation'],
            referral: 'Evaluar grado. Si > Grado 2 sintomático, considerar pesario/derivación.'
        }
    },
    {
        id: 'diastasis',
        label: 'Diástasis / Control Abdominal',
        category: 'msk',
        description: 'Separación de rectos o falta de competencia abdominal.',
        triggers: {
            symptoms: ['bulto_abdominal', 'dolor_lumbar_bajo', 'debilidad_core']
        },
        suggestions: {
            tests: ['test_ird', 'test_control_motor_abd'],
            education: ['edu_faja_abdominal', 'edu_log_rolling'],
            tasks: ['task_transverso_activation', 'task_deadbug_mod'],
        }
    },
    {
        id: 'return_run',
        label: 'Retorno al Impacto',
        category: 'fitness',
        description: 'Usuaria postparto o post-lesión queriendo volver a correr.',
        triggers: {
            symptoms: ['deseo_correr', 'postparto_4mo']
        },
        suggestions: {
            tests: ['test_load_impact', 'test_single_leg_hop'],
            education: ['edu_retorno_gradual', 'edu_calzado'],
            tasks: ['task_walk_run_progression', 'task_calf_strength'],
        }
    },
    {
        id: 'c_section_scar',
        label: 'Cicatriz de Cesárea',
        category: 'msk',
        description: 'Manejo de adherencias y sensibilidad en cicatriz.',
        triggers: {
            symptoms: ['cesarea_previa', 'dolor_cicatriz']
        },
        suggestions: {
            tests: ['eval_movilidad_cicatriz', 'eval_sensibilidad'],
            education: ['edu_masaje_cicatriz', 'edu_fases_cicatrizacion'],
            tasks: ['task_scar_mobilization', 'task_desensitization'],
        }
    },
    {
        id: 'constipation',
        label: 'Estreñimiento / Pujo',
        category: 'pelvic',
        description: 'Dificultad defecatoria que puede dañar el suelo pélvico.',
        triggers: {
            symptoms: ['estrenimiento', 'pujo_excesivo']
        },
        suggestions: {
            tests: ['eval_bristol'],
            education: ['edu_postura_defecatoria', 'edu_fibra_hidratacion'],
            tasks: ['task_iluu_massage', 'task_breathing_relaxation'],
        }
    },
    {
        id: 'chronic_cough',
        label: 'Tos Crónica / Hiperpresión',
        category: 'lifestyle',
        description: 'Gestión de presión intra-abdominal repetitiva.',
        triggers: {
            symptoms: ['tos_cronica', 'alergia_estacional']
        },
        suggestions: {
            tests: ['test_control_tos'],
            education: ['edu_blow_before_cough', 'edu_presion_intra_abd'],
            tasks: ['task_knack_practice'],
        }
    {
        id: 'sexual_pain',
        label: 'Dolor Sexual / Dispareunia',
        category: 'pelvic',
        description: 'Dolor asociado a la actividad sexual (superficial o profundo).',
        triggers: {
            symptoms: ['dispareunia', 'dolor_sexual']
        },
        suggestions: {
            tests: ['eval_sensibilizacion', 'mapa_dolor_pelvico'],
            education: ['edu_respuesta_sexual', 'edu_lubricantes'],
            tasks: ['task_dilatadores_prog', 'task_relax_pelvic'],
        }
    }
];

export const RED_FLAGS = [
    { id: 'sangrado_postmeno', label: 'Sangrado post-menopausia', severity: 'high', action: 'Derivación Ginecología Urgente' },
    { id: 'dolor_nocturno', label: 'Dolor nocturno persistente', severity: 'medium', action: 'Evaluar descartar patología inflamatoria/tumor' },
    { id: 'cauda_equina', label: 'Anestesia en silla de montar / Pérdida control esfínter', severity: 'red_flag', action: 'URGENCIA MÉDICA INMEDIATA' }
];
