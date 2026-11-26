# Aplicación móvil — Peluquería Barbería Ismael

## Primera fase: PWA
- [x] Nombre y descripción oficiales.
- [x] Manifiesto con alcance específico de GitHub Pages.
- [x] Metadatos para instalación en iPhone.
- [x] Registro de service worker.
- [x] Caché limitada a la carcasa pública; sin guardar APIs, autenticación, administración o reservas.
- [ ] Verificar instalación en Android y Safari/iPhone con dispositivos reales.
- [ ] Verificar que el logotipo existente se renderiza correctamente como icono en ambos sistemas.

## Segunda fase: empaquetado para tiendas
Se preparará un proyecto Capacitor aparte que utilice la misma interfaz web. Antes de distribuirlo habrá que probar navegación externa, autenticación Supabase, gestión multimedia y reservas de Google Calendar en ambos sistemas; preparar iconos y capturas; completar privacidad e información legal; y generar builds firmadas con las cuentas del titular.

## Nota de compatibilidad
El manifiesto y el service worker usan la ruta `/ismael-barber-web/`, correspondiente al subdirectorio actual de GitHub Pages. Si cambia el repositorio o se configura un dominio propio, habrá que actualizar las rutas, el alcance y los metadatos.
