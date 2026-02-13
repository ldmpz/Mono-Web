# AI.CORP - Premium AI Agency Website

Sitio web "one page" de alto rendimiento para una firma de ingeniería digital especializada en Inteligencia Artificial.

## Tecnologías

- **Next.js 15+ (App Router)**: Framework de React para producción.
- **Vanilla CSS Modules**: Estilizado modular sin dependencias externas, asegurando rendimiento máximo.
- **Google Fonts (Inter & Outfit)**: Tipografía moderna y optimizada.
- **ScrollReveal**: Componente personalizado para animaciones de entrada.

## Estructura del Proyecto

- `src/app/globals.css`: Variables CSS globales (Paleta de colores estricta) y estilos base.
- `src/components/`: Componentes modulares (Navbar, Hero, Services, Methodology, Advantages, UseCases, Footer).
- `src/app/layout.tsx`: Layout principal con configuración de fuentes y metadatos SEO.

## Instalación y Ejecución Local

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Ejecutar servidor de desarrollo:
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000` en tu navegador.

## Despliegue en Vercel

Este proyecto está optimizado para Vercel.

1.  Sube el código a tu repositorio de GitHub.
2.  Importa el proyecto en Vercel.
3.  Vercel detectará automáticamente la configuración de Next.js.
4.  Haz clic en **Deploy**.

## Personalización

- **Colores**: Edita las variables CSS en `src/app/globals.css`.
- **Contenido**: Cada sección está aislada en su propio componente dentro de `src/components/` para fácil edición.
