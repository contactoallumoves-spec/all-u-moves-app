/**
 * INSTRUCCIONES PARA EL USUARIO:
 * =============================================================================
 * Este archivo es donde debes pegar los códigos de tus SVGs profesionales.
 * Necesito específicamente el atributo "d" de cada <path>.
 *
 * PASOS:
 * 1. Abre tu archivo SVG (o selecciónalo en Figma).
 * 2. Asegúrate de que cada parte del cuerpo sea un "Layout" o "Path" separado.
 * 3. Copia el parámetro `viewBox` de tu SVG principal (ej: "0 0 500 1000") y pégalo abajo en `SVG_CONFIG`.
 * 4. Para cada parte del cuerpo (cabeza, cuello, etc.), copia el contenido de `d="..."`.
 *    Ejemplo: <path d="M10 10 L50 50..." />  -> Copia solo: "M10 10 L50 50..."
 * 5. Pégalo dentro de las comillas correspondientes abajo.
 * =============================================================================
 */

export const SVG_CONFIG = {
    // IMPORTANTE: Cambia esto por el viewBox de tu SVG original para que las proporciones sean correctas.
    viewBox: "0 0 400 800"
};

// VISTA ANTERIOR (FRENTE)
// Pega aquí los 'd' de los paths de tu SVG frontal
export const FRONT_PATHS: Record<string, string> = {
    head: "",           // Cabeza
    neck: "",           // Cuello
    chest: "",          // Pecho / Tórax
    abdomen: "",        // Abdomen
    pelvis: "",         // Pelvis / Zona Baja

    shoulder_left: "",  // Hombro Izquierdo (Tu derecha en pantalla)
    shoulder_right: "", // Hombro Derecho (Tu izquierda en pantalla)

    arm_left: "",       // Brazo Izquierdo
    arm_right: "",      // Brazo Derecho

    hand_left: "",      // Mano Izquierda
    hand_right: "",     // Mano Derecha

    leg_left: "",       // Pierna Izquierda
    leg_right: "",      // Pierna Derecha

    foot_left: "",      // Pie Izquierdo
    foot_right: "",     // Pie Derecho
};

// VISTA POSTERIOR (ESPALDA)
// Pega aquí los 'd' de los paths de tu SVG de espalda
export const BACK_PATHS: Record<string, string> = {
    head_back: "",          // Cabeza Posterior
    neck_back: "",          // Cervical / Cuello Posterior
    upper_back: "",         // Espalda Alta / Dorsal
    lower_back: "",         // Espalda Baja / Lumbar
    glutes: "",             // Glúteos

    shoulder_left_back: "", // Hombro Izq Posterior
    shoulder_right_back: "",// Hombro Der Posterior

    arm_left_back: "",      // Brazo Izq Posterior
    arm_right_back: "",     // Brazo Der Posterior

    hand_left_back: "",     // Mano Izq Posterior
    hand_right_back: "",    // Mano Der Posterior

    leg_left_back: "",      // Pierna Izq Posterior
    leg_right_back: "",     // Pierna Der Posterior

    foot_left_back: "",     // Pie Izq Posterior
    foot_right_back: "",    // Pie Der Posterior
};

// NOMBRES PARA MOSTRAR (No es necesario editar, pero puedes personalizarlos)
export const REGION_NAMES: Record<string, string> = {
    head: "Cabeza",
    neck: "Cuello",
    chest: "Tórax",
    abdomen: "Abdomen",
    pelvis: "Pelvis",
    shoulder_left: "Hombro Izq",
    shoulder_right: "Hombro Der",
    arm_left: "Brazo Izq",
    arm_right: "Brazo Der",
    hand_left: "Mano Izq",
    hand_right: "Mano Der",
    leg_left: "Pierna Izq",
    leg_right: "Pierna Der",
    foot_left: "Pie Izq",
    foot_right: "Pie Der",

    head_back: "Cabeza (Post)",
    neck_back: "Cervical",
    upper_back: "Dorsal",
    lower_back: "Lumbar",
    glutes: "Glúteos",
    shoulder_left_back: "Hombro Izq (Post)",
    shoulder_right_back: "Hombro Der (Post)",
    arm_left_back: "Brazo Izq (Post)",
    arm_right_back: "Brazo Der (Post)",
    hand_left_back: "Mano Izq (Post)",
    hand_right_back: "Mano Der (Post)",
    leg_left_back: "Pierna Izq (Post)",
    leg_right_back: "Pierna Der (Post)",
    foot_left_back: "Pie Izq (Post)",
    foot_right_back: "Pie Der (Post)",
};
