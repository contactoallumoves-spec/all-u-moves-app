# Guía de Instalación: All U Moves (App Premium)

Esta guía te permitirá poner en marcha la aplicación "All U Moves" sin necesidad de saber programar. Sigue los pasos literalmente.

## Requisitos Previos

Para que esto funcione en tu computador, necesitas instalar 2 herramientas:
1.  **Node.js**: Entra a [nodejs.org](https://nodejs.org) y descarga la versión **LTS** (Recomendada). Instálala como cualquier programa.
2.  **Git**: Probablemente ya lo tienes, pero si no, descarga [git-scm.com](https://git-scm.com).

## Paso 1: Preparar la Carpeta

Ya he creado todos los archivos necesarios en la carpeta:
`/Downloads/Ficha allufem/all-u-moves-app`

1.  Abre tu **Terminal** (Aplicación "Terminal" en Mac).
2.  Escribe el siguiente comando y pulsa ENTER:
    ```bash
    cd "/Users/nicoayelefparraguez/Downloads/Ficha allufem/all-u-moves-app"
    ```

## Paso 2: Instalación de Dependencias

Una vez dentro de la carpeta (en la terminal), escribe este comando para que se descarguen las "piezas" de la app:

```bash
npm install
```

*Verás una barra de carga. Espera a que termine.*

## Paso 3: Probar la App en tu Computador

Para ver la app funcionando en tu pantalla, escribe:

```bash
npm run dev
```

Te aparecerá un link local (ej. `http://localhost:5173`).
Mantén presionada la tecla `Cmd` y haz click en ese link. ¡Se abrirá la app en tu navegador!

*   Usa el login de prueba (cualquier correo y clave funciona por ahora).
*   Navega a "Nueva Evaluación" -> "Modo Rápido" para ver el flujo.

## Paso 4: Subir a Internet (Vercel) - Recomendado

Para que Fernanda pueda usarla desde su iPad/iPhone sin cables:

1.  Crea una cuenta gratis en [Vercel.com](https://vercel.com).
2.  Instala "Vercel CLI" en tu terminal:
    ```bash
    npm i -g vercel
    ```
3.  Escribe:
    ```bash
    vercel
    ```
4.  Sigue las instrucciones en pantalla (dale ENTER a todo para aceptar los valores por defecto).

¡Y listo! Vercel te dará un link web real (ej. `all-u-moves.vercel.app`) que puedes enviar por WhatsApp.

---

## Configuración de Firebase (Base de Datos)

Para que los datos se guarden de verdad (ahora mismo son visuales):

1.  Ve a [console.firebase.google.com](https://console.firebase.google.com).
2.  Crea un proyecto nuevo llamado "All U Moves".
3.  Activa "Authentication" y "Firestore Database".
4.  En la configuración del proyecto, copia las claves (API Key, etc.) y avísame para decirte dónde pegarlas (archivo `.env`).

*Por ahora, la app funciona visualmente sin esto.*
