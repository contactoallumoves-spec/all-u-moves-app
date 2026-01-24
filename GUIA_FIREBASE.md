# Guía de Configuración: Firebase (Base de Datos)

Sigue estos pasos para crear el "cerebro" de la app donde se guardarán los datos.

## Paso 1: Crear el Proyecto
1.  Ingresa a [console.firebase.google.com](https://console.firebase.google.com) usando tu cuenta de Google (Gmail).
2.  Haz click en **"Agregar proyecto"** (o "Create a project").
3.  Nombre del proyecto: `All U Moves` (o similar).
4.  Desactiva "Google Analytics" (no lo necesitamos por ahora) y dale a **"Crear proyecto"**.

## Paso 2: Activar la Base de Datos
1.  En el menú de la izquierda, busca **"Compilación"** (Build) y selecciona **"Firestore Database"**.
2.  Haz click en **"Crear base de datos"**.
3.  Selecciona la ubicación: `nam5 (us-central)` está bien.
4.  **IMPORTANTE:** Cuando pregunte por las reglas de seguridad, elige **"Comenzar en modo de prueba"** (Start in test mode).
    *   *Esto permitirá que probemos sin bloqueos por 30 días. Luego lo aseguraremos.*
5.  Dale a **"Habilitar"**.

## Paso 3: Activar el Login (Usuarios)
1.  En el menú izquierda (Compilación), selecciona **"Authentication"**.
2.  Haz click en **"Comenzar"**.
3.  En "Proveedores nativos", elige **"Correo electrónico/contraseña"**.
4.  Activa el primer interruptor ("Habilitar"). No actives el segundo (link sin contraseña).
5.  Dale a **"Guardar"**.

## Paso 4: Obtener las Llaves del Auto
Necesitamos las credenciales para ponerlas en la app.

1.  En el menú izquierda, haz click en el engranaje ⚙️ (arriba, al lado de "Descripción general") -> **"Configuración del proyecto"**.
2.  Baja hasta el final donde dice "Tus apps".
3.  Haz click en el ícono redondo **`</>` (Web)**.
4.  Apodo de la app: `All U Moves Web`.
5.  Dale a **"Registrar app"**.
6.  Te mostrará un código con `const firebaseConfig = { ... }`.
    *   Copia SOLO lo que está entre las llaves `{ ... }`, o mándame una foto de esa parte.
    *   Debería verse así (con tus códigos reales):
        ```javascript
        apiKey: "AIzaSy...",
        authDomain: "all-u-moves...",
        projectId: "all-u-moves...",
        storageBucket: "...",
        messagingSenderId: "...",
        appId: "..."
        ```

**¡Envíame esos códigos por el chat para conectarlos!**
