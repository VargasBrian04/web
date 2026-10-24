/**
 * Carga el catálogo REAL de materias (prisma/materias.json) en la base.
 *
 * Fuente: planillas .xls de Dirección ("Planilla de materias de todos los
 * bachilleres"), una por bachillerato: horario semanal por curso con
 * hora | materia | docente.
 *
 * Reglas:
 *  - Crea los Academic que falten (ADN, BTC y EEB).
 *  - EEB se crea INACTIVO: sus materias deben aparecer en el registro pero no
 *    como "bachillerato" en el selector de la zona Media.
 *  - NUNCA borra. Hace UPSERT semántico por (bachiller, curso, nombre) para no
 *    duplicar materias que ya existen con otro código (p. ej. BTS-MAT1 vs
 *    BTS-MAT) ni tocar el curso de materias vinculadas a docentes reales.
 *  - Códigos: reutiliza los que ya existen donde aplica (BTI-MAT, BTI-ALG,
 *    BTE-FIS, BTS-MAT1/2/3, CIV-MAT) para no romper vínculos.
 *
 * Uso:  node prisma/cargar-materias.cjs [--seco]
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient, BachilleratoType } = require("@prisma/client");

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Códigos del sitio (landing/logos) -> códigos reales en la base (Academic.code)
// ---------------------------------------------------------------------------
const A_DB = {
  EEB: "EEB",
  ADN: "ADN",
  BTA: "AGR",
  CCB: "CCB",
  BTCC: "CIV",
  CCS: "CCS",
  BTC: "BTC",
  BTE: "BTE",
  BTI: "BTI",
  BTM: "MEC",
  BTS: "BTS",
};

// Abreviaturas estables por nombre de materia
const ABBR = {
  "Matemática": "MAT",
  "Matemática Aplicada": "MAP",
  "Castellano": "CAS",
  "Literatura": "LIT",
  "Inglés": "ING",
  "Guaraní": "GUA",
  "Ciencias": "CIE",
  "Física": "FIS",
  "Física II": "FIS2",
  "Química": "QUI",
  "Química I": "QUI1",
  "Laboratorio de Química": "LDQ",
  "Biología": "BIO",
  "Historia": "HIS",
  "Educación Física": "EDF",
  "Formación Ética": "FET",
  "Orientación": "ORI",
  "Artes": "ART",
  "Música": "MUS",
  "Proyecto": "PRO",
  "Salud": "SAL",
  "Trabajo y Tecnología": "TYT",
  "Sociología": "SOC",
  "Antropología": "ANT",
  "Antropología Social": "ANS",
  "Psicología": "PSI",
  "Filosofía": "FIL",
  "Lógica": "LOG",
  "Estadística": "EST",
  "Cálculo": "CAL",
  "Economía": "ECO",
  "Administración": "ADM",
  "Administración Financiera": "ADF",
  "Contabilidad": "CON",
  "Contabilidad y Legislación": "CYL",
  "Informática": "INF",
  "Mercadotecnia": "MER",
  "Educación Vial": "EDV",
  "Plan Optativo": "PLO",
  "Algorítmica": "ALG",
  "Electrónica": "ELE",
  "Electrotecnia": "ETN",
  "Instalaciones": "INS",
  "Laboratorio": "LAB",
  "Laboratorio de Electrónica": "LDE",
  "Dibujo Técnico": "DIB",
  "Diseño": "DIS",
  "Software": "SOF",
  "Hardware": "HAR",
  "Gabinete": "GAB",
  "Mecánica Aplicada": "MCA",
  "Taller": "TAL",
  "Taller de Mecánica": "TMC",
  "Técnicas": "TEC",
  "Estabilidad": "ESA",
  "Topografía": "TOP",
  "Anatomía": "ANA",
  "Farmacología": "FAR",
  "Patología": "PAT",
  "Nutrición": "NUT",
  "Práctica": "PRA",
  "Salud Comunitaria": "SAC",
  "Salud Pública": "SAP",
  "Atención Básica de Salud": "ABS",
  "Educación para la Salud": "EPS",
  "Agricultura": "AGR",
  "Horticultura": "HOR",
  "Agroindustria": "AGI",
  "Extensión Rural": "EXR",
  "Proyecto Productivo": "PPR",
  "Ganado Mayor": "GMA",
  "Ganado Menor": "GME",
  "Fruti-Silvicultura": "FRS",
  "Maquinarias": "MAQ",
  "Educación Ambiental": "EAM",
  "Educación Financiera": "EFI",
  "Investigación": "INV",
  "Política": "POL",
  "PyMEs": "PYM",
  "Seminario": "SEM",
  "Introducción": "INT",
};

// Nombres que en la base están escritos distinto y significan lo mismo
const ALIAS_NOMBRE = {
  "lengua y literatura": "literatura",
  "lengua castellana": "castellano",
  "matematicas": "matematica",
  "informatica aplicada": "informatica aplicada",
};

// Definiciones de los Academic que pueden faltar
const ACADEMICOS = {
  ADN: {
    code: "ADN",
    shortName: "Administración",
    name: "Bachillerato en Administración de Negocios",
    type: BachilleratoType.TECNICO,
    duration: "3 años",
    level: "Nivel Medio - Técnico",
    description:
      "Gestión, administración y emprendedurismo para el mundo de los negocios.",
  },
  BTC: {
    code: "BTC",
    shortName: "Contabilidad",
    name: "Bachillerato Técnico en Contabilidad",
    type: BachilleratoType.TECNICO,
    duration: "3 años",
    level: "Nivel Medio - Técnico",
    description:
      "Gestión contable y administrativa con salida laboral y base para estudios universitarios.",
  },
  // EEB: inactivo a propósito -> aparece en el registro, no como bachillerato
  EEB: {
    code: "EEB",
    shortName: "Educación Escolar Básica",
    name: "Educación Escolar Básica (7.º a 9.º)",
    type: BachilleratoType.TECNICO,
    duration: "3 años",
    level: "Nivel Básico",
    description:
      "Ciclo básico: 7.º, 8.º y 9.º grados, turnos mañana y tarde.",
    active: false,
  },
};

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonNombre(s) {
  const n = norm(s);
  return ALIAS_NOMBRE[n] || n;
}

function abrev(nombre) {
  const a = ABBR[nombre];
  if (a) return a;
  return norm(nombre).replace(/[^a-z0-9]/g, "").slice(0, 3).toUpperCase() || "MAT";
}

async function main() {
  const seco = process.argv.includes("--seco");
  console.log("Cargando materias reales — modo: " + (seco ? "SECO (sin escribir)" : "REAL"));

  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "materias.json"), "utf8")
  );

  // 1) Asegurar Academic
  const academicos = {};
  for (const codigo of Object.values(A_DB)) {
    const def = ACADEMICOS[codigo];
    let a = await prisma.academic.findUnique({ where: { code: codigo } });
    if (!a && def) {
      a = await prisma.academic.create({ data: def });
      console.log("  Academic CREADO: " + codigo + (def.active === false ? " [inactivo]" : ""));
    } else if (a && codigo === "EEB" && a.active) {
      a = await prisma.academic.update({ where: { code: codigo }, data: { active: false } });
      console.log("  Academic EEB -> inactivo");
    } else if (a) {
      console.log("  Academic existe: " + codigo);
    } else {
      console.log("  !! Academic sin definición y no existe: " + codigo);
      continue;
    }
    academicos[codigo] = a;
  }

  // 2) Materias existentes -> índices por código y por (bachiller, curso, nombre)
  const existentes = await prisma.subject.findMany({
    select: { id: true, code: true, name: true, gradeYear: true, academicId: true },
  });
  const porCodigo = new Map(existentes.map((s) => [s.code, s]));
  const porNombre = new Map();
  for (const s of existentes) {
    porNombre.set(s.academicId + "|" + s.gradeYear + "|" + canonNombre(s.name), s);
  }

  let creadas = 0;
  let actualizadas = 0;
  let sinCambios = 0;
  const resumen = [];
  const tocadas = [];

  for (const [codSitio, d] of Object.entries(data)) {
    const codDb = A_DB[codSitio];
    const acad = academicos[codDb];
    if (!acad) {
      console.log("  !! sin academic para " + codSitio + " (" + codDb + ") — se omite");
      continue;
    }
    const cursos = Object.keys(d.cursos).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const usados = new Set();

    // Código libre: el corto si es de este academic y curso; si no, corto+curso
    function codigoLibre(base, gradeYear) {
      const p = porCodigo.get(base);
      if (!p) return base;
      if (p.academicId === acad.id && p.gradeYear === gradeYear && !usados.has(base)) return base;
      let n = gradeYear;
      while (true) {
        const cand = base + n;
        const q = porCodigo.get(cand);
        const libre = !q || (q.academicId === acad.id && q.gradeYear === gradeYear);
        if (libre && !usados.has(cand)) return cand;
        n++;
        if (n > 20) return base + "-x" + gradeYear;
      }
    }

    for (const curso of cursos) {
      const gradeYear = parseInt(curso, 10);
      for (const nombre of d.cursos[curso]) {
        // 2a) ¿Ya existe esta materia en este bachiller y curso (aunque con otro código)?
        let destino = porNombre.get(acad.id + "|" + gradeYear + "|" + canonNombre(nombre));

        // 2b) Si no, buscar por código reutilizable
        if (!destino) {
          const code = codigoLibre(codDb + "-" + abrev(nombre), gradeYear);
          destino = porCodigo.get(code) || null;
          if (destino && destino.academicId !== acad.id) destino = null;
          if (destino && destino.gradeYear !== gradeYear) destino = null;
          if (destino) destino._codeNuevo = code;
        }

        if (destino) {
          const cambios = {};
          if (destino.name !== nombre) cambios.name = nombre;
          if (destino._codeNuevo && destino._codeNuevo !== destino.code) cambios.code = destino._codeNuevo;
          if (Object.keys(cambios).length) {
            if (!seco) await prisma.subject.update({ where: { id: destino.id }, data: cambios });
            actualizadas++;
            tocadas.push(destino.code + " -> " + (cambios.name || destino.name) + (cambios.gradeYear ? " (año " + cambios.gradeYear + ")" : ""));
            console.log(
              "  ACTUALIZA " + destino.code +
              (cambios.code ? " -> " + cambios.code : "") +
              ": " + destino.name + " (año " + destino.gradeYear + ") -> " + (cambios.name || destino.name) + " (año " + gradeYear + ")"
            );
          } else {
            sinCambios++;
          }
          usados.add(destino.code);
          continue;
        }

        // 2c) Crear
        const code = codigoLibre(codDb + "-" + abrev(nombre), gradeYear);
        usados.add(code);
        if (!seco) {
          await prisma.subject.create({
            data: { academicId: acad.id, code, name: nombre, gradeYear },
          });
        }
        creadas++;
        console.log("  CREA " + code + " | " + nombre + " | " + curso + " | " + codDb);
        const nuevo = { id: "nuevo-" + code, code, academicId: acad.id, name: nombre, gradeYear };
        porCodigo.set(code, nuevo);
        porNombre.set(acad.id + "|" + gradeYear + "|" + canonNombre(nombre), nuevo);
      }
    }
    resumen.push("  " + codDb + ": " + cursos.map((c) => c + " (" + d.cursos[c].length + ")").join(", "));
  }

  console.log("\n===== RESUMEN =====");
  console.log(resumen.join("\n"));
  console.log("\nCreadas: " + creadas + " | Actualizadas: " + actualizadas + " | Sin cambios: " + sinCambios);
  if (tocadas.length) {
    console.log("\n=== MATERIAS PREEXISTENTES MODIFICADAS ===");
    tocadas.forEach((t) => console.log("  " + t));
  }
  console.log("Total subjects ahora: " + (seco ? "(modo seco)" : await prisma.subject.count()));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
