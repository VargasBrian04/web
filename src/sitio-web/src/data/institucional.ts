// Datos institucionales centrales — Colegio Nacional Mariscal Francisco Solano López.
// Fuentes: mensajes de Dirección (octubre 2026) y PEI institucional.
// TODO lo no confirmado se marca como "Información pendiente" en la UI.

export const PENDING = "Información pendiente";

export const studentStats = {
  source: "Dirección · Año 2026",
  total: 1577,
  levels: [
    { name: "Educación Escolar Básica (7.º, 8.º y 9.º)", total: 621, detail: "Turnos mañana (TM) y tarde (TT)" },
    { name: "Bachillerato Científico (Ciencias Básicas y Ciencias Sociales)", total: 337, detail: "CB “A”, CB “B”, Sociales, CB TT y Sociales TN" },
    { name: "Bachillerato en Servicios (Salud, Informática, Contabilidad y Adm. de Negocios)", total: 287, detail: "BTS, BTI, BTC y ADN" },
    { name: "Técnico Industrial (Electricidad, Mecánica, Construcción Civil y Agropecuaria)", total: 332, detail: "BTE, BTM, BTCC y BTA" },
  ],
  eeb: [
    {
      grade: "7.º grado",
      total: 162,
      tm: [
        { course: "7.º A", count: 31 },
        { course: "7.º B", count: 27 },
        { course: "7.º C", count: 25 },
      ],
      tt: [
        { course: "7.º A", count: 26 },
        { course: "7.º B", count: 27 },
        { course: "7.º C", count: 26 },
      ],
    },
    {
      grade: "8.º grado",
      total: 205,
      tm: [
        { course: "8.º A", count: 38 },
        { course: "8.º B", count: 35 },
        { course: "8.º C", count: 27 },
      ],
      tt: [
        { course: "8.º A", count: 29 },
        { course: "8.º B", count: 26 },
        { course: "8.º C", count: 26 },
        { course: "8.º D", count: 24 },
      ],
    },
    {
      grade: "9.º grado",
      total: 254,
      tm: [
        { course: "9.º A", count: 38 },
        { course: "9.º B", count: 41 },
        { course: "9.º C", count: 38 },
        { course: "9.º D", count: 29 },
      ],
      tt: [
        { course: "9.º A", count: 26 },
        { course: "9.º B", count: 28 },
        { course: "9.º C", count: 29 },
        { course: "9.º D", count: 25 },
      ],
    },
  ],
  media: [
    {
      group: "Bachiller Científico",
      total: 337,
      rows: [
        { orientation: "Ciencias Básicas “A”", c1: 32, c2: 33, c3: 30 },
        { orientation: "Ciencias Básicas “B”", c1: 30, c2: 23, c3: 27 },
        { orientation: "Ciencias Sociales", c1: 24, c2: 20, c3: 27 },
        { orientation: "Ciencias Básicas TT", c1: 22, c2: 24, c3: 22 },
        { orientation: "Ciencias Sociales TN", c1: 9, c2: 7, c3: 7 },
      ],
    },
    {
      group: "Bachiller Técnico en Servicios",
      total: 287,
      rows: [
        { orientation: "Salud (BTS)", c1: 35, c2: 31, c3: 33 },
        { orientation: "Informática (BTI)", c1: 35, c2: 28, c3: 26 },
        { orientation: "Contabilidad (BTC)", c1: 10, c2: 12, c3: 17 },
        { orientation: "Administración de Negocios (ADN)", c1: 18, c2: 20, c3: 22 },
      ],
    },
    {
      group: "Bachiller Técnico Industrial",
      total: 332,
      rows: [
        { orientation: "Electricidad (BTE)", c1: 39, c2: 32, c3: 33 },
        { orientation: "Mecánica (BTM)", c1: 27, c2: 18, c3: 19 },
        { orientation: "Construcción Civil (BTCC)", c1: 28, c2: 26, c3: 28 },
        { orientation: "Agropecuaria (BTA)", c1: 35, c2: 23, c3: 24 },
      ],
    },
  ],
};

export const historyText = {
  intro:
    "Reseña histórica de nuestra querida institución, extraída del PEI institucional. Reseña: Dr. Derlis Ortiz, docente del colegio.",
  quote:
    "Cómo, cuándo y con quiénes se inició la vida institucional del Colegio Nacional de E.M.D. “Mariscal Francisco Solano López”, o “Mcal. López” —a secas muchas veces para acortar su nombre— “Nacional”. Sin ánimo de polemizar, mucho menos condenar o buscar culpables ni razones, buscando la objetividad y, por sobre todo, ser fieles a la historia real del origen del Colegio, se transcriben los pormenores del nacimiento de ella. Para ello se recurre al relato y vivencias de quienes fueron protagonistas de aquellas gestiones; nos referimos a los profesores Cantalicio Borja, Lic. Gliceria Fleitas de Martínez, Blanca Gallardo de Ortiz, Santiago Ramírez, Cipriano Ruiz Díaz y el señor Bienvenido Gallardo Legal, uno de los ex intendentes de Caaguazú, quienes fueron las fuentes históricas durante un encuentro con alumnos y profesores realizado en el colegio el 22 de junio del 2005. Según relatos de la profesora Gliceria, la semilla surgió durante los viajes a la Universidad Católica de Villarrica de varios de ellos. Posteriormente se mencionó la necesidad de habilitar un colegio secundario para personas de escasos recursos. La profesora María Luisa Gallardo de Rivaldi —ya fallecida— tuvo activa participación en las gestiones y solicitó ante la Junta Municipal el predio para la institución. El 20 de diciembre de 1969 el Ministro entrega la Resolución de habilitación del Liceo, y el 1.º de marzo de 1970 se inician las clases en el local de la Municipalidad de Caaguazú. Como el Liceo aún no tenía nombre, se le asignó el de “Mariscal Francisco Solano López” de forma casi espontánea: siendo el primero de marzo, año del centenario de la muerte del Mariscal —Centenario de la Epopeya Nacional—, ese era el nombre que le correspondía. Entre los primeros profesores figuran Blanca Gallardo de Ortiz, Lorenza Argüello, la profesora Hialina, Bienvenido Gallardo Legal —reemplazado luego por el profesor Cantalicio Borja— y Santiago Ramírez. Primera directora: María Luisa Gallardo de Rivaldi. Primera secretaria: Herenia Ríos de Leiva. El uniforme de entonces: pantalón negro con camisa rosa. En abril de 1970 el Liceo se muda a la escuela Lucía Tavarozzi (hoy Delfín Chamorro); en 1971, a la Seccional Colorada; el 24 de mayo de 1972, al local del actual Colegio “Carlos Antonio López”. En 1978 se muda al flamante y actual local. El 2 de marzo de 1979 inician las clases en el moderno local, y el 2 de abril se realiza la entrega oficial a cargo del Ministro Raúl Peña, con la implementación del currículo “Innovaciones Educacionales”: nace el Colegio de Enseñanza Media y Diversificada bajo la dirección de la Lic. Nimia Morales de Servín, y con él LOS BACHILLERATOS TÉCNICOS. Fuente: PEI.",
  note: "Texto completo disponible en la carpeta del sitio: “Reseña Histórica (revisada).txt”. Dos fragmentos del original vienen truncos y un apellido incompleto — a completar por la Dirección.",
  milestones: [
    { title: "20 dic 1969", text: "El Ministro entrega la Resolución de habilitación del Liceo." },
    { title: "1.º mar 1970", text: "Inicio de clases en la Municipalidad de Caaguazú. El Liceo recibe el nombre “Mariscal Francisco Solano López”, en el centenario de la muerte del Mariscal." },
    { title: "1970 – 1972", text: "Mudanzas: escuela Lucía Tavarozzi (abr 1970, hoy Delfín Chamorro), Seccional Colorada (1971) y local del actual Colegio “Carlos Antonio López” (24 may 1972)." },
    { title: "1978 – 1979", text: "Mudanza al actual local (1978). Inicio de clases el 2 mar 1979 y entrega oficial el 2 abr 1979 por el Ministro Raúl Peña." },
    { title: "1979", text: "“Innovaciones Educacionales”: el Liceo se convierte en Colegio de Enseñanza Media y Diversificada (directora: Lic. Nimia Morales de Servín) y nacen los Bachilleratos Técnicos." },
    { title: "22 jun 2005", text: "Encuentro con los protagonistas en el colegio; sus testimonios sustentan esta reseña." },
    { title: "Actualidad", text: "1.577 estudiantes (octubre 2026), EEB + 10 orientaciones del Nivel Medio y portal académico digital." },
  ],
};

export type GalleryCategory =
  | "Institución"
  | "Actos escolares"
  | "Actividades académicas"
  | "Deportes"
  | "Eventos"
  | "Proyectos"
  | "Actividades culturales";

export const galleryCategories: ("Todas" | GalleryCategory)[] = [
  "Todas",
  "Institución",
  "Actos escolares",
  "Actividades académicas",
  "Deportes",
  "Actividades culturales",
];

export const galleryItems: { src: string; category: GalleryCategory; caption: string }[] = [
  { src: "/images/institucion-frente.jpg", category: "Institución", caption: "Frente del colegio" },
  { src: "/images/gallery-1.jpg", category: "Institución", caption: "Obras y mejoras edilicias" },
  { src: "/images/gallery-3.jpg", category: "Actos escolares", caption: "Festejo del Día de la Juventud" },
  { src: "/images/gallery-deporte.jpg", category: "Deportes", caption: "Día de la Juventud campeones" },
  { src: "/images/galeria/salud-3.jpg", category: "Actos escolares", caption: "Homenaje a la Profe Elcira" },
  { src: "/images/galeria/patio.jpg", category: "Institución", caption: "Patio del colegio" },
  { src: "/images/galeria/palco.jpg", category: "Actos escolares", caption: "Palco del colegio" },
  { src: "/images/galeria/agro-1.jpg", category: "Actividades académicas", caption: "Agropecuaria · Práctica de campo" },
  { src: "/images/galeria/agro-2.jpg", category: "Actividades académicas", caption: "Agropecuaria · Trabajo en parcela" },
  { src: "/images/galeria/agro-3.jpg", category: "Actividades académicas", caption: "Agropecuaria · Producción agrícola" },
  { src: "/images/galeria/agro-4.jpg", category: "Actividades académicas", caption: "Agropecuaria · Campo" },
  { src: "/images/galeria/agro-5.jpg", category: "Actividades académicas", caption: "Agropecuaria · Cultivo" },
  { src: "/images/galeria/agro-6.jpg", category: "Actividades académicas", caption: "Agropecuaria · Producción" },
  { src: "/images/galeria/constr-1.jpg", category: "Actividades académicas", caption: "Construcciones · Obra" },
  { src: "/images/galeria/constr-2.jpg", category: "Actividades académicas", caption: "Construcciones · Taller" },
  { src: "/images/galeria/constr-3.jpg", category: "Actividades académicas", caption: "Construcciones · Práctica" },
  { src: "/images/galeria/constr-4.jpg", category: "Actividades académicas", caption: "Construcciones · Proyecto" },
  { src: "/images/galeria/sociales-2.jpg", category: "Actos escolares", caption: "Sociales · Actividad" },
  { src: "/images/galeria/sociales-3.jpg", category: "Actos escolares", caption: "Sociales · Grupo" },
  { src: "/images/galeria/despedida-1.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 1 de 6" },
  { src: "/images/galeria/despedida-2.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 2 de 6" },
  { src: "/images/galeria/despedida-3.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 3 de 6" },
  { src: "/images/galeria/despedida-4.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 4 de 6" },
  { src: "/images/galeria/despedida-5.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 5 de 6" },
  { src: "/images/galeria/despedida-6.jpg", category: "Actos escolares", caption: "Despedida a Liz Sosa 6 de 6" },
];

export const teacherAreas = ["Todas", "Ciencias", "Técnica", "Humanidades", "EEB"] as const;

export const teachers: {
  name: string;
  subject: string;
  level: string;
  role: string;
  area: (typeof teacherAreas)[number];
  photo?: string;
  bio: string;
}[] = [
  {
    name: PENDING,
    subject: "Bachillerato Técnico en Mecánica",
    level: "Nivel Medio",
    role: "Docente técnico",
    area: "Técnica",
    photo: "/images/galeria/mecanica-5.jpg",
    bio: "Nómina en actualización por la Dirección. " + PENDING + ".",
  },
  {
    name: PENDING,
    subject: "Bachillerato Técnico en Salud",
    level: "Nivel Medio",
    role: "Docente técnica",
    area: "Técnica",
    photo: "/images/galeria/salud-1.jpg",
    bio: "Nómina en actualización por la Dirección. " + PENDING + ".",
  },
  {
    name: PENDING,
    subject: "Ciencias Sociales",
    level: "Nivel Medio",
    role: "Docente",
    area: "Humanidades",
    photo: "/images/galeria/sociales-1.jpg",
    bio: "Nómina en actualización por la Dirección. " + PENDING + ".",
  },
];

export const newsPosts: {
  slug: string;
  title: string;
  date: string;
  category: string;
  author: string;
  image: string;
  excerpt: string;
  content: string[];
}[] = [
  {
    slug: "preinscripcion-1er-curso-media",
    title: "Preinscripción 1er Curso de la Media: 09 y 10 de diciembre",
    date: "2026-11-25",
    category: "Inscripciones",
    author: "Dirección",
    image: "/images/institucion-frente.jpg",
    excerpt: "Fecha de preinscripción, copia de C.I. del alumno y del padre/madre o tutor, y antecedente académico de la EEB. Reunión informativa martes 09/12 a las 07:30 hs.",
    content: [
      "La Dirección convoca a la preinscripción del 1er Curso del Nivel Medio los días 09 y 10 de diciembre.",
      "Requisitos: copia de cédula de identidad del alumno y del padre, madre o tutor, más el antecedente académico de la EEB.",
      "Reunión informativa: martes 09/12 a las 07:30 hs. en el local institucional.",
    ],
  },
  {
    slug: "inscripciones-2026",
    title: "Inscripciones abiertas para el ciclo lectivo 2026",
    date: "2026-10-01",
    category: "Inscripciones",
    author: "Dirección",
    image: "/images/gallery-1.jpg",
    excerpt: "La inscripción se realiza online desde el portal o presencial en Secretaría, de lunes a viernes de 07:00 a 17:00.",
    content: [
      "El Colegio Nacional Mariscal Francisco Solano López informa que las inscripciones para el ciclo lectivo 2026 se encuentran abiertas para la Educación Escolar Básica (7.º a 9.º) y todas las orientaciones del Nivel Medio.",
      "El trámite puede iniciarse online desde la sección Inscripciones de este sitio o en forma presencial en la Secretaría del colegio, de lunes a viernes de 07:00 a 17:00, en la ciudad de Caaguazú.",
      "Los documentos y requisitos por nivel se detallan en las secciones Requisitos de inscripción y Matrículas. Ante cualquier duda, acercarse a Secretaría.",
    ],
  },
  {
    slug: "sphynx-segundo-puesto-hackaton",
    title: "Sphynx, la app de nuestros alumnos, logra el 2.º puesto en el hackatón",
    date: "2026-09-15",
    category: "Académico",
    author: "Coordinación Académica",
    image: "/images/gallery-2.jpg",
    excerpt: "Un equipo de estudiantes representó al colegio en la competencia de hackatón con su aplicación Sphynx y regresó con el segundo puesto.",
    content: [
      "Un equipo de alumnos de la institución participó en la competencia de hackatón, donde presentaron su aplicación titulada Sphynx ante el jurado y los demás competidores.",
      "El proyecto fue reconocido con el segundo puesto de la competencia, un logro que premia la creatividad, el trabajo en equipo y la formación técnica de nuestros estudiantes.",
      "La Dirección y toda la comunidad educativa felicitan a los alumnos por dejar en alto el nombre del Colegio Nacional Mariscal Francisco Solano López.",
    ],
  },
  {
    slug: "comunidad-1577",
    title: "Somos 1.577 estudiantes: la comunidad sigue creciendo",
    date: "2026-10-01",
    category: "Institucional",
    author: "Dirección",
    image: "/images/gallery-3.jpg",
    excerpt: "621 estudiantes en EEB y 956 en el Nivel Medio distribuidos en 10 orientaciones, según datos de octubre 2026.",
    content: [
      "En octubre de 2026 la institución alcanza 1.577 estudiantes: 621 en la Educación Escolar Básica (7.º, 8.º y 9.º) y 956 en el Nivel Medio.",
      "El Nivel Medio se distribuye en Bachillerato Científico (337), Bachillerato en Servicios (287) y Técnico Industrial (332). El detalle por curso y turno puede verse en la sección Estadísticas.",
      "Agradecemos a las familias y docentes que hacen posible este crecimiento sostenido de la educación pública en Caaguazú.",
    ],
  },
];

export const conductRules: { category: string; rules: string[] }[] = [
  {
    category: "Respeto y trato",
    rules: [
      "Tratar con respeto a compañeros, docentes y personal de la institución.",
      "Cuidar el lenguaje y las formas de comunicación dentro y fuera del aula.",
      "Resolver los conflictos mediante el diálogo y la mediación. " + PENDING + " (protocolo oficial en revisión).",
    ],
  },
  {
    category: "Asistencia y puntualidad",
    rules: [
      "Asistir puntualmente a clases en el turno correspondiente (mañana/tarde).",
      "Justificar las inasistencias ante la Secretaría o la tutoría del curso.",
      "Régimen de asistencia y sanciones: " + PENDING + " (ver reglamento interno).",
    ],
  },
  {
    category: "Cuidado de los espacios",
    rules: [
      "Cuidar aulas, talleres, laboratorios, mobiliario y equipos.",
      "Mantener la limpieza de los espacios comunes y clasificar los residuos.",
      "Uso de talleres y laboratorios: solo con autorización y supervisión docente.",
    ],
  },
  {
    category: "Presentación y pertenencia",
    rules: [
      "Vestir el uniforme reglamentario durante la jornada escolar.",
      "Representar a la institución con responsabilidad en actos y competencias.",
      "Reglamentación del uniforme y distintivos: " + PENDING + ".",
    ],
  },
];

export const enrollmentInfo = {
  cost: "Institución pública: la enseñanza es gratuita. Solo podrían aplicar aranceles administrativos mínimos. " + PENDING + " (confirmar en Secretaría).",
  dates: PENDING + ": calendario oficial de matriculación a confirmar por la Dirección.",
  payment: "Modalidades de pago (si aplicaran aranceles): " + PENDING + ". Consultar en Secretaría.",
  steps: [
    "Completar la solicitud online en la sección Inscripciones o en Secretaría.",
    "Presentar los documentos requeridos según el nivel (ver Requisitos).",
    "Aguardar la revisión de la solicitud (estado: Pendiente / En revisión / Aprobada).",
    "Confirmar la matriculación en Secretaría una vez aprobada la solicitud.",
  ],
};

export const requirementGroups = [
  {
    id: "inscripcion",
    title: "Requisitos de inscripción",
    intro: "Documentos y requisitos generales para solicitar la inscripción en cualquier nivel.",
    items: [
      "Cédula de identidad del estudiante (vigente).",
      "Certificado de estudios del nivel/curso anterior.",
      "Acta o certificado de nacimiento.",
      "Fotocopia de cédula del padre, madre o encargado.",
      "Carpeta y fotografías tipo carnet (cantidad a confirmar).",
      "Nómina oficial completa: " + PENDING + " (confirmar en Secretaría).",
    ],
  },
  {
    id: "ingreso-eeb",
    title: "Ingreso a Educación Escolar Básica (7.º a 9.º)",
    intro: "Condiciones para el ingreso a 7.º, 8.º y 9.º grado, turnos mañana y tarde.",
    items: [
      "Haber aprobado el grado anterior de la EEB.",
      "Solicitud de inscripción con datos del encargado (parentesco, teléfono, correo).",
      "Presentación de la documentación general de inscripción.",
      "Cupos por sección y turno: " + PENDING + ".",
    ],
  },
  {
    id: "ingreso-media",
    title: "Ingreso al Nivel Medio (bachilleratos)",
    intro: "Condiciones por orientación: Científico, Servicios y Técnico Industrial.",
    items: [
      "Haber culminado la Educación Escolar Básica (9.º grado).",
      "Elección de la orientación (Científico, BTS, BTI, Contabilidad, ADN, BTE, Mecánica, Construcciones, Agropecuario).",
      "Requisitos específicos por orientación técnica (talleres, salud): " + PENDING + ".",
      "Traslados desde otras instituciones: " + PENDING + ".",
    ],
  },
];
