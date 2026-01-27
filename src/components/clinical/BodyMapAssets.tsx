

/**
 * BODY MAP ASSETS
 * High-quality SVG paths for interactive anatomical maps.
 * 
 * ViewBox: 0 0 400 800 (Aspect Ratio 1:2)
 * Style: Outline / Medical Minimalist
 */

export interface BodyPart {
    id: string;
    name: string; // Display Name
    d: string; // SVG Path Data
}

export const BODY_FRONT_PARTS: BodyPart[] = [
    {
        id: 'head',
        name: 'Cabeza',
        d: "M200 40 C175 40 160 60 160 85 C160 110 175 125 200 125 C225 125 240 110 240 85 C240 60 225 40 200 40 Z"
    },
    {
        id: 'neck',
        name: 'Cuello',
        d: "M185 125 L185 145 Q200 155 215 145 L215 125 Q200 135 185 125 Z"
    },
    {
        id: 'chest',
        name: 'Tórax',
        d: "M160 155 L140 165 L145 250 Q200 260 255 250 L260 165 L240 155 Q200 175 160 155 Z"
    },
    {
        id: 'abdomen',
        name: 'Abdomen',
        d: "M145 250 Q200 260 255 250 L250 330 Q200 340 150 330 Z"
    },
    {
        id: 'pelvis',
        name: 'Pelvis',
        d: "M150 330 Q200 340 250 330 L260 360 Q200 380 140 360 Z"
    },
    {
        id: 'shoulder_left',
        name: 'Hombro Izq',
        d: "M240 155 L280 155 Q290 155 290 180 L260 165 Z"
    },
    {
        id: 'shoulder_right',
        name: 'Hombro Der',
        d: "M160 155 L120 155 Q110 155 110 180 L140 165 Z"
    },
    {
        id: 'arm_left',
        name: 'Brazo Izq',
        d: "M260 165 L290 180 L300 280 L270 270 Z"
    },
    {
        id: 'arm_right',
        name: 'Brazo Der',
        d: "M140 165 L110 180 L100 280 L130 270 Z"
    },
    {
        id: 'hand_left',
        name: 'Mano Izq',
        d: "M300 280 L310 320 L280 320 L270 270 Z"
    },
    {
        id: 'hand_right',
        name: 'Mano Der',
        d: "M100 280 L90 320 L120 320 L130 270 Z"
    },
    {
        id: 'leg_left',
        name: 'Pierna Izq',
        d: "M250 330 L260 360 L270 550 L230 550 L205 380 Z"
    },
    {
        id: 'leg_right',
        name: 'Pierna Der',
        d: "M150 330 L140 360 L130 550 L170 550 L195 380 Z"
    },
    {
        id: 'foot_left',
        name: 'Pie Izq',
        d: "M230 550 L270 550 L280 580 L240 580 Z"
    },
    {
        id: 'foot_right',
        name: 'Pie Der',
        d: "M170 550 L130 550 L120 580 L160 580 Z"
    }
];

export const BODY_BACK_PARTS: BodyPart[] = [
    {
        id: 'head_back',
        name: 'Cabeza (Posterior)',
        d: "M200 40 C175 40 160 60 160 85 C160 110 175 125 200 125 C225 125 240 110 240 85 C240 60 225 40 200 40 Z"
    },
    {
        id: 'neck_back',
        name: 'Cervical',
        d: "M185 125 L185 145 Q200 150 215 145 L215 125 Q200 135 185 125 Z"
    },
    {
        id: 'upper_back',
        name: 'Espalda Alta',
        d: "M160 155 L130 165 L145 250 Q200 240 255 250 L270 165 L240 155 Q200 175 160 155 Z"
    },
    {
        id: 'lower_back',
        name: 'Lumbar',
        d: "M145 250 Q200 240 255 250 L250 330 Q200 320 150 330 Z"
    },
    {
        id: 'glutes',
        name: 'Glúteos',
        d: "M150 330 Q200 320 250 330 L260 380 Q200 400 140 380 Z"
    },
    {
        id: 'shoulder_left_back',
        name: 'Hombro Izq (Post)',
        d: "M160 155 L120 155 Q110 155 110 180 L130 165 Z"
    },
    {
        id: 'shoulder_right_back',
        name: 'Hombro Der (Post)',
        d: "M240 155 L280 155 Q290 155 290 180 L270 165 Z"
    },
    {
        id: 'arm_left_back',
        name: 'Brazo Izq (Post)',
        d: "M130 165 L110 180 L100 280 L130 270 Z"
    },
    {
        id: 'arm_right_back',
        name: 'Brazo Der (Post)',
        d: "M270 165 L290 180 L300 280 L270 270 Z"
    },
    {
        id: 'leg_left_back',
        name: 'Pierna Izq (Post)',
        d: "M150 330 L140 380 L130 550 L170 550 L195 380 Z"
    },
    {
        id: 'leg_right_back',
        name: 'Pierna Der (Post)',
        d: "M250 330 L260 380 L270 550 L230 550 L205 380 Z"
    }
];
