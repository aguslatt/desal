/* Vinculate · datos ficticios (CABA y GBA). Instituciones, direcciones y teléfonos son inventados. */
window.TODAY = new Date(2026, 10, 5); // jueves 5 de noviembre de 2026

window.USER = {
  nombre: 'Lucía', apellido: 'Fernández', email: 'lucia.fernandez@email.com',
  nacimiento: '1996-03-14', localidad: 'Villa Crespo, CABA', desde: 'octubre de 2025',
};

window.LOCALIDADES = {
  'CABA': ['Almagro', 'Belgrano', 'Caballito', 'Flores', 'Palermo', 'Recoleta', 'Villa Crespo', 'Villa Urquiza'],
  'GBA': ['Avellaneda', 'Lanús', 'Morón', 'San Isidro', 'San Martín', 'Tigre', 'Vicente López'],
};

/* hrs: wk = lunes a viernes [desde, hasta], sat = sábado (o null). Coordenadas x/y: mapa esquemático. */
window.CENTERS = [
  { id: 'almagro', name: 'Hospital Santa Lucía · Hemoterapia', tipo: 'hospital', tipoL: 'Hospital', zona: 'Almagro, CABA', region: 'CABA',
    addr: 'Av. Díaz Vélez 3890', km: 1.2, x: 835, y: 672, hrs: { wk: [7, 12], sat: [8, 11] }, turnos: true, ph: 'a',
    phone: '(011) 4981-2230', email: 'hemoterapia@santalucia.example', web: 'santalucia.example/donar', updated: 'hoy 08:40',
    walk: 16, transit: 'Subte B (Medrano) · Colectivos 24, 26, 128',
    services: ['Donación de sangre entera', 'Atención a donantes habituales', 'Consultas por teléfono y correo'],
    note: 'Ingresá por la guardia lateral de Av. Díaz Vélez. Hay sala de espera con agua.' },
  { id: 'palermo', name: 'Instituto de Hemoterapia Palermo', tipo: 'hemoterapia', tipoL: 'Centro de hemoterapia', zona: 'Palermo, CABA', region: 'CABA',
    addr: 'Av. Santa Fe 4120', km: 1.9, x: 868, y: 545, hrs: { wk: [7.5, 13], sat: null }, turnos: true, ph: 'b',
    phone: '(011) 4555-0142', email: 'donantes@hemopalermo.example', web: 'hemopalermo.example', updated: 'hoy 08:40',
    walk: 24, transit: 'Subte D (Plaza Italia) · Colectivos 29, 39, 152',
    services: ['Donación de sangre entera', 'Donación de plaquetas (con entrevista previa)', 'Campañas en espacios públicos'],
    note: 'Se recomienda llegar 10 minutos antes del turno con DNI.' },
  { id: 'caballito', name: 'Hospital General Caballito · Hemoterapia', tipo: 'hospital', tipoL: 'Hospital', zona: 'Caballito, CABA', region: 'CABA',
    addr: 'Av. Rivadavia 5200', km: 2.6, x: 760, y: 740, hrs: { wk: [8, 12], sat: null }, turnos: false, ph: 'c',
    phone: '(011) 4902-7718', email: 'banco.sangre@hgcaballito.example', web: 'hgcaballito.example', updated: '2 nov',
    walk: 33, transit: 'Subte A (Primera Junta) · Colectivos 2, 86, 126',
    services: ['Donación de sangre entera', 'Atención por orden de llegada'],
    note: 'Esta institución no publica turnos: se atiende por orden de llegada dentro del horario.' },
  { id: 'belgrano', name: 'Sanatorio del Parque · Belgrano', tipo: 'clinica', tipoL: 'Sanatorio adherido', zona: 'Belgrano, CABA', region: 'CABA',
    addr: 'Av. Cabildo 2310', km: 4.1, x: 915, y: 430, hrs: { wk: [8, 16], sat: [8, 12] }, turnos: true, ph: 'd',
    phone: '(011) 4784-3350', email: 'hemoterapia@sanatoriodelparque.example', web: 'sanatoriodelparque.example', updated: 'ayer',
    walk: 52, transit: 'Subte D (Juramento) · Colectivos 60, 152, 38',
    services: ['Donación de sangre entera', 'Estacionamiento para donantes'],
    note: 'Institución privada adherida a Vinculate. La donación es voluntaria y sin costo.' },
  { id: 'avellaneda', name: 'Hospital Municipal de Avellaneda · Hemoterapia', tipo: 'hospital', tipoL: 'Hospital', zona: 'Avellaneda, GBA Sur', region: 'GBA',
    addr: 'Av. Mitre 2480', km: 7.6, x: 1080, y: 880, hrs: { wk: [7, 11], sat: null }, turnos: false, ph: 'e',
    phone: '(011) 4201-5560', email: 'hemoterapia@hmavellaneda.example', web: 'hmavellaneda.example', updated: '30 oct',
    walk: null, transit: 'Colectivos 10, 45, 98 · Tren Roca (Avellaneda)',
    services: ['Donación de sangre entera', 'Atención por orden de llegada'],
    note: 'Esta institución no publica turnos: se atiende por orden de llegada dentro del horario.' },
  { id: 'olivos', name: 'Centro Regional de Hemoterapia Vicente López', tipo: 'hemoterapia', tipoL: 'Centro de hemoterapia', zona: 'Olivos, GBA Norte', region: 'GBA',
    addr: 'Av. Maipú 1850', km: 9.4, x: 990, y: 215, hrs: { wk: [7, 14], sat: [8, 12] }, turnos: true, ph: 'a',
    phone: '(011) 4799-2104', email: 'donantes@hemovl.example', web: 'hemovl.example', updated: 'hoy 07:55',
    walk: null, transit: 'Tren Mitre (Olivos) · Colectivos 60, 152, 168',
    services: ['Donación de sangre entera', 'Donación de plaquetas (con entrevista previa)', 'Campañas en el partido'],
    note: 'A tres cuadras de la estación Olivos del Tren Mitre.' },
  { id: 'moron', name: 'Hospital Zonal de Morón', tipo: 'hospital', tipoL: 'Hospital', zona: 'Morón, GBA Oeste', region: 'GBA',
    addr: 'Av. Rivadavia 17250', km: 17.8, x: 70, y: 880, hrs: { wk: [7.5, 11.5], sat: null }, turnos: false, ph: 'c',
    phone: '(011) 4627-8890', email: 'hemoterapia@hzmoron.example', web: 'hzmoron.example', updated: '27 oct',
    walk: null, transit: 'Tren Sarmiento (Morón) · Colectivos 21, 136, 395',
    services: ['Donación de sangre entera'],
    note: 'Esta institución no publica turnos: se atiende por orden de llegada dentro del horario.' },
];

window.CAMPAIGNS = [
  { id: 'k1', name: 'Jornada de donación en Parque Centenario', date: '2026-11-14', hrs: [9, 15], place: 'Parque Centenario · Av. Díaz Vélez y Ángel Gallardo',
    zona: 'Caballito, CABA', km: 2.4, org: 'palermo', turnos: true, ph: 'b',
    desc: 'Unidad móvil del Instituto de Hemoterapia Palermo en el parque, con entrevista y extracción en el lugar. Podés sacar turno o acercarte durante la jornada.',
    bring: ['DNI', 'Haber comido algo liviano y tomado líquidos'] },
  { id: 'k2', name: 'Campaña en el Centro Cultural Almagro', date: '2026-11-18', hrs: [10, 16], place: 'Centro Cultural Almagro · Av. Corrientes 4150',
    zona: 'Almagro, CABA', km: 1.4, org: 'almagro', turnos: false, ph: 'd',
    desc: 'Jornada abierta organizada por el Hospital Santa Lucía. Se atiende por orden de llegada, sin turno previo.',
    bring: ['DNI', 'Haber comido algo liviano y tomado líquidos'] },
  { id: 'k3', name: 'Jornada de donación en la Plaza de Olivos', date: '2026-11-22', hrs: [10, 14], place: 'Plaza de Olivos · Av. Maipú y Corrientes',
    zona: 'Olivos, GBA Norte', km: 9.2, org: 'olivos', turnos: true, ph: 'e',
    desc: 'Campaña de fin de semana del Centro Regional de Hemoterapia Vicente López. Se recomienda reservar turno para reducir la espera.',
    bring: ['DNI', 'Haber comido algo liviano y tomado líquidos'] },
  { id: 'k4', name: 'Jornada solidaria en Morón', date: '2026-11-28', hrs: [9, 13], place: 'Plaza San Martín · Morón Centro',
    zona: 'Morón, GBA Oeste', km: 17.5, org: 'moron', turnos: false, ph: 'a',
    desc: 'Jornada organizada junto al municipio. Atención por orden de llegada.',
    bring: ['DNI', 'Haber comido algo liviano y tomado líquidos'] },
  { id: 'k5', name: 'Semana de donación · Hospital Santa Lucía', date: '2026-12-02', dateEnd: '2026-12-04', hrs: [8, 12], place: 'Hospital Santa Lucía · Av. Díaz Vélez 3890',
    zona: 'Almagro, CABA', km: 1.2, org: 'almagro', turnos: true, ph: 'c',
    desc: 'Tres días de recepción ampliada de donantes en el servicio de hemoterapia, con turnos publicados cada media hora.',
    bring: ['DNI', 'Haber comido algo liviano y tomado líquidos'] },
];

window.DONATIONS = [
  { id: 'd4', date: '2026-09-17', time: '10:20', center: 'Campaña Plaza Irlanda', zona: 'Caballito, CABA', estado: 'pendiente', origen: 'Registrada por vos' },
  { id: 'd3', date: '2026-06-04', time: '09:10', center: 'Hospital Santa Lucía · Hemoterapia', zona: 'Almagro, CABA', estado: 'confirmada', origen: 'Confirmada por la institución', cid: 'almagro' },
  { id: 'd2', date: '2026-02-27', time: '11:00', center: 'Instituto de Hemoterapia Palermo', zona: 'Palermo, CABA', estado: 'confirmada', origen: 'Confirmada por la institución', cid: 'palermo' },
  { id: 'd1', date: '2025-10-09', time: '10:40', center: 'Jornada en Parque Centenario', zona: 'Caballito, CABA', estado: 'confirmada', origen: 'Confirmada por la institución', cid: 'palermo' },
];

window.NOTIFS = [
  { id: 'n1', tipo: 'recordatorio', read: false, when: 'Hoy · 9:12', title: 'Pasaron 7 semanas desde tu última donación registrada',
    text: 'Cuando quieras volver a donar, consultá con un centro cuáles son los requisitos y plazos vigentes.', go: ['tab', 'find'] },
  { id: 'n2', tipo: 'campana', read: false, when: 'Ayer · 18:30', title: 'Nueva campaña en Caballito',
    text: 'Jornada de donación en Parque Centenario, sábado 14 de noviembre.', go: ['campaign', 'k1'] },
  { id: 'n3', tipo: 'registro', read: true, when: '2 nov', title: 'Registro pendiente de validación',
    text: 'Tu donación del 17 de septiembre espera la confirmación de la institución.', go: ['donation', 'd4'] },
  { id: 'n4', tipo: 'campana', read: true, when: '29 oct', title: 'Nueva campaña en Almagro',
    text: 'Campaña en el Centro Cultural Almagro, miércoles 18 de noviembre.', go: ['campaign', 'k2'] },
  { id: 'n5', tipo: 'recordatorio', read: true, when: '16 sep', title: 'Tu turno es mañana',
    text: 'Campaña Plaza Irlanda, 10:00. Llevá tu DNI. Registramos tu donación como pendiente de validación.', go: ['donation', 'd4'] },
];

/* Biblioteca. Contenido breve y orientativo; la elegibilidad la define siempre el personal de salud. */
window.LIB = [
  { id: 'requisitos', title: 'Requisitos generales', desc: 'Lo básico para donar', icon: 'check', read: '3 min',
    blocks: [
      { p: 'Estos son los requisitos generales más habituales. Cada institución puede aplicar criterios adicionales.' },
      { h: 'Requisitos generales', ul: [
        'Tener entre 18 y 65 años. Con 16 o 17 años se puede donar con autorización de madre, padre o tutor, según la normativa vigente.',
        'Pesar más de 50 kg.',
        'Sentirte bien de salud el día de la donación.',
        'Llevar tu DNI u otro documento que acredite identidad.' ] },
      { h: 'Lo que se consulta en la entrevista', p: 'Algunas situaciones pueden implicar una espera o impedir temporalmente la donación: embarazo o lactancia, ciertos medicamentos, cirugías, tatuajes o piercings recientes, o viajes a determinadas zonas. El personal de salud lo evalúa caso por caso y de forma confidencial.' },
    ] },
  { id: 'proceso', title: 'Cómo es el proceso', desc: 'Paso a paso, de principio a fin', icon: 'drop', read: '2 min',
    blocks: [
      { p: 'En total, el proceso lleva entre 45 minutos y una hora. La extracción en sí dura pocos minutos.' },
      { steps: [
        ['Registro', 'Presentás tu DNI y completás tus datos en el centro.'],
        ['Entrevista confidencial', 'Una persona del equipo de salud te hace preguntas sobre tu salud y tus hábitos.'],
        ['Control básico', 'Se miden presión, pulso y hemoglobina con una muestra mínima.'],
        ['Donación', 'La extracción de sangre entera dura entre 8 y 10 minutos, con material estéril y descartable.'],
        ['Descanso', 'Te quedás unos 10 a 15 minutos, con algo para tomar y comer.'] ] },
    ] },
  { id: 'antes', title: 'Antes y después de donar', desc: 'Cuidados que ayudan', icon: 'clock', read: '2 min',
    blocks: [
      { h: 'Antes de ir', ul: [
        'Dormí bien la noche anterior.',
        'No vayas en ayunas: comé algo liviano y evitá comidas muy grasas.',
        'Tomá agua o jugos durante el día.',
        'Evitá el alcohol en las 24 horas previas.',
        'Llevá tu DNI.' ] },
      { h: 'Después de donar', ul: [
        'Descansá unos minutos antes de levantarte.',
        'Tomá líquidos y comé algo.',
        'Evitá esfuerzos físicos intensos el resto del día.',
        'Mantené el apósito durante unas horas.',
        'Si sentís mareo, recostate y avisá al personal.' ] },
    ] },
  { id: 'mitos', title: 'Mitos y verdades', desc: 'Lo que se dice, aclarado', icon: 'info', read: '3 min', kind: 'qa',
    items: [
      { q: 'Donar sangre engorda o adelgaza', tag: 'Mito', a: 'La donación no modifica el peso corporal.' },
      { q: 'Se puede contraer una enfermedad al donar', tag: 'Mito', a: 'El material es estéril y descartable: se usa una sola vez.' },
      { q: 'Hay que ir en ayunas', tag: 'Mito', a: 'Lo recomendable es comer algo liviano y tomar líquidos antes de ir.' },
      { q: 'Con un tatuaje no se puede donar nunca más', tag: 'Mito', a: 'Suele haber un período de espera luego de hacerse un tatuaje. El centro te indica cuál.' },
      { q: 'El cuerpo repone la sangre donada', tag: 'Verdad', a: 'El organismo recupera el volumen de líquido en horas y los componentes de la sangre en las semanas siguientes.' },
      { q: 'Una donación puede ayudar a más de una persona', tag: 'Verdad', a: 'La sangre se separa en componentes (glóbulos rojos, plasma y plaquetas) que pueden destinarse a distintos pacientes.' },
    ] },
  { id: 'faq', title: 'Preguntas frecuentes', desc: 'Respuestas rápidas', icon: 'help', read: '3 min', kind: 'qa',
    items: [
      { q: '¿Cuánto tiempo lleva?', a: 'Entre 45 minutos y una hora en total. La extracción dura entre 8 y 10 minutos.' },
      { q: '¿Cada cuánto puedo donar?', a: 'Entre donaciones debe pasar un tiempo mínimo que establece la normativa y que puede variar según el tipo de donación. En el centro te indican cuándo podés volver.' },
      { q: '¿Necesito turno?', a: 'Depende de la institución. Algunas publican turnos en Vinculate y otras reciben donantes en su horario de atención. Lo ves en la ficha de cada centro.' },
      { q: '¿Qué tengo que llevar?', a: 'Tu DNI u otro documento de identidad. Es recomendable ir habiendo comido algo liviano y con buena hidratación.' },
      { q: '¿Vinculate me dice si puedo donar?', a: 'No. La aplicación no evalúa tu aptitud: esa decisión la toma siempre el personal de salud durante la entrevista en el centro.' },
      { q: '¿Qué datos guarda Vinculate?', a: 'Solo datos básicos de tu perfil y tu historial de donaciones. No pedimos información médica.' },
    ] },
  { id: 'voluntaria', title: 'Donación voluntaria y habitual', desc: 'Por qué importa volver', icon: 'heart', read: '2 min',
    blocks: [
      { p: 'La donación voluntaria es la que se hace por decisión propia, sin que un paciente determinado la necesite en ese momento. Cuando una persona dona de forma periódica, a lo largo del año, se la llama donante habitual.' },
      { h: 'Por qué es importante', p: 'Contar con donantes voluntarios y habituales permite sostener un stock estable y planificar con anticipación. Según el Ministerio de Salud de la Nación, si entre el 3% y el 5% de la población donara sangre al menos dos veces al año, se cubrirían las necesidades transfusionales del país.' },
      { h: 'Y la donación de reposición', p: 'Es la que se hace a pedido de una institución para reponer la sangre utilizada por un paciente. Vinculate no conecta donantes con pacientes individuales: vincula personas con centros y campañas.' },
    ] },
];
