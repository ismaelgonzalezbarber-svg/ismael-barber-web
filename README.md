# Peluquería Barbería Ismael — web + panel de administración

Esta carpeta contiene una base de proyecto Node.js para la web pública y el panel privado. No es solo un HTML estático: el panel utiliza un servidor para proteger el acceso y guardar los cambios.

## Incluye
- Pestañas Inicio, Servicios, Reservas y Contacto.
- Servicios/precios editables en administración.
- Horarios editables en administración.
- Login privado con contraseña bcrypt, sesiones almacenadas en SQLite, cookies `HttpOnly` y límite de intentos.
- Endpoints para consultar y cancelar eventos de Google Calendar mediante OAuth2.
- Los servicios y horarios guardados se reflejan en la web pública.

## Importante sobre Google Calendar
La web actual indica que usa Google Calendar, pero la página pública no expone por sí sola las credenciales ni el mecanismo de integración. Esta versión conserva el enlace actual de reservas para los clientes. Para administrar citas dentro del panel hay que conectar la cuenta/calendario correcto en el servidor. No se debe publicar ningún secreto en el navegador ni subirlo a GitHub.

La API de eventos usa OAuth2 con un `GOOGLE_REFRESH_TOKEN`. Para generar y guardar ese token de forma segura, el propietario de la cuenta debe completar el flujo OAuth de Google en un entorno de confianza. Comparte el calendario correcto con la cuenta/API que se configure y confirma que es el calendario que actualmente recibe las reservas.

## Requisitos
- Node.js 20 o superior.
- Un hosting que ejecute Node.js y permita almacenamiento persistente (para SQLite y JSON).
- HTTPS en producción.

## Instalación local
1. Instala Node.js 20+.
2. Descomprime la carpeta.
3. Copia `.env.example` a `.env`.
4. Crea un hash bcrypt para la contraseña de administrador:

   ```bash
   node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "PON_AQUI_UNA_CONTRASENA_LARGA"
   ```

   Copia el hash resultante a `ADMIN_PASSWORD_HASH` en `.env`. No pongas la contraseña en el código fuente.
5. Cambia `SESSION_SECRET` por una clave aleatoria larga (32+ caracteres).
6. Desde la carpeta del proyecto ejecuta:

   ```bash
   npm install
   npm start
   ```

7. Abre `http://localhost:3000`. Entra en “Administración” al pie de página.

## Configurar Google Calendar
1. En Google Cloud Console, crea/selecciona un proyecto y habilita Google Calendar API.
2. Configura una credencial OAuth de tipo aplicación web y añade la URI de redirección exacta de `GOOGLE_REDIRECT_URI`.
3. Configura `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y el calendario correcto en `.env`.
4. Completa el flujo OAuth autorizado para obtener un refresh token y guárdalo en `GOOGLE_REFRESH_TOKEN` en el servidor.
5. Define `GOOGLE_CALENDAR_ID` con el ID de la agenda que recibe las reservas (no asumas que `primary` es la correcta).
6. Prueba lectura y cancelación de una cita de prueba antes de abrir el panel a uso real.

**No compartas ni publiques** `.env`, contraseñas, tokens de Google ni cookies de sesión.

## Antes de publicar
- Despliega en un hosting Node.js con HTTPS y almacenamiento persistente.
- Configura `NODE_ENV=production`, `BASE_URL`, `SESSION_SECRET`, credenciales Google y hash del administrador.
- Cambia `GOOGLE_REDIRECT_URI` al dominio final y registra esa URI en Google Cloud.
- Revisa duración de cada servicio y horario real.
- Verifica si el calendario actual admite esta API; si la reserva actual depende de una función o cuenta distinta, habrá que conectar esa integración específica.
- Añade una política de privacidad y la información legal que corresponda.
- Haz copia de seguridad de `data/services.json`, `data/settings.json` y `data/sessions.sqlite` (si procede).

## Limitaciones de esta entrega
- El enlace de reserva pública continúa abriendo la página actual de reservas.
- El panel puede leer y cancelar eventos de Google Calendar una vez configurado OAuth2.
- No se han configurado credenciales de Google, hosting ni cuenta de administrador por ti.
- El horario editable se muestra en la web; la disponibilidad que ve el cliente sigue dependiendo de la lógica configurada en la agenda de reservas existente. Para sincronizar disponibilidad, duración del servicio y creación de citas desde esta nueva web se necesita completar la integración concreta del calendario actual.
- Los datos de contacto y los precios son iniciales y deben confirmarse antes de publicar.
