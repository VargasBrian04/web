# Colegio Nacional Mariscal Francisco Solano López — Web

Plataforma institucional y portal académico (Caaguazú, Paraguay).

## Estructura

- `src/sitio-web/` — App Next.js 15 + Prisma + PostgreSQL (portal real).
  La portada `/` sirve `public/vista-previa.html`; el portal vive en
  `/acceso`, `/login`, `/portal/*` y `/api/*`.
- `src/index.html` — Vista previa institucional (fuente de `public/vista-previa.html`).
- `src/fotos-originales/` — Respaldo de fotos en calidad original.

## Deploy en Vercel

- Root Directory: `src/sitio-web`
- Variables obligatorias: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- El build corre `prisma migrate deploy` y falla si la base no responde
  (no se ocultan migraciones fallidas). Para compilar sin migrar:
  `npm run build:next`.
- Seed: **no se ejecuta solo**. Requiere `SEED_ADMIN_PASSWORD` (mín. 12
  caracteres) y no toca contraseñas existentes:
  `npm run seed --prefix src/sitio-web`.
- Datos de demostración: solo con `SEED_DEMO=1` y `SEED_DEMO_PASSWORD`.
  Nunca en producción real.
- Rotar la contraseña de una cuenta:
  `$env:RESET_USER="direccion"; $env:RESET_PASSWORD="..."; npm run reset:password --prefix src/sitio-web`
  (las sesiones JWT activas siguen hasta 8 h; rotar `NEXTAUTH_SECRET`
  para cortarlas de inmediato).

### Seguridad incluida (Paquete 1)

- Cabeceras HTTP: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`.
- Rate limit en inscripción pública y login.
- Alcance por rol en asignaciones, asistencia, observaciones, fotolog,
  documentos, cumpleaños y nómina docente.
- Los listados de noticias/galería ya no envían imágenes en base64:
  se sirven por `/api/news/:id/image` y `/api/media/:id/image`.
- Layouts por rol en `/portal/admin`, `/portal/profesor`,
  `/portal/alumno` y `/portal/padre` como defensa en profundidad.
- La portada estática ya no embebe ~12 MB de imágenes: usa
  `public/images/landing/*.webp`.

## Desarrollo local

```
cd src/sitio-web
npm ci
docker compose up -d
npx prisma migrate dev
$env:SEED_ADMIN_PASSWORD="una-clave-larga"
npm run seed
npm run dev
```

