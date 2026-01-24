# Guía de Despliegue: Subir a GitHub y Publicar

Como prefieres probarlo directamente en la web (y no en tu computador), la mejor forma profesional y gratuita es:
**GitHub (para guardar el código) + Vercel (para publicarlo como página web).**

Sigue estos pasos LITERALES.

## Paso 1: Preparar GitHub

1.  Entra a [github.com](https://github.com) y asegúrate de estar logueado.
2.  Haz click en el botón **"+"** (arriba a la derecha) y selecciona **"New repository"**.
3.  **Repository name:** `all-u-moves-app`
4.  **Public/Private:** Selecciona "Private" (Privado) si quieres proteger los datos, o Public si no te importa.
5.  **IMPORTANTE:** NO marques ninguna casilla de "Add a README file" o ".gitignore". Déjalo todo vacío.
6.  Dale al botón verde **"Create repository"**.
7.  Verás una pantalla con instrucciones. **Copia la dirección HTTPS** que aparece arriba (ej. `https://github.com/tu-usuario/all-u-moves-app.git`).

## Paso 2: Conectar tu carpeta al Repositorio

Abre tu **Terminal** en la carpeta del proyecto (si la cerraste, ábrela de nuevo):

```bash
cd "/Users/nicoayelefparraguez/Downloads/Ficha allufem/all-u-moves-app"
```

Copia y pega estos comandos UNO POR UNO (dale Enter después de cada uno):

1.  Inicia el repositorio:
    ```bash
    git init
    ```
2.  Agrega todos los archivos (el punto es importante):
    ```bash
    git add .
    ```
3.  Guarda los cambios:
    ```bash
    git commit -m "Primera version: App Base Premium"
    ```
4.  Conecta con GitHub (REEMPLAZA EL LINK por el que copiaste en el paso 1):
    ```bash
    git remote add origin https://github.com/TU-USUARIO/all-u-moves-app.git
    ```
    *(Si te equivocas, avísame).*
5.  Sube los archivos a la nube:
    ```bash
    git push -u origin main
    ```

*Nota: Te pedirá tu usuario y clave. Si usas Mac, quizás te salga una ventanita para autorizar. Hazlo.*

---

## Paso 3: Publicar la App (Hacerla visible)

Github guarda el código, pero **Vercel** hace que la app funcione perfecto (especialmente porque usamos React Router para navegar entre páginas, cosa que GitHub Pages a veces rompe).

1.  Entra a [vercel.com](https://vercel.com) y crea cuenta (regístrate con tu botón de **"Continue with GitHub"**, es lo más fácil).
2.  En tu panel de Vercel, botón **"Add New..."** -> **"Project"**.
3.  En "Import Git Repository", verás tu lista de GitHub. Busca `all-u-moves-app` y dale a **"Import"**.
4.  En la pantalla que sigue ("Configure Project"), **NO toques nada**. Todo está configurado automático para Vite.
5.  Dale al botón azul **"Deploy"**.

**¡MAGIA!** 
Vercel construirá la app en ~1 minuto. Cuando termine, te dará un link (Domain) tipo `all-u-moves-app.vercel.app`.

Ese es el link que le enviarás a Fernanda. Funciona en iPhone, iPad y PC.

---

## ¿Dudas Comunes?

*   **¿Por qué Vercel y no solo GitHub Pages?**
    Porque nuestra app es una "Single Page Application" (SPA) moderna. Vercel está optimizado para esto, es gratis y no falla al recargar la página en una sub-ruta.
*   **¿Y la base de datos?**
    La app ya tiene el código para conectarse, pero por ahora en la web verás los datos de prueba. Cuando quieras conectar Firebase real, me avisas y agregamos las claves en la configuración de Vercel.
