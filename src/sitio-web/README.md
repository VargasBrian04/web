# Sistema Web Institucional y Portal Académico

## Colegio Nacional Mariscal Francisco Solano López — Caaguazú, Paraguay

Sistema full-stack para la institución educativa con landing pública, oferta
académica (8 bachilleratos), portal de inscripciones y portales autenticados
por rol (docentes, alumnos, padres/encargados y administración).

---

## Stack recomendado

| Capa        | Tecnología                                  | Por qué |
|-------------|---------------------------------------------|---------|
| Frontend    | React 19 + Next.js 15 (App Router)          | SSR/SEO para la parte institucional, velocidad y DX moderna |
| Estilos     | Tailwind CSS v4                             | Sistema de diseño institucional con variables de color |
| Backend     | Next.js Route Handlers + Node.js            | Monorepo simple: una sola app, despliegue sencillo |
| ORM         | Prisma + PostgreSQL 16                      | Tipado fuerte, migraciones y relaciones complejas |
| Auth        | NextAuth v5 (JWT) con roles por sesión      | Roles: ADMIN, TEACHER, STUDENT, PARENT, ASPIRANT |
| Infra       | Docker Compose (Postgres local)             | Entorno reproducible |

> Alternativa válida si el equipo prefiere PHP: migrar el backend a **Laravel
> 12 + Sanctum + MySQL** conservando el mismo modelo de datos.

---

## Estructura de carpetas

```
colegio-solano-lopez/
├─ prisma/
│  ├─ schema.prisma            # Modelo de datos completo
│  └─ seed.ts                  # Bachilleratos + usuarios demo
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx             # Layout raíz (Navbar + Footer)
│  │  ├─ page.tsx               # Landing pública
│  │  ├─ globals.css            # Tailwind + variables institucionales
│  │  ├─ login/page.tsx         # (pendiente) Ingreso con roles
│  │  ├─ inscripciones/page.tsx # (pendiente) Portal de inscripción
│  │  ├─ portal/
│  │  │  ├─ layout.tsx          # (pendiente) Middleware de protección por rol
│  │  │  ├─ profesor/page.tsx   # (pendiente) Calificaciones, asistencia, tareas
│  │  │  ├─ alumno/page.tsx     # (pendiente) Notas, asistencia, tareas
│  │  │  └─ padre/page.tsx      # (pendiente) Vista de hijos
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ grades/route.ts     # GET/POST calificaciones (por rol)
│  │     ├─ attendance/route.ts # (pendiente)
│  │     ├─ assignments/route.ts# (pendiente)
│  │     └─ enrollments/route.ts# (pendiente)
│  ├─ components/
│  │  ├─ landing/               # Navbar, Hero, Sections, Footer
│  │  └─ portal/                # Tablas de notas, asistencia (pendiente)
│  └─ lib/
│     ├─ prisma.ts              # Cliente singleton
│     └─ auth.ts                # NextAuth config + roles
├─ public/images/               # logo-colegio.png, hero-colegio.jpg, gallery-*
├─ docker-compose.yml           # PostgreSQL 16
└─ .env                         # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

---

## Modelo de datos (resumen)

- **users** — tabla central con `role` (ADMIN, TEACHER, STUDENT, PARENT,
  ASPIRANT), CI único, email, hash de contraseña.
- **Perfiles**: `teachers`, `students`, `guardians` (1-1 con `users`);
  `student_guardians` (N-N entre encargados e hijos).
- **Oferta**: `academics` (8 bachilleratos), `subjects` (materias por curso),
  `classes` (cursos/divisiones), `teacher_subjects`.
- **Inscripciones**: `enrollments` (alumno + bachillerato + período + estado +
  documentos JSON).
- **Académico**: `periods`, **`grades` (calificación 1-5 por alumno/materia/
  período)**, `attendance`, `assignments`, `assignment_submissions`.

El archivo `prisma/schema.prisma` contiene los `@@map` y relaciones completas.

---

## Inicio rápido — solo ver la página (sin base de datos)

Para apreciar la landing pública **no se necesita PostgreSQL**: la base de
datos solo se usa en los módulos de login, inscripción y portal académico.

```bash
# 1) Instalar Node.js LTS desde https://nodejs.org/es (obligatorio)

# 2) Entrar a la carpeta del proyecto
cd "C:\Users\Brian XP\Documents\Default Project\colegio-solano-lopez"

# 3) Instalar dependencias
npm install

# 4) Levantar el servidor de desarrollo
npm run dev

# 5) Abrir en el navegador
#    http://localhost:3000
```

## Instalación completa (con base de datos)

```bash
# 1) Clonar / copiar la carpeta y entrar
cd colegio-solano-lopez

# 2) Instalar dependencias
npm install

# 3) Levantar PostgreSQL (Docker)  — o usar un Postgres existente
docker compose up -d

# 4) Configurar variables de entorno
cp .env.example .env
#   editar .env: DATABASE_URL, NEXTAUTH_SECRET (openssl rand -base64 32)

# 5) Crear el esquema + seed de demostración
npx prisma generate
npm run prisma:migrate
npm run seed

# 6) Levantar en desarrollo
npm run dev   # -> http://localhost:3000
```

**Usuarios demo** (contraseña: `12345678`):

- `direccion@colegio.edu.py` — Administrador
- `profesor@colegio.edu.py` — Docente
- `alumno@colegio.edu.py` — Alumno

---

## Imágenes pendientes

Colocar en `public/images/` (el modelo y las rutas ya las referencian):

- `logo-colegio.png` — escudo del colegio (también debe agregarse a `public/images/`).
- `hero-colegio.jpg` — foto institucional del frontis (se aplica overlay oscuro automáticamente).
- `gallery-1.jpg` … `gallery-4.jpg` — galería (instalaciones, laboratorios, actos, deporte).

---

## Próximos pasos sugeridos

1. Vistas de inscripción (`/inscripciones`) con selección de bachillerato,
   carga de documentos y envío.
2. Middleware de Next.js para proteger rutas `/portal/*` según rol.
3. Portales: profesor (carga de notas/asistencia, tareas), alumno y padre
   (consulta de notas por período e historial).
4. Panel admin: gestión de usuarios, bachilleratos, materias y cursos.
5. Despliegue: Vercel (frontend + API) y un Postgres administrado (Neon/Supabase).