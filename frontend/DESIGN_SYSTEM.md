# PichangaLibre: Design System & Skills Manual

Este documento define las reglas de diseño y desarrollo que deben respetarse para mantener la estética **"Ultra Elite"** y la estabilidad del proyecto.

## 1. Identidad Visual: Kinetic Obsidian

### Paleta de Colores
- **Fondo Primario (Obsidian):** `#0e0e0e` (Negro profundo, no azulado).
- **Fondo Secundario (Card):** `#1a1919` o `rgba(26, 25, 25, 0.8)`.
- **Acento Principal (Electric Lime):** `#cafd00` (Verde neón brillante).
- **Texto Primario:** `#ffffff` (Blanco puro para títulos).
- **Texto Secundario:** `#adaaaa` (Gris técnico para etiquetas y meta-datos).
- **Bordes/Líneas:** `#484847` con opacidad baja (0.15 - 0.3).

### Tipografía
- **Space Grotesk:** Usar para todos los encabezados (`<h1>` a `<h3>`), números de alto impacto, botones HUD y etiquetas en mayúsculas.
- **Inter:** Usar para párrafos, descripciones largas y entradas de formulario.

### Estilo de UI
- **Glassmorphism:** Fondo oscuro translúcido con `backdrop-blur-xl`.
- **Bordes:** Evitar bordes sólidos de 1px. Usar variaciones tonales del fondo o bordes semi-transparentes muy sutiles.
- **HUD Style:** Los elementos deben parecer parte de una consola de mando (indicadores de estado, fuentes mono-espaciadas para versiones, sombras con brillo neón).

---

## 2. Reglas de Desarrollo (Skills)

### Estabilidad de Datos (Anti-Crash)
- **Defensive API Handling:** NUNCA asumir que una respuesta de la API es un Array. Siempre validar antes de usar `.map()`, `.find()` o `.filter()`.
  ```javascript
  if (!Array.isArray(data)) return [];
  // o
  const items = Array.isArray(data) ? data : [];
  ```

### Animaciones (GSAP)
- Usar **GSAP** para transiciones de entrada y cambios de estado complejos.
- Curvas de easing preferidas: `power2.out` para suavidad, `back.out(1.7)` para efectos de "rebote" tecnológico.

### Estructura Next.js
- Mantener la lógica de negocio en `src/lib/api` o `contexts`.
- Los componentes visuales deben ser lo más puros posible, recibiendo props para su renderizado.

---

## 3. Checklist para Nuevas Secciones
- [ ] ¿Usa el fondo `#0e0e0e`?
- [ ] ¿Los títulos están en `Space Grotesk`?
- [ ] ¿Se han eliminado los bordes sólidos azules/grises?
- [ ] ¿Tiene validación defensiva en las llamadas a la API?
- [ ] ¿Se incluyó alguna micro-animación de entrada?
