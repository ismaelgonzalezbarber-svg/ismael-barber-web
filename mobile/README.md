# Aplicación móvil — Peluquería Barbería Ismael

Este proyecto empaqueta la misma interfaz web en aplicaciones Android e iOS con Capacitor. La web pública y su PWA permanecen en la raíz del repositorio y se mantienen separadas del paquete móvil.

## Requisitos
- Node.js 22 o posterior.
- Android: Android Studio y Android SDK.
- iOS: macOS con Xcode instalado. Para compilar y firmar la app iOS se necesita el entorno de Apple correspondiente.

## Preparación
```bash
cd mobile
npm install
npx cap add android
npx cap add ios
npm run sync
```

Los comandos `cap add` se ejecutan una sola vez y crean los proyectos nativos. Después de actualizar la web, ejecutar `npm run sync` para copiar los archivos y sincronizar las plataformas.

## Abrir los proyectos
```bash
npm run open:android
npm run open:ios
```

## Antes de enviar a las tiendas
- Probar el inicio de sesión de Supabase, la galería, las subidas desde el panel y las reservas de Google Calendar en dispositivos físicos.
- Confirmar el comportamiento de enlaces a WhatsApp, teléfono, mapas y calendario dentro de los contenedores nativos.
- Completar iconos finales, capturas, descripción, privacidad, soporte y datos legales.
- Proporcionar a Apple acceso de revisión a las funciones con autenticación, mediante una cuenta de demostración adecuada.
- Incorporar utilidad móvil real y comprobar que la aplicación aporta más que una simple web empaquetada; Apple puede rechazar aplicaciones con funcionalidad mínima.
- Generar y firmar los paquetes con las cuentas de desarrollador del titular.

La configuración no publica nada automáticamente ni garantiza la aprobación de las tiendas. La revisión depende de los requisitos vigentes de Google Play y App Store.