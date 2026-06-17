export type Question = {
  id: number;
  module: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export const prenatalQuestions: Question[] = [
  {
    id: 1,
    module: "Módulo 1: Fundamentos Anatómicos y Biomecánicos Clave",
    text: "¿Qué estructura ósea articulada conforma la cintura pélvica encargada de sostener y transmitir el peso en el cuerpo de la gestante?",
    options: [
      { id: "A", text: "El fémur y la tibia", isCorrect: false },
      { id: "B", text: "Un anillo óseo articulado formado por el sacro y los dos huesos coxales", isCorrect: true },
      { id: "C", text: "La columna cervical y el occipital", isCorrect: false },
      { id: "D", text: "El trocanter mayor y el cuerpo del fémur", isCorrect: false },
    ]
  },
  {
    id: 2,
    module: "Módulo 1: Fundamentos Anatómicos y Biomecánicos Clave",
    text: "En la biomecánica de la pelvis, ¿cómo se define el movimiento de 'Contranutación'?",
    options: [
      { id: "A", text: "Inclinación anterior del Sacro con aumento de la lordosis lumbar", isCorrect: false },
      { id: "B", text: "Verticalización del sacro, con retroceso/elevación del promontorio y avance/bajada del cóccix", isCorrect: true },
      { id: "C", text: "Desplazamiento exclusivo de los iliacos en el plano frontal", isCorrect: false },
      { id: "D", text: "Una flexión del fémur sobre la pelvis en plano sagital", isCorrect: false },
    ]
  },
  {
    id: 3,
    module: "Módulo 1: Fundamentos Anatómicos y Biomecánicos Clave",
    text: "¿Qué músculos ejecutan la acción de EXTENSIÓN en el plano sagital (rotando el fémur sobre la pelvis)?",
    options: [
      { id: "A", text: "Psoas Mayor, Ilíaco, Recto femoral, Sartorio y Pectíneo", isCorrect: false },
      { id: "B", text: "Aductor largo, Aductor corto, Aductor mayor, Pectíneo y Grácil", isCorrect: false },
      { id: "C", text: "Glúteo mayor, Bíceps femoral (cabeza larga), Semitendinoso, Semimembranoso y Aductor Mayor (fibras posteriores)", isCorrect: true },
      { id: "D", text: "Glúteo medio, glúteo menor, Tensor de la fascia lata y Piriforme", isCorrect: false },
    ]
  },
  {
    id: 4,
    module: "Módulo 1: Fundamentos Anatómicos y Biomecánicos Clave",
    text: "Dentro de las funciones principales del suelo pélvico descritas en la presentación, ¿cuál de las siguientes opciones es correcta?",
    options: [
      { id: "A", text: "Regular de forma exclusiva la hormona relaxina y secretar renina", isCorrect: false },
      { id: "B", text: "Sostener órganos pélvicos, participar en la continencia (urinaria y fecal), en la función sexual, en la postura/movimiento y ser fundamental en el parto", isCorrect: true },
      { id: "C", text: "Producir la hiperpigmentación facial o cloasma", isCorrect: false },
      { id: "D", text: "Generar la anteversión pélvica a través del músculo cuadrado lumbar", isCorrect: false },
    ]
  },
  {
    id: 5,
    module: "Módulo 1: Fundamentos Anatómicos y Biomecánicos Clave",
    text: "¿Qué nombre recibe el órgano muscular hueco ubicado en la pelvis, entre la vejiga y el recto, encargado de albergar y proteger al feto en desarrollo?",
    options: [
      { id: "A", text: "Periné", isCorrect: false },
      { id: "B", text: "Útero o matriz", isCorrect: true },
      { id: "C", text: "Sínfisis del pubis", isCorrect: false },
      { id: "D", text: "Canal vaginal", isCorrect: false },
    ]
  },
  {
    id: 6,
    module: "Módulo 2: Cambios Fisiológicos en el Embarazo",
    text: "Según los datos de 'El Método PGM' (Physiopedia), ¿cuál es el comportamiento de la hormona Relaxina durante las primeras 12 semanas de embarazo y su posterior evolución?",
    options: [
      { id: "A", text: "Se mantiene baja en el primer trimestre y se eleva exponencialmente en el tercero", isCorrect: false },
      { id: "B", text: "Aumenta 10 veces durante las primeras 12 semanas, comienza a disminuir, y baja a aproximadamente el 50% del valor máximo hacia la semana 20", isCorrect: true },
      { id: "C", text: "Desaparece por completo del sistema musculoesquelético en la semana 14", isCorrect: false },
      { id: "D", text: "Duplica su valor de forma lineal cada mes hasta el término de la gestación", isCorrect: false },
    ]
  },
  {
    id: 7,
    module: "Módulo 2: Cambios Fisiológicos en el Embarazo",
    text: "¿A qué se debe el Síndrome de Hipotensión Supina y cuál es la recomendación postural que añade el texto para revertir o aliviar la presión?",
    options: [
      { id: "A", text: "A una baja drástica de la progesterona; se alivia sentándose en postura de loto", isCorrect: false },
      { id: "B", text: "A la compresión de la vena cava inferior por el útero aumentado de tamaño; se alivia recostando a la gestante sobre su lado izquierdo o colocando un soporte bajo la cadera derecha", isCorrect: true },
      { id: "C", text: "Al aumento de tamaño de la pelvis renal; se alivia con extensiones profundas de columna", isCorrect: false },
      { id: "D", text: "A un aumento del gasto cardíaco al estar de pie; se alivia mediante bipedestación estática", isCorrect: false },
    ]
  },
  {
    id: 8,
    module: "Módulo 2: Cambios Fisiológicos en el Embarazo",
    text: "De acuerdo con la información adjunta de Physiopedia, ¿cuál es el segundo trastorno endocrino más común en el embarazo y el posparto?",
    options: [
      { id: "A", text: "La diabetes gestacional", isCorrect: false },
      { id: "B", text: "Los trastornos tiroideos (como el hipotiroidismo o hipertiroidismo)", isCorrect: true },
      { id: "C", text: "La disfunción de la sínfisis púbica", isCorrect: false },
      { id: "D", text: "La insuficiencia de la hormona relaxina", isCorrect: false },
    ]
  },
  {
    id: 9,
    module: "Módulo 2: Cambios Fisiológicos en el Embarazo",
    text: "¿Cuáles son los cambios cardiovasculares normales descritos en el material que experimenta el cuerpo de la mujer para nutrir al bebé en desarrollo?",
    options: [
      { id: "A", text: "Disminución del gasto cardíaco y reducción del volumen sanguíneo en un 50%", isCorrect: false },
      { id: "B", text: "Aumento del volumen sanguíneo entre 35% y 50%, aumento de la frecuencia cardíaca entre 10 y 20 latidos por minuto, y aumento del gasto cardíaco entre 30% y 60%", isCorrect: true },
      { id: "C", text: "Estabilización absoluta de la presión venosa en bipedestación sin generar edema", isCorrect: false },
      { id: "D", text: "Caída permanente de la frecuencia cardíaca durante el tercer trimestre", isCorrect: false },
    ]
  },
  {
    id: 10,
    module: "Módulo 2: Cambios Fisiológicos en el Embarazo",
    text: "¿Cuál es la definición clínica exacta de la Diástasis Abdominal (o Diástasis de rectos) según los textos y qué ejercicios se deben evitar?",
    options: [
      { id: "A", text: "Una rotación de los huesos ilíacos que se trata con caminatas largas", isCorrect: false },
      { id: "B", text: "Una brecha o separación de los músculos rectos abdominales debido al estiramiento de la línea alba; se deben evitar ejercicios que aumenten la presión intraabdominal como los abdominales tradicionales", isCorrect: true },
      { id: "C", text: "El aumento de tensión del ligamento redondo del útero", isCorrect: false },
      { id: "D", text: "Un desprendimiento crónico de la placenta que afecta la estabilidad del tronco", isCorrect: false },
    ]
  },
  {
    id: 11,
    module: "Módulo 3: Evaluación y Seguimiento de la Gestante",
    text: "¿Cuál de las siguientes opciones describe una recomendación esencial de la guía canadiense de actividad física prenatal para una gestante sana?",
    options: [
      { id: "A", text: "Evitar cualquier tipo de movimiento físico durante los 9 meses de gestación", isCorrect: false },
      { id: "B", text: "Acostarse completamente boca arriba de forma estática a partir del segundo trimestre", isCorrect: false },
      { id: "C", text: "Realizar al menos 150 minutos de actividad física semanal de intensidad moderada, repartidos en 3 o más días", isCorrect: true },
      { id: "D", text: "Ejercitarse a intensidades máximas que impidan hablar o comunicarse continuamente", isCorrect: false },
    ]
  },
  {
    id: 12,
    module: "Módulo 3: Evaluación y Seguimiento de la Gestante",
    text: "¿Cuáles son los 'Signos de Alarma' explícitos que vienen listados en la Ficha de Bienestar / Ficha para gestantes y que requieren pausar la clase?",
    options: [
      { id: "A", text: "Cansancio ligero, aumento de apetito y sudoración normal", isCorrect: false },
      { id: "B", text: "Sangrado vaginal, dolor abdominal intenso, mareos/desmayos, disminución de movimientos fetales, contracciones uterinas regulares antes de la semana 37, pérdida de líquido amniótico, dificultad para respirar, dolor de cabeza severo, cambios en la visión o hinchazón repentina", isCorrect: true },
      { id: "C", text: "Dolor muscular leve al día siguiente de haber realizado posturas de pie con apoyo", isCorrect: false },
      { id: "D", text: "Deseos frecuentes de orinar debido a la presión del útero sobre la vejiga", isCorrect: false },
    ]
  },
  {
    id: 13,
    module: "Módulo 3: Evaluación y Seguimiento de la Gestante",
    text: "Al utilizar la postura de Tadasana para realizar una evaluación postural a la gestante, ¿qué alteraciones o puntos específicos indica el texto que debemos observar en la columna y piernas?",
    options: [
      { id: "A", text: "Medir la flexibilidad longitudinal de los aductores y la fuerza del glúteo medio", isCorrect: false },
      { id: "B", text: "Revisar si hay cifosis o lordosis exageradas, si las rodillas están en hiperextensión o si apuntan hacia adentro o hacia afuera, y si los pies están separados a la distancia de las caderas", isCorrect: true },
      { id: "C", text: "Contar las pulsaciones cardíacas en reposo de la alumna", isCorrect: false },
      { id: "D", text: "Verificar el movimiento de contranutación del sacro durante la respiración", isCorrect: false },
    ]
  },
  {
    id: 14,
    module: "Módulo 3: Evaluación y Seguimiento de la Gestante",
    text: "¿Qué características definen al Dolor del Ligamento Redondo del útero según el diagnóstico diferencial expuesto en los textos?",
    options: [
      { id: "A", text: "Es un dolor bilateral generalizado que se acompaña de fiebre, escalofríos y vómitos", isCorrect: false },
      { id: "B", text: "Es un dolor súbito, comúnmente unilateral en el lado derecho de la pelvis/ingle, que suele ocurrir con movimientos súbitos o ejercicio, y NO se acompaña de fiebre, sangrado ni escalofríos", isCorrect: true },
      { id: "C", text: "Es una molestia que se irradia a los dedos de la mano simulando un túnel carpiano", isCorrect: false },
      { id: "D", text: "Se presenta como un área de esclerosis triangular simétrica visible solo en radiografías", isCorrect: false },
    ]
  },
  {
    id: 15,
    module: "Módulo 3: Evaluación y Seguimiento de la Gestante",
    text: "¿Qué síntomas caracterizan a la Disfunción de la Sínfisis Púbica (cuando la separación interpúbica es patológica entre 6 y 12 mm)?",
    options: [
      { id: "A", text: "Dolor profundo en el cuello y aducción postural del brazo del mismo lado", isCorrect: false },
      { id: "B", text: "Dolor púbico o inguinal con referencia hacia la cara medial del muslo, el cual se agrava con la movilidad en cama, la abducción de las piernas, caminar o subir escaleras", isCorrect: true },
      { id: "C", text: "Pérdida súbita de la audición y cefaleas tensionales matutinas", isCorrect: false },
      { id: "D", text: "Un dolor glúteo sordo que mejora de manera inmediata al caminar distancias prolongadas", isCorrect: false },
    ]
  },
  {
    id: 16,
    module: "Módulo 4: Asanas y Pranayamas en el Embarazo",
    text: "Basado en la evidencia científica de los ensayos clínicos indexados incluidos (Kuder 2025 y Chen 2025), ¿cuáles son los impactos reales de la práctica de yoga en los resultados del parto?",
    options: [
      { id: "A", text: "Garantiza un parto 100% libre de cualquier tipo de dolor físico sin importar las circunstancias", isCorrect: false },
      { id: "B", text: "Reduce la tasa de cesáreas intraparto (In-labour CS), disminuye la intensidad del dolor en el parto, acorta el tiempo total de labor y fomenta el parto vaginal espontáneo", isCorrect: true },
      { id: "C", text: "Aumenta el peso al nacer del neonato de forma exponencial por encima de los límites normales", isCorrect: false },
      { id: "D", text: "No demuestra ningún cambio significativo en comparación con los cuidados de enfermería estándar", isCorrect: false },
    ]
  },
  {
    id: 17,
    module: "Módulo 4: Asanas y Pranayamas en el Embarazo",
    text: "¿En qué escenario específico del tercer trimestre avanzado (semana 34 en adelante) está CONTRAINDICADA la postura de cuclillas según las indicaciones del texto?",
    options: [
      { id: "A", text: "Si la gestante experimenta acidez o reflujo gastrointestinal", isCorrect: false },
      { id: "B", text: "Si el bebé está podálico o de nalgas, para evitar que se encaje en esa presentación", isCorrect: true },
      { id: "C", text: "Si la alumna refiere calambres nocturnos en las piernas", isCorrect: false },
      { id: "D", text: "Si se practica usando el soporte de una silla o de la pared", isCorrect: false },
    ]
  },
  {
    id: 18,
    module: "Módulo 4: Asanas y Pranayamas en el Embarazo",
    text: "¿Cuáles de las siguientes asanas están RECOMENDADAS de forma específica durante el Primer Trimestre (0-14 semanas) para favorecer una práctica segura y regular la energía?",
    options: [
      { id: "A", text: "Estiramientos profundos de la parte interna del muslo, saltos y carreras intensas", isCorrect: false },
      { id: "B", text: "Posturas dinámicas con elevación prolongada de brazos por sobre el nivel de la cabeza", isCorrect: false },
      { id: "C", text: "Adho Mukha Virasana con altura para la frente, Paschimottanasana con altura, Viparita Karani y Savasana lateral.", isCorrect: true },
      { id: "D", text: "Posturas de flexión de columna con alta compresión sostenida sobre el vientre", isCorrect: false },
    ]
  },
  {
    id: 19,
    module: "Módulo 4: Asanas y Pranayamas en el Embarazo",
    text: "¿Cuáles de las siguientes asanas están RECOMENDADAS específicamente en el Segundo Trimestre para prevenir y aliviar los CALAMBRES en las piernas?",
    options: [
      { id: "A", text: "Posturas fijas boca arriba en decúbito supino plano por más de 30 minutos", isCorrect: false },
      { id: "B", text: "Vinyasas o secuencias dinámicas, posturas de pie como Utthita Trikonasana y Utthita Parsvakonasana, Prasaritta Padottanasana, Supta Dandasana y Viparita Karani", isCorrect: true },
      { id: "C", text: "Únicamente la postura de la mariposa (Baddha Konasana) y Janu Sirsasana sin soportes", isCorrect: false },
      { id: "D", text: "Posturas de flexión profunda de columna con compresión del vientre", isCorrect: false },
    ]
  },
  {
    id: 20,
    module: "Módulo 4: Asanas y Pranayamas en el Embarazo",
    text: "Al aplicar la filosofía del yoga sutra 'Sthira-Sukham' (2.46) en el contexto prenatal, ¿qué características debe cumplir la guía de la instructora?",
    options: [
      { id: "A", text: "Debe exigir que la alumna sostenga la postura con esfuerzo máximo y retención de aire", isCorrect: false },
      { id: "B", text: "Buscar una postura estable sin rigidez, cómoda sin colapso, sin esfuerzo excesivo y que permita la respiración libre", isCorrect: true },
      { id: "C", text: "Imponer una alineación rígida e idéntica para todas las alumnas sin importar su trimestre", isCorrect: false },
      { id: "D", text: "Priorizar la flexibilidad pasiva extrema por encima de la estabilidad lumbo-pélvica", isCorrect: false },
    ]
  }
];
