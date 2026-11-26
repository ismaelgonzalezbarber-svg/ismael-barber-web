# Aplicación móvil — Peluquería Barbería Ismael

## Primera fase: PWA
- [x] Manifiesto PWA con nombre, rutas y visualización standalone.
- [x] Iconos PNG de 192 y 512 píxeles para la instalación.
- [x] Metadatos de instalación en iPhone y botón de ayuda para móviles.
- [x] Registro de service worker.
- [x] Caché limitada a la carcasa pública y los iconos; no guarda autenticación, administración, APIs ni reservas.
- [ ] Probar instalación y navegación en dispositivos Android y iPhone reales.
- [ ] Confirmar si el icono provisional de monograma BI debe sustituirse por una versión cuadrada del logotipo oficial.

## Segunda fase: publicación en tiendas
Se ha añadido un paquete independiente de Capacitor en `mobile/` para generar aplicaciones Android e iOS a partir de la misma interfaz web. Antes de distribuirlo habrá que probar navegación externa, inicio de sesión Supabase, gestión multimedia y reservas de Google Calendar en ambos sistemas; preparar recursos gráficos finales; completar privacidad e información legal; y generar builds firmadas con las cuentas del titular.

## Notas
- La web y la PWA siguen en la raíz del repositorio; el paquete Capacitor copia los archivos públicos a `mobile/www` y excluye el registro PWA de la app nativa.
- El modo sin conexión conserva la estructura pública, pero los contenidos de Supabase y el calendario siguen necesitando conexión.
- El manifiesto y el service worker usan `/ismael-barber-web/`, correspondiente al subdirectorio actual de GitHub Pages. Si cambia el repositorio o se configura un dominio propio, habrá que actualizar las rutas y el alcance.
- La revisión de App Store exige que la app aporte utilidad suficiente y no sea únicamente una web empaquetada.