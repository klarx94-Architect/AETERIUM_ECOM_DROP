# AETERIUM ECOM DROP — Perplexity Memory

Última actualización: 2026-04-14

## Infraestructura
- Repositorio: klarx94-Architect/AETERIUM_ECOM_DROP
- Rama activa de despliegue: master
- Vercel project: aeterium-ecom-drop
- Vercel project id: prj_lYRKh1iRSajkFnY7lLU7BoYQXBxk
- Vercel team id: team_h4JhRvWvayMJYeKS0fRwU48u
- URL producción: https://aeterium-ecom-drop.vercel.app
- Último deployment READY en producción: dpl_8WouUG9sjySUsQ1a5xy4vp53bJ29

## Supabase
- Proyecto: aeterium-prod dropea
- Project id/ref: mqbarhsrcwqocpzkeplm
- Región: eu-west-1
- Tablas detectadas:
  - public.products (5 filas)
  - public.orders (3 filas)
  - public.listings (2 filas)
  - public.strategies (0 filas)
- RLS activado en todas las tablas
- Advertencia de seguridad: políticas anon_* demasiado permisivas (USING/WITH CHECK true) en products, orders, listings y strategies

## Hallazgos clave del código
- El frontend real está en /frontend
- El despliegue es un frontend React/Vite con páginas:
  - frontend/src/pages/GuerrillaIntel.jsx
  - frontend/src/pages/DropeaSync.jsx
- El frontend NO consume Supabase directamente
- El frontend consume endpoints serverless en /api
- Los endpoints /api usan la API real de Dropea mediante dropea_connector.js
- dropea_connector.js depende de process.env.DROPEA_API_KEY
- GuerrillaIntel carga productos desde GET /api/products
- GuerrillaIntel hace búsquedas dinámicas con POST /api/scan-dynamic
- GuerrillaIntel genera estrategia IA con POST /api/generate-strategy
- DropeaSync crea órdenes con POST /api/orders

## Qué sí es mock o hardcoded
- KPI cards del header en frontend/src/App.jsx están hardcodeadas:
  - Margen Promedio €34.21
  - Productos Activos 47
  - Órdenes Pendientes 3
  - Revenue Est. Hoy €171
- Esos KPIs no vienen ni de Dropea ni de Supabase

## Qué NO es mock
- Tabla principal de Guerrilla Intel: usa /api/products y Dropea real
- Búsqueda de productos: usa /api/scan-dynamic y Dropea real
- Creación de órdenes: usa /api/orders y Dropea real
- Estrategia IA: usa Gemini vía /api/generate-strategy

## Causa probable de la confusión de datos
- En Supabase existen datos seed/test, pero el frontend desplegado no los utiliza
- El dashboard mezcla:
  - KPIs hardcodeados
  - Productos/órdenes desde API real Dropea
- Por eso el sistema parece parcialmente real y parcialmente simulado

## Próximas acciones recomendadas
1. Sustituir KPIs hardcodeados por KPIs calculados desde endpoints reales
2. Decidir una fuente única de verdad:
   - opción A: Dropea como fuente principal y Supabase como cache/histórico
   - opción B: Supabase como capa principal para dashboard y Dropea sólo para sync
3. Verificar en Vercel que existan:
   - DROPEA_API_KEY
   - GEMINI_API_KEY
4. Si se quiere usar Supabase en frontend, habrá que reescribir pages/hooks para leer de Supabase explícitamente

## Nota operativa
Antes de tocar arquitectura, revisar primero las variables de entorno reales en Vercel y confirmar qué fuente debe gobernar cada módulo.
