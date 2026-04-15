# AETERIUM ECOM DROP — Perplexity Memory

Última actualización: 2026-04-15 17:32 CEST

## 1. Infraestructura y estado actual
- Repositorio: `klarx94-Architect/AETERIUM_ECOM_DROP`
- Rama activa de despliegue: `master`
- Vercel project: `aeterium-ecom-drop`
- URL producción: https://aeterium-ecom-drop.vercel.app
- `/` responde 200 y sirve el bundle Vite actual sin errores fatales visibles en la carga inicial.[cite:82]

### Backend `/api`
- Carpeta `/api` en la raíz con handlers serverless funcionales:
  - `products.js` → catálogo Dropea + ordenación por margen + cacheo en Supabase.[file:79][cite:81]
  - `guerrilla-intel.js` → lee últimos escaneos de `scans` en Supabase.[file:79]
  - `scan-dynamic.js` → búsquedas dinámicas usando Gemini + catálogo.[file:79]
  - `generate-strategy.js` → genera estrategias IA con Gemini.[file:79]
  - `orders.js` → sincroniza pedidos con Dropea.[file:79]
- Vercel está configurado para desplegar tanto el frontend estático como las funciones `/api` desde la raíz del repo (Root Directory = `/`).[file:79]

### Frontend
- Frontend React/Vite en `/frontend`, empaquetado en `/dist`.
- Página principal de operaciones: `frontend/src/pages/GuerrillaIntel.jsx`.
- Estado actual de UI:
  - La tabla principal consume `/api/products` y muestra productos reales (no mocks).[file:79][cite:81]
  - Se han eliminado datos mock en las cards y ahora se calculan KPIs básicos (Stock Total y Beneficio Potencial) a partir de los productos reales.[file:79]
  - El flujo de "Ver estrategia" todavía es frágil: la llamada a `/api/generate-strategy` puede devolver 500 y el frontend rompe al hacer `.split` sobre una respuesta `undefined`, dejando la pantalla negra.

## 2. Supabase
- Proyecto: `aeterium-prod` (Dropea)
- Tablas existentes relevantes (resumen):
  - `public.products`, `public.orders`, `public.listings`, `public.strategies` (y otras específicas del dominio).[file:79]
- RLS: activado en tablas públicas, pero con políticas `anon_*` demasiado permisivas en algunos casos (USING/WITH CHECK = `true`).[file:79]
- **Nuevo concepto a introducir**: tablas para gestión de tops (aún no creadas en el momento de esta actualización):
  - `tops`
  - `top_products`

## 3. Problemas conocidos
- **Robustez de estrategia IA**
  - `/api/generate-strategy` devuelve 500 en ciertos casos.
  - El modal de "Ver estrategia" asume siempre una respuesta de texto válida y ejecuta `.split` sobre campos que pueden ser `undefined`, lo que dispara errores en el bundle y deja la pantalla en negro.

- **Enlaces externos a Dropea**
  - El botón "Ir al producto" desde el dashboard intenta abrir la ficha del producto en Dropea, pero en algunos casos la URL construida devuelve 404.

- **RLS y seguridad**
  - Aunque el panel lo usa actualmente un único usuario, dejar RLS mal definido o demasiado abierto puede ser problemático cuando se escale el uso.
  - Es prioritario revisar y endurecer políticas una vez estabilizadas las nuevas tablas (`tops`, `top_products`, conversaciones, decisiones, etc.).

## 4. Fase en curso

### Fase: Crear Top Manual (Top 5 por margen) + Sala de Guerra básica

Objetivo de esta fase:
- Introducir el concepto de `Top` y `Top Products` como primera unidad estratégica de trabajo.
- Implementar:
  1. Tablas `tops` y `top_products` en Supabase.
  2. Endpoint `/api/create-top-manual` que:
     - Llama a `/api/products`.
     - Selecciona el Top 5 por margen.
     - Inserta un registro en `tops` y 5 registros en `top_products`.
  3. Un botón en el dashboard principal: **"Crear Top Manual (Top 5 por margen)"** que dispara el endpoint anterior.
  4. Una vista básica tipo `/top/:id` (Sala de Guerra inicial) que muestra:
     - Cabecera del top (nombre, tipo, estado).
     - Tabla con productos del top.
     - Un área placeholder para el futuro chat estratégico.

Estado:
- Diseño funcional definido en esta sesión (15/04/2026).
- Pendiente de implementación por el agente (backend + frontend + SQL en Supabase), respetando la infraestructura existente.

## 5. Próximas fases planificadas

1. **Fase A – Robustez de "Ver estrategia"**
   - Backend:
     - Endurecer `/api/generate-strategy` para manejar errores de Gemini y devolver siempre JSON con estructura clara (`{ strategy: string }` en éxito, `{ error: string }` en fallo).[file:79]
   - Frontend:
     - Validar la respuesta antes de procesarla (no usar `.split` sobre valores no definidos).
     - Mostrar estados de error amigables en el modal en lugar de romper la UI.
     - Garantizar que el modal siempre se puede cerrar aunque la API falle.

2. **Fase B – Selector de Top avanzado (briefing + alternativas)**
   - Formulario de briefing en el dashboard principal para definir:
     - Categoría, tipo de top (5/10/20), plataformas (marketplaces, redes, web + ads), objetivo del top.
   - Nuevo flujo con modal que muestre 3 alternativas de top generadas por IA (combinaciones de productos + mini-estrategia + score de efectividad estimada).
   - Botón "Ejecutar estrategia" que, al elegir una alternativa, cree el `top` y sus `top_products` en Supabase y redirija a la Sala de Guerra de ese top.

3. **Fase C – Sala de Guerra completa por top**
   - Vista dedicada por `top_id` que incluya:
     - Cabecera con identidad del top y KPIs específicos (beneficio potencial, nº productos activos, etc.).
     - Tabla de productos del top con estados (en prueba, ganador, perdedor, pausado).
     - Chat persistente con un agente especializado en estrategia de ventas para ese top.
     - Bloques estructurados:
       - Plan de publicaciones por marketplace.
       - Prompts de imágenes.
       - Textos por canal (Wallapop, IG, WhatsApp, etc.).
       - Historial de decisiones (pausar/escalar/matar productos o tops).

4. **Fase D – RLS y seguridad reforzada**
   - Activar y revisar RLS en todas las tablas nuevas (`tops`, `top_products`, conversaciones, decisiones) y ajustar las existentes.
   - Asegurar que el frontend usa el rol `anon` con políticas restrictivas, y que cualquier proceso de backoffice/cron utiliza `service_role` según corresponda.[file:79][web:46]

## 6. Notas operativas
- Cualquier cambio de esquema de base de datos debe hacerse vía migraciones o scripts SQL explícitos y documentados aquí.
- No se deben modificar ni eliminar funciones `/api` existentes sin documentar el cambio en este archivo.
- La prioridad en el corto plazo es:
  1. Consolidar el concepto de Top (fase en curso).
  2. Robustecer el flujo de estrategia (`generate-strategy` + modal).
  3. Endurecer RLS y seguridad antes de abrir el sistema a más usuarios.
