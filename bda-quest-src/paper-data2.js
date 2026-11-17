// BDA-QUEST · más ejercicios de papel: E/R fáciles (level 1), medios (2) y densos (3), y relámpagos.
// Convención de clase: el par (min,max) va pegado a la entidad que se cuenta.
// Las claves naturales que da el enunciado (DNI, ISBN, matrícula...) son la CP; solo hay id si el enunciado lo da o no hay ninguna.
window.BQ = window.BQ || {};
(function () {
const R = BQ._R, T = BQ._T;

// niveles de lo que ya existía
const LV = {huerto: 2, ciclismo: 2, hospital: 2, tienda: 2, clinica: 3, festival: 3, consultora: 2, empresa: 2, huertoex: 2, concesionario: 3, comidas: 3, escolar: 3, redsocial: 3, piezas: 3, agencia: 3};
[...BQ.CASES, ...BQ.PCASES].forEach(c => { if (LV[c.id]) c.level = LV[c.id]; });

BQ.PCASES.push(
// ======================= FÁCILES =======================
{id:'biblioteca', name:'Biblioteca de barrio', level:1, from:'Fácil',
 rules:['De cada libro se guarda su ISBN (no se repite), el título y el año de publicación.',
  'De cada socio: DNI, nombre y email (puede no tenerlo).',
  'Un socio puede llevarse prestados varios libros y un libro puede prestarse a distintos socios en fechas distintas. De cada préstamo se guarda la fecha de salida y la de devolución (no existe hasta que se devuelve el libro).'],
 er:{entities:[{n:'Libro', attrs:[['isbn','I'],['titulo',''],['anio_publicacion','']]},{n:'Socio', attrs:[['dni','I'],['nombre',''],['email','o']]},{n:'Préstamo', attrs:[['id_prestamo','I'],['fecha_salida',''],['fecha_devolucion','o']]}]},
 rels:[R('Socio','solicita','Préstamo','11','0N'), R('Libro','se presta en','Préstamo','11','0N')], asserts:[],
 extra:['Préstamo es entidad porque la misma pareja socio–libro se repite en fechas distintas (con una N:M no cabría).'],
 tables:[T('LIBRO = isbn*, titulo!, anio_publicacion!'), T('SOCIO = dni*, nombre!, email?'), T('PRESTAMO = id_prestamo*, fecha_salida!, fecha_devolucion?, dni_socio!->SOCIO, isbn!->LIBRO')]},

{id:'veterinaria', name:'Clínica veterinaria', level:1, from:'Fácil · existencialidad',
 rules:['De cada dueño: DNI, nombre y teléfono.', 'De cada mascota: número de chip (único), nombre, especie y fecha de nacimiento (puede desconocerse).',
  'Cada mascota pertenece a un único dueño. Solo se registra a un dueño cuando trae al menos una mascota.'],
 er:{entities:[{n:'Dueño', attrs:[['dni','I'],['nombre',''],['telefono','']]},{n:'Mascota', attrs:[['chip','I'],['nombre',''],['especie',''],['fecha_nacimiento','o']]}]},
 rels:[R('Dueño','tiene','Mascota','11','1N')],
 asserts:[{t:'DUENO[dni] ⊆ MASCOTA[dni_dueno]', why:'"Solo se registra a un dueño cuando trae al menos una mascota": mínimo 1 → todo dueño aparece en MASCOTA.'}],
 extra:['La FK va en MASCOTA (lado N) y es NOT NULL, pero eso no garantiza que todo dueño tenga mascota: hace falta la aserción.'],
 tables:[T('DUENO = dni*, nombre!, telefono!'), T('MASCOTA = chip*, nombre!, especie!, fecha_nacimiento?, dni_dueno!->DUENO')]},

{id:'gimnasio', name:'Gimnasio', level:1, from:'Fácil · N:M + 1:N',
 rules:['De cada socio: número de socio, nombre y fecha de alta.', 'De cada clase: código, nombre, día de la semana y hora.',
  'Un socio puede apuntarse a varias clases (o a ninguna) y una clase puede tener varios socios o ninguno todavía.',
  'Cada clase la imparte un único monitor (DNI y nombre). Todo monitor imparte al menos una clase.'],
 er:{entities:[{n:'Socio', attrs:[['num_socio','I'],['nombre',''],['fecha_alta','']]},{n:'Clase', attrs:[['cod_clase','I'],['nombre',''],['dia_semana',''],['hora','']]},{n:'Monitor', attrs:[['dni','I'],['nombre','']]}]},
 rels:[R('Socio','se apunta a','Clase','0N','0N'), R('Monitor','imparte','Clase','11','1N')],
 asserts:[{t:'MONITOR[dni] ⊆ CLASE[dni_monitor]', why:'"Todo monitor imparte al menos una clase": mínimo 1 en el lado "1".'}],
 extra:[],
 tables:[T('SOCIO = num_socio*, nombre!, fecha_alta!'), T('MONITOR = dni*, nombre!'), T('CLASE = cod_clase*, nombre!, dia_semana!, hora!, dni_monitor!->MONITOR'), T('SOCIO_CLASE = num_socio*->SOCIO, cod_clase*->CLASE')]},

{id:'hotel', name:'Hotel', level:1, from:'Fácil · entidad intermedia',
 rules:['De cada cliente: DNI, nombre y teléfono.', 'De cada habitación: número, tipo (individual, doble, suite) y precio por noche.',
  'Un cliente puede hacer varias reservas. Cada reserva es de un único cliente y de una única habitación, con fecha de entrada y de salida. Una habitación puede reservarse muchas veces en fechas distintas.'],
 er:{entities:[{n:'Cliente', attrs:[['dni','I'],['nombre',''],['telefono','']]},{n:'Habitación', attrs:[['num_habitacion','I'],['tipo',''],['precio_noche','']]},{n:'Reserva', attrs:[['id_reserva','I'],['fecha_entrada',''],['fecha_salida','']]}]},
 rels:[R('Cliente','hace','Reserva','11','0N'), R('Habitación','se reserva en','Reserva','11','0N')], asserts:[],
 extra:['Reserva es entidad: una habitación se reserva muchas veces con fechas distintas.'],
 tables:[T('CLIENTE = dni*, nombre!, telefono!'), T('HABITACION = num_habitacion*, tipo!, precio_noche!'), T('RESERVA = id_reserva*, fecha_entrada!, fecha_salida!, dni_cliente!->CLIENTE, num_habitacion!->HABITACION')]},

{id:'idiomas', name:'Academia de idiomas', level:1, from:'Fácil · N:M con atributos',
 rules:['De cada alumno: DNI y nombre. De cada profesor: DNI y nombre.', 'De cada curso: código, idioma y nivel (A1, A2, B1...).',
  'Un alumno puede matricularse en varios cursos y un curso tiene varios alumnos. De cada matrícula se guarda la fecha y la nota final (que no existe hasta que termina el curso).',
  'Cada curso lo imparte un único profesor; un profesor puede impartir varios cursos.'],
 er:{entities:[{n:'Alumno', attrs:[['dni','I'],['nombre','']]},{n:'Profesor', attrs:[['dni','I'],['nombre','']]},{n:'Curso', attrs:[['codigo','I'],['idioma',''],['nivel','']]}]},
 rels:[R('Alumno','se matricula en','Curso','0N','0N',{attr:'fecha_matricula, nota'}), R('Profesor','imparte','Curso','11','0N')], asserts:[],
 extra:['fecha_matricula y nota son atributos de la relación N:M (la nota es opcional).'],
 tables:[T('ALUMNO = dni*, nombre!'), T('PROFESOR = dni*, nombre!'), T('CURSO = codigo*, idioma!, nivel!, dni_profesor!->PROFESOR'), T('MATRICULA = dni_alumno*->ALUMNO, codigo_curso*->CURSO, fecha_matricula!, nota?')]},

{id:'autoescuela', name:'Autoescuela', level:1, from:'Fácil · tres 1:N sobre la misma entidad',
 rules:['De cada alumno: DNI, nombre y teléfono. De cada profesor: DNI y nombre. De cada vehículo: matrícula (única), marca y modelo.',
  'Se registran las clases prácticas: fecha y hora. Cada clase práctica la recibe un único alumno, la da un único profesor y se hace con un único vehículo.', 'Un alumno, un profesor o un vehículo pueden no haber participado en ninguna clase todavía.'],
 er:{entities:[{n:'Alumno', attrs:[['dni','I'],['nombre',''],['telefono','']]},{n:'Profesor', attrs:[['dni','I'],['nombre','']]},{n:'Vehículo', attrs:[['matricula','I'],['marca',''],['modelo','']]},{n:'Clase práctica', attrs:[['id_clase','I'],['fecha',''],['hora','']]}]},
 rels:[R('Alumno','recibe','Clase práctica','11','0N'), R('Profesor','da','Clase práctica','11','0N'), R('Vehículo','se usa en','Clase práctica','11','0N')], asserts:[],
 extra:[],
 tables:[T('ALUMNO = dni*, nombre!, telefono!'), T('PROFESOR = dni*, nombre!'), T('VEHICULO = matricula*, marca!, modelo!'), T('CLASE_PRACTICA = id_clase*, fecha!, hora!, dni_alumno!->ALUMNO, dni_profesor!->PROFESOR, matricula!->VEHICULO')]},

// ======================= MEDIOS =======================
{id:'universidad', name:'Universidad (con prerrequisitos)', level:2, from:'Media · reflexiva + existencialidad',
 rules:['De cada alumno: DNI, nombre, apellidos y email (no se repite).',
  'De cada asignatura: código, nombre y créditos. Una asignatura puede exigir haber aprobado otras antes (varias) y, a su vez, ser requisito de otras.',
  'De cada departamento: código y nombre. Todo departamento tiene al menos un profesor y cada profesor pertenece a un único departamento.',
  'De cada profesor: DNI y nombre. Cada asignatura la imparte un único profesor; un profesor puede impartir varias asignaturas.',
  'Un alumno se matricula de varias asignaturas cada curso académico. De cada matrícula se guarda el curso académico (por ejemplo 2024/25) y la nota (hasta que se evalúa no existe). Un alumno puede repetir la asignatura en cursos distintos.'],
 er:{entities:[{n:'Alumno', attrs:[['dni','I'],['nombre',''],['apellidos',''],['email','a']]},{n:'Asignatura', attrs:[['cod_asignatura','I'],['nombre',''],['creditos','']]},{n:'Departamento', attrs:[['cod_depto','I'],['nombre','']]},{n:'Profesor', attrs:[['dni_profesor','I'],['nombre','']]},{n:'Matrícula', attrs:[['id_matricula','I'],['curso_academico',''],['nota','o']]}]},
 rels:[R('Departamento','agrupa','Profesor','11','1N'), R('Profesor','imparte','Asignatura','11','0N'), R('Alumno','realiza','Matrícula','11','0N'), R('Asignatura','se cursa en','Matrícula','11','0N'),
  R('Asignatura','es requisito de','Asignatura','0N','0N',{roles:{a:'requisito',b:'dependiente'}})],
 asserts:[{t:'DEPARTAMENTO[cod_depto] ⊆ PROFESOR[cod_depto]', why:'"Todo departamento tiene al menos un profesor": mínimo 1 en el lado "1".'}],
 extra:['Matrícula es entidad porque el alumno repite la asignatura en cursos distintos.','Reflexiva N:M con roles requisito / dependiente → tabla REQUISITO con dos FKs a ASIGNATURA.'],
 tables:[T('DEPARTAMENTO = cod_depto*, nombre!'), T('PROFESOR = dni_profesor*, nombre!, cod_depto!->DEPARTAMENTO'), T('ASIGNATURA = cod_asignatura*, nombre!, creditos!, dni_profesor!->PROFESOR'),
  T('ALUMNO = dni*, nombre!, apellidos!, email+!'), T('MATRICULA = id_matricula*, curso_academico!, nota?, dni_alumno!->ALUMNO, cod_asignatura!->ASIGNATURA'), T('REQUISITO = cod_asignatura*->ASIGNATURA, cod_requisito*->ASIGNATURA')]},

{id:'delivery', name:'Comida a domicilio', level:2, from:'Media · FK opcional + N:M con atributo',
 rules:['De cada cliente: DNI, nombre, teléfono y dirección de entrega (calle, número y ciudad).',
  'De cada restaurante: CIF, nombre y dirección. Cada restaurante ofrece al menos un plato; de cada plato: código, nombre y precio. Un plato pertenece a un único restaurante.',
  'Un cliente hace pedidos a un restaurante: fecha y hora y estado (recibido, en preparación, en reparto, entregado). Cada pedido es de un único cliente y de un único restaurante.',
  'Un pedido incluye uno o varios platos con la cantidad de cada uno.',
  'Cada pedido lo entrega un repartidor (DNI, nombre y matrícula de la moto), pero hasta que se asigna no tiene repartidor. Un repartidor puede entregar muchos pedidos.'],
 er:{entities:[{n:'Cliente', attrs:[['dni','I'],['nombre',''],['telefono',''],['calle','c'],['numero','c'],['ciudad','c']]},{n:'Restaurante', attrs:[['cif','I'],['nombre',''],['direccion','']]},{n:'Plato', attrs:[['cod_plato','I'],['nombre',''],['precio','']]},{n:'Pedido', attrs:[['num_pedido','I'],['fecha_hora',''],['estado','']]},{n:'Repartidor', attrs:[['dni_repartidor','I'],['nombre',''],['matricula_moto','']]}]},
 rels:[R('Cliente','hace','Pedido','11','0N'), R('Restaurante','recibe','Pedido','11','0N'), R('Restaurante','ofrece','Plato','11','1N'), R('Repartidor','entrega','Pedido','01','0N'), R('Pedido','incluye','Plato','0N','1N',{attr:'cantidad'})],
 asserts:[{t:'RESTAURANTE[cif] ⊆ PLATO[cif_restaurante]', why:'"Cada restaurante ofrece al menos un plato": mínimo 1 en el lado "1".'}],
 extra:['El repartidor es (0,1) por pedido: la FK dni_repartidor en PEDIDO admite NULL hasta que se asigna.'],
 tables:[T('CLIENTE = dni*, nombre!, telefono!, calle!, numero!, ciudad!'), T('RESTAURANTE = cif*, nombre!, direccion!'), T('PLATO = cod_plato*, nombre!, precio!, cif_restaurante!->RESTAURANTE'), T('REPARTIDOR = dni_repartidor*, nombre!, matricula_moto!'),
  T('PEDIDO = num_pedido*, fecha_hora!, estado!, dni_cliente!->CLIENTE, cif_restaurante!->RESTAURANTE, dni_repartidor?->REPARTIDOR'), T('LINEA_PEDIDO = num_pedido*->PEDIDO, cod_plato*->PLATO, cantidad!')]},

{id:'liga', name:'Liga de fútbol', level:2, from:'Media · dos relaciones con la misma entidad',
 rules:['De cada equipo: código, nombre y ciudad. Cada equipo juega en un único estadio (código, nombre y aforo); un estadio puede ser de varios equipos.',
  'De cada jugador: DNI, nombre, dorsal y posición. Cada jugador pertenece a un único equipo y todo equipo tiene al menos un jugador.',
  'De cada partido: fecha, jornada y goles del equipo local y del visitante. Cada partido lo juegan exactamente dos equipos (uno local y otro visitante) y un equipo juega muchos partidos.',
  'Se anota qué jugadores marcan en cada partido, con el minuto de cada gol (un jugador puede marcar varios goles en el mismo partido).'],
 er:{entities:[{n:'Equipo', attrs:[['cod_equipo','I'],['nombre',''],['ciudad','']]},{n:'Estadio', attrs:[['cod_estadio','I'],['nombre',''],['aforo','']]},{n:'Jugador', attrs:[['dni','I'],['nombre',''],['dorsal',''],['posicion','']]},{n:'Partido', attrs:[['id_partido','I'],['fecha',''],['jornada',''],['goles_local',''],['goles_visitante','']]},{n:'Gol', attrs:[['id_gol','I'],['minuto','']]}]},
 rels:[R('Estadio','alberga a','Equipo','11','0N'), R('Equipo','ficha a','Jugador','11','1N'), R('Equipo','juega como local','Partido','11','0N'), R('Equipo','juega como visitante','Partido','11','0N'), R('Partido','tiene','Gol','11','0N'), R('Jugador','marca','Gol','11','0N')],
 asserts:[{t:'EQUIPO[cod_equipo] ⊆ JUGADOR[cod_equipo]', why:'"Todo equipo tiene al menos un jugador": mínimo 1 en el lado "1".'}],
 extra:['Dos relaciones distintas entre Equipo y Partido (local y visitante): dos FKs a EQUIPO en PARTIDO.','Gol es entidad: un jugador puede marcar varios goles en el mismo partido.'],
 tables:[T('ESTADIO = cod_estadio*, nombre!, aforo!'), T('EQUIPO = cod_equipo*, nombre!, ciudad!, cod_estadio!->ESTADIO'), T('JUGADOR = dni*, nombre!, dorsal!, posicion!, cod_equipo!->EQUIPO'),
  T('PARTIDO = id_partido*, fecha!, jornada!, goles_local!, goles_visitante!, equipo_local!->EQUIPO, equipo_visitante!->EQUIPO'), T('GOL = id_gol*, minuto!, id_partido!->PARTIDO, dni_jugador!->JUGADOR')]},

{id:'congreso', name:'Congreso', level:2, from:'Media · N:M con varios atributos',
 rules:['Un congreso tiene código, nombre, ciudad y fechas de inicio y fin. Se organiza en varias charlas y todo congreso tiene al menos una.',
  'De cada charla: título, hora y duración. Cada charla pertenece a un único congreso y se da en una única sala (código y aforo); una sala acoge varias charlas.',
  'Los ponentes (DNI, nombre y email) dan charlas: una charla la dan uno o varios ponentes y un ponente puede dar varias charlas.',
  'Los asistentes (DNI, nombre y empresa, que puede no constar) se inscriben en congresos: se guarda la fecha de inscripción y el tipo de entrada (general o VIP). Un asistente puede ir a varios congresos.'],
 er:{entities:[{n:'Congreso', attrs:[['cod_congreso','I'],['nombre',''],['ciudad',''],['fecha_inicio',''],['fecha_fin','']]},{n:'Charla', attrs:[['id_charla','I'],['titulo',''],['hora',''],['duracion','']]},{n:'Sala', attrs:[['cod_sala','I'],['aforo','']]},{n:'Ponente', attrs:[['dni_ponente','I'],['nombre',''],['email','']]},{n:'Asistente', attrs:[['dni_asistente','I'],['nombre',''],['empresa','o']]}]},
 rels:[R('Congreso','organiza','Charla','11','1N'), R('Sala','acoge','Charla','11','0N'), R('Ponente','da','Charla','1N','0N'), R('Asistente','se inscribe en','Congreso','0N','0N',{attr:'fecha_inscripcion, tipo_entrada'})],
 asserts:[{t:'CONGRESO[cod_congreso] ⊆ CHARLA[cod_congreso]', why:'"Todo congreso tiene al menos una charla": mínimo 1 en el lado "1".'}],
 extra:['Ponente–Charla es N:M (1,N) por charla: toda charla tiene al menos un ponente → otra aserción posible: CHARLA[id_charla] ⊆ CHARLA_PONENTE[id_charla].'],
 tables:[T('CONGRESO = cod_congreso*, nombre!, ciudad!, fecha_inicio!, fecha_fin!'), T('SALA = cod_sala*, aforo!'), T('CHARLA = id_charla*, titulo!, hora!, duracion!, cod_congreso!->CONGRESO, cod_sala!->SALA'), T('PONENTE = dni_ponente*, nombre!, email!'),
  T('ASISTENTE = dni_asistente*, nombre!, empresa?'), T('CHARLA_PONENTE = id_charla*->CHARLA, dni_ponente*->PONENTE'), T('INSCRIPCION = dni_asistente*->ASISTENTE, cod_congreso*->CONGRESO, fecha_inscripcion!, tipo_entrada!')]},

// ======================= DENSOS =======================
{id:'streaming', name:'Plataforma de streaming', level:3, from:'Densa · ISA, entidades débiles y multivalorado',
 rules:['De cada usuario: identificador, email (no se repite), nombre, fecha de alta y uno o varios teléfonos.',
  'Cada usuario tiene al menos un perfil. Un perfil se identifica por su nombre dentro de la cuenta de su usuario (dos usuarios pueden tener perfiles con el mismo nombre) y guarda el idioma y si es infantil.',
  'El catálogo se compone de contenidos: identificador, título y año. Cada contenido es una película (con duración) o una serie, y no puede ser las dos cosas; todo contenido es una de las dos.',
  'Una serie se divide en temporadas numeradas (1, 2, 3...) y cada temporada en episodios también numerados dentro de su temporada, con título y duración. Una temporada no existe sin su serie ni un episodio sin su temporada.',
  'Cada contenido pertenece a uno o varios géneros (nombre único) y un género puede no tener contenidos todavía.',
  'Los perfiles valoran contenidos con una puntuación del 1 al 5 y la fecha; un perfil valora un contenido como mucho una vez.',
  'Se guarda cada reproducción: qué perfil reproduce qué contenido, la fecha y hora de inicio y hasta qué minuto llegó. Un perfil puede ver el mismo contenido varias veces.'],
 er:{entities:[{n:'Usuario', attrs:[['id_usuario','I'],['email','a'],['nombre',''],['fecha_alta',''],['telefono','m']]},{n:'Perfil', attrs:[['nombre','p'],['idioma',''],['infantil','']]},{n:'Contenido', attrs:[['id_contenido','I'],['titulo',''],['anio','']]},{n:'Película', attrs:[['duracion','']]},{n:'Serie', attrs:[]},{n:'Temporada', attrs:[['num_temporada','p']]},{n:'Episodio', attrs:[['num_episodio','p'],['titulo',''],['duracion','']]},{n:'Género', attrs:[['id_genero','I'],['nombre','a']]},{n:'Reproducción', attrs:[['id_reproduccion','I'],['fecha_hora',''],['minuto','']]}]},
 rels:[R('Usuario','tiene','Perfil','11','1N'), R('Serie','se divide en','Temporada','11','1N'), R('Temporada','se divide en','Episodio','11','1N'), R('Contenido','pertenece a','Género','0N','1N'), R('Perfil','valora','Contenido','0N','0N',{attr:'puntuacion, fecha'}), R('Perfil','inicia','Reproducción','11','0N'), R('Contenido','se reproduce en','Reproducción','11','0N')],
 asserts:[{t:'CONTENIDO[id_contenido] ⊆ PELICULA[id_contenido] ∪ SERIE[id_contenido]', why:'ISA total: todo contenido es película o serie.'},{t:'PELICULA[id_contenido] ∩ SERIE[id_contenido] = ∅', why:'ISA disyunta: nadie es las dos cosas.'},{t:'USUARIO[id_usuario] ⊆ PERFIL[id_usuario]', why:'"Cada usuario tiene al menos un perfil": mínimo 1.'}],
 extra:['ISA total disyunta: Contenido → Película | Serie (una tabla por subtipo con FK a CONTENIDO que es también su CP).','Entidades débiles: Perfil (de Usuario, clave parcial nombre), Temporada (de Serie, clave parcial número) y Episodio (de Temporada, clave parcial número).','Teléfonos: multivalorado → tabla aparte. Valoración: N:M Perfil–Contenido con puntuación y fecha.'],
 tables:[T('USUARIO = id_usuario*, email+!, nombre!, fecha_alta!'), T('TELEFONO_USUARIO = id_usuario*->USUARIO, telefono*'), T('PERFIL = id_usuario*->USUARIO, nombre*, idioma!, infantil!'),
  T('CONTENIDO = id_contenido*, titulo!, anio!'), T('PELICULA = id_contenido*->CONTENIDO, duracion!'), T('SERIE = id_contenido*->CONTENIDO'), T('TEMPORADA = id_contenido*->SERIE, num_temporada*'),
  T('EPISODIO = id_contenido*->TEMPORADA#1, num_temporada*->TEMPORADA#1, num_episodio*, titulo!, duracion!'), T('GENERO = id_genero*, nombre+!'), T('CONTENIDO_GENERO = id_contenido*->CONTENIDO, id_genero*->GENERO'),
  T('VALORACION = id_usuario*->PERFIL#1, nombre_perfil*->PERFIL#1, id_contenido*->CONTENIDO, puntuacion!, fecha!'), T('REPRODUCCION = id_reproduccion*, fecha_hora!, minuto!, id_usuario!->PERFIL#1, nombre_perfil!->PERFIL#1, id_contenido!->CONTENIDO')]},

{id:'hospital2', name:'Hospital completo', level:3, from:'Densa · ISA, reflexiva, ternaria y existencialidad',
 rules:['De cada departamento: código y nombre. Un departamento puede depender de otro departamento (jerarquía) y tener varios dependientes. Los departamentos raíz no dependen de ninguno.',
  'Personal sanitario: DNI, nombre y salario. Todo el personal pertenece a un único departamento y todo departamento tiene al menos una persona. El personal es médico (con especialidad y número de colegiado, que no se repite) o enfermero (con turno); nadie es las dos cosas y todo el personal es una de las dos.',
  'De cada paciente: NSS, nombre y fecha de nacimiento.',
  'Habitaciones: número y planta; cada una con varias camas numeradas (cama 1, cama 2...) y se anota si está ocupada. Una cama no existe sin su habitación.',
  'Un ingreso se identifica por un número y guarda la fecha de ingreso y la de alta (que no existe hasta que sale). Cada ingreso es de un paciente, ocupa una cama concreta y lo supervisa un médico responsable. Un paciente puede tener varios ingresos y una cama, a lo largo del tiempo, también.',
  'Medicamentos: código y nombre. Durante un ingreso, un médico prescribe medicamentos con la dosis y la fecha de prescripción; un mismo médico puede prescribir el mismo medicamento en un ingreso en fechas distintas.'],
 er:{entities:[{n:'Departamento', attrs:[['cod_depto','I'],['nombre','']]},{n:'Personal', attrs:[['dni','I'],['nombre',''],['salario','']]},{n:'Médico', attrs:[['num_colegiado','a'],['especialidad','']]},{n:'Enfermero', attrs:[['turno','']]},{n:'Paciente', attrs:[['nss','I'],['nombre',''],['fecha_nacimiento','']]},{n:'Habitación', attrs:[['num_habitacion','I'],['planta','']]},{n:'Cama', attrs:[['num_cama','p'],['ocupada','']]},{n:'Ingreso', attrs:[['num_ingreso','I'],['fecha_ingreso',''],['fecha_alta','o']]},{n:'Medicamento', attrs:[['cod_medicamento','I'],['nombre','']]}]},
 rels:[R('Departamento','depende de','Departamento','01','0N',{roles:{a:'superior',b:'dependiente'}}), R('Departamento','emplea a','Personal','11','1N'), R('Habitación','tiene','Cama','11','1N'), R('Paciente','tiene','Ingreso','11','0N'), R('Cama','aloja','Ingreso','11','0N'), R('Médico','supervisa','Ingreso','11','0N'),
  {verb:'prescribe', ternary:[{e:'Médico', m:['0','N']},{e:'Ingreso', m:['0','N']},{e:'Medicamento', m:['0','N']}], attr:'dosis, fecha_prescripcion', tipo:'N:M:N', why:'Ternaria Médico–Ingreso–Medicamento con dosis y fecha. La fecha forma parte de la CP porque el mismo médico puede prescribir el mismo medicamento varias veces.'}],
 asserts:[{t:'DEPARTAMENTO[cod_depto] ⊆ PERSONAL[cod_depto]', why:'"Todo departamento tiene al menos una persona".'},{t:'PERSONAL[dni] ⊆ MEDICO[dni] ∪ ENFERMERO[dni]', why:'ISA total: todo el personal es médico o enfermero.'},{t:'MEDICO[dni] ∩ ENFERMERO[dni] = ∅', why:'ISA disyunta: nadie es las dos cosas.'}],
 extra:['ISA total disyunta Personal → Médico | Enfermero. Reflexiva Departamento–Departamento con roles superior / dependiente (0,1)/(0,N).','Cama es entidad débil de Habitación (clave parcial num_cama). Ingreso apunta a la cama con FK compuesta (num_habitacion, num_cama).'],
 tables:[T('DEPARTAMENTO = cod_depto*, nombre!, cod_depto_superior?->DEPARTAMENTO'), T('PERSONAL = dni*, nombre!, salario!, cod_depto!->DEPARTAMENTO'), T('MEDICO = dni*->PERSONAL, num_colegiado+!, especialidad!'), T('ENFERMERO = dni*->PERSONAL, turno!'),
  T('PACIENTE = nss*, nombre!, fecha_nacimiento!'), T('HABITACION = num_habitacion*, planta!'), T('CAMA = num_habitacion*->HABITACION, num_cama*, ocupada!'),
  T('INGRESO = num_ingreso*, fecha_ingreso!, fecha_alta?, nss!->PACIENTE, num_habitacion!->CAMA#1, num_cama!->CAMA#1, dni_medico!->MEDICO'), T('MEDICAMENTO = cod_medicamento*, nombre!'),
  T('PRESCRIPCION = dni_medico*->MEDICO, num_ingreso*->INGRESO, cod_medicamento*->MEDICAMENTO, fecha_prescripcion*, dosis!')]},

{id:'trenes', name:'Red ferroviaria', level:3, from:'Densa · reflexiva N:M, débil y dos relaciones',
 rules:['De cada estación: código, nombre y ciudad. Una estación puede tener correspondencia con otras estaciones y se guarda los minutos de transbordo.',
  'De cada línea: código, nombre y color. Una línea pasa por varias estaciones en un orden concreto (1.ª, 2.ª...) y toda estación está en alguna línea; toda línea pasa por alguna estación.',
  'De cada tren: matrícula, modelo y número de plazas. Cada tren está asignado a una única línea y toda línea tiene al menos un tren.',
  'Los viajes son salidas programadas de un tren: se identifican por un número y guardan la fecha y la hora de salida. Un tren hace muchos viajes y cada viaje es de un único tren.',
  'Los pasajeros (DNI, nombre y email) compran billetes. Un billete es para un viaje concreto, indica el número de asiento (que se repite en otros viajes) y el precio; un asiento de un viaje solo se vende una vez. Un billete lo compra un único pasajero.',
  'De cada billete se registra también la estación de subida y la de bajada.'],
 er:{entities:[{n:'Estación', attrs:[['cod_estacion','I'],['nombre',''],['ciudad','']]},{n:'Línea', attrs:[['cod_linea','I'],['nombre',''],['color','']]},{n:'Tren', attrs:[['matricula','I'],['modelo',''],['num_plazas','']]},{n:'Viaje', attrs:[['num_viaje','I'],['fecha_hora','']]},{n:'Pasajero', attrs:[['dni','I'],['nombre',''],['email','']]},{n:'Billete', attrs:[['num_asiento','p'],['precio','']]}]},
 rels:[R('Estación','tiene correspondencia con','Estación','0N','0N',{roles:{a:'origen',b:'destino'},attr:'minutos_transbordo'}), R('Línea','pasa por','Estación','1N','1N',{attr:'orden'}), R('Línea','tiene','Tren','11','1N'), R('Tren','hace','Viaje','11','0N'), R('Viaje','incluye','Billete','11','0N'), R('Pasajero','compra','Billete','11','0N'), R('Estación','es subida de','Billete','11','0N'), R('Estación','es bajada de','Billete','11','0N')],
 asserts:[{t:'LINEA[cod_linea] ⊆ TREN[cod_linea]', why:'"Toda línea tiene al menos un tren".'},{t:'LINEA[cod_linea] ⊆ LINEA_ESTACION[cod_linea]', why:'"Toda línea pasa por alguna estación".'},{t:'ESTACION[cod_estacion] ⊆ LINEA_ESTACION[cod_estacion]', why:'"Toda estación está en alguna línea".'}],
 extra:['Billete es entidad débil de Viaje: identificador (viaje + asiento); clave parcial num_asiento.','Dos relaciones distintas Estación–Billete (subida y bajada): dos FKs a ESTACION en BILLETE.','La reflexiva N:M de correspondencias lleva el atributo minutos_transbordo (tabla CORRESPONDENCIA con dos FKs a ESTACION).'],
 tables:[T('ESTACION = cod_estacion*, nombre!, ciudad!'), T('CORRESPONDENCIA = cod_estacion_origen*->ESTACION, cod_estacion_destino*->ESTACION, minutos_transbordo!'), T('LINEA = cod_linea*, nombre!, color!'), T('LINEA_ESTACION = cod_linea*->LINEA, cod_estacion*->ESTACION, orden!'),
  T('TREN = matricula*, modelo!, num_plazas!, cod_linea!->LINEA'), T('VIAJE = num_viaje*, fecha_hora!, matricula!->TREN'), T('PASAJERO = dni*, nombre!, email!'), T('BILLETE = num_viaje*->VIAJE, num_asiento*, precio!, dni_pasajero!->PASAJERO, estacion_subida!->ESTACION, estacion_bajada!->ESTACION')]}
);

BQ.PCASES.push(
{id:'academia', name:'Academia de formación', level:1, from:'Enunciado de práctica · fácil',
 rules:['Una academia de formación quiere desarrollar una base de datos para gestionar su actividad.',
  'De cada persona matriculada se conoce su DNI, nombre, apellidos, teléfono y correo electrónico. La academia ofrece diferentes formaciones, de las que se almacena un código identificativo, nombre, duración y precio.',
  'Cada persona puede apuntarse a varias formaciones y una formación puede contar con diferentes personas matriculadas. Además, se necesita almacenar la fecha en la que cada persona se inscribe.',
  'Las formaciones son impartidas por profesionales externos o internos. De cada profesional se conoce su número de identificación, nombre y especialidad. Un profesional puede impartir varias formaciones, pero cada formación tiene asignado un único profesional.'],
 er:{entities:[{n:'Persona', attrs:[['dni','I'],['nombre',''],['apellidos',''],['telefono',''],['correo','']]},{n:'Formación', attrs:[['cod_formacion','I'],['nombre',''],['duracion',''],['precio','']]},{n:'Profesional', attrs:[['num_identificacion','I'],['nombre',''],['especialidad','']]}]},
 rels:[R('Persona','se inscribe en','Formación','0N','0N',{attr:'fecha_inscripcion'}), R('Profesional','imparte','Formación','11','0N')], asserts:[],
 extra:['Persona–Formación es N:M y la fecha de inscripción es un atributo de la relación (va en la tabla intermedia).','Que el profesional sea interno o externo no añade atributos propios: no hace falta una ISA. Si se quisiera guardar, sería un atributo tipo de Profesional.','La FK de la 1:N va en FORMACION (lado N): num_profesional → PROFESIONAL, NOT NULL porque cada formación tiene un único profesional.'],
 tables:[T('PERSONA = dni*, nombre!, apellidos!, telefono!, correo!'), T('PROFESIONAL = num_identificacion*, nombre!, especialidad!'), T('FORMACION = cod_formacion*, nombre!, duracion!, precio!, num_profesional!->PROFESIONAL'), T('INSCRIPCION = dni*->PERSONA, cod_formacion*->FORMACION, fecha_inscripcion!')]}
);

// ---------- RELÁMPAGO: pares (min,max) a partir de una frase (2 min) ----------
BQ.CARD1 = [
 ['Un cliente realiza pedidos; cada pedido es de un único cliente y un cliente puede no haber hecho ninguno.', 'Cliente (1,1) — realiza — (0,N) Pedido · 1:N.'],
 ['Un empleado trabaja en un único departamento; todo departamento tiene al menos un empleado.', 'Departamento (1,1) — tiene — (1,N) Empleado · 1:N. Mínimo 1 en el lado "1" → aserción DEPARTAMENTO ⊆ EMPLEADO.'],
 ['Un profesor imparte varias asignaturas (puede no impartir ninguna) y cada asignatura la imparte un único profesor.', 'Profesor (1,1) — imparte — (0,N) Asignatura · 1:N.'],
 ['Un coche tiene una única matrícula y cada matrícula es de un único coche.', 'Es un atributo (identificador) de Coche. Como relación: Coche (1,1) — (1,1) Matrícula · 1:1.'],
 ['Un médico atiende pacientes y un paciente es atendido por varios médicos. De cada visita se guarda la fecha y el mismo paciente y médico pueden verse varias veces.', 'Visita pasa a ser <b>entidad</b>: Médico (1,1) — (0,N) Visita y Paciente (1,1) — (0,N) Visita.'],
 ['Un empleado puede tener un jefe (otro empleado) y un jefe puede tener varios empleados a su cargo.', 'Reflexiva: Empleado [rol jefe] (0,1) — supervisa — (0,N) [rol subordinado] Empleado.'],
 ['Un libro lo escriben uno o varios autores y un autor ha escrito al menos un libro.', 'Autor (1,N) — escribe — (1,N) Libro · N:M.'],
 ['Cada reserva de hotel es de una sola habitación; una habitación puede no haberse reservado nunca.', 'Habitación (1,1) — se reserva en — (0,N) Reserva · 1:N.'],
 ['Un proveedor suministra un producto a un almacén en una cantidad determinada.', 'Ternaria Proveedor (0,N) — Producto (0,N) — Almacén (0,N) con atributo cantidad.'],
 ['Un alumno tiene un único tutor (profesor); un profesor puede ser tutor de varios alumnos o de ninguno.', 'Profesor (1,1) — tutoriza — (0,N) Alumno · 1:N.'],
 ['Un país tiene varias ciudades y una ciudad pertenece a un único país; la ciudad no existe sin su país.', 'País (1,1) — tiene — (1,N) Ciudad. Ciudad es entidad <b>débil</b> (doble rectángulo, rombo doble, clave parcial).'],
 ['Un usuario puede bloquear a otros usuarios.', 'Reflexiva N:M: Usuario [bloqueador] (0,N) — bloquea — (0,N) [bloqueado] Usuario.'],
 ['Un congreso tiene muchos asistentes y un asistente va a muchos congresos; se guarda la fecha de inscripción.', 'Asistente (0,N) — se inscribe en — (0,N) Congreso · N:M con atributo fecha_inscripcion.'],
 ['Cada película tiene un único director y un director ha dirigido al menos una película.', 'Director (1,1) — dirige — (1,N) Película · 1:N. Aserción DIRECTOR ⊆ PELICULA.'],
 ['Una persona es alumno o profesor (nunca las dos cosas) y todos son una de las dos.', 'ISA <b>total disyunta</b>: Persona → Alumno | Profesor. Aserciones: PERSONA ⊆ ALUMNO ∪ PROFESOR y ALUMNO ∩ PROFESOR = ∅.']
];

// ---------- RELÁMPAGO: paso a tablas de un patrón (3 min) ----------
BQ.TAB0 = [
 {q:'Cliente (1,1) — realiza — (0,N) Pedido', a:'PEDIDO = id + cliente_id + fecha\nCP(id)\nC.Aj(cliente_id) → CLIENTE(id)\nVNN(cliente_id)', h:['1:N → la FK va en el lado N (Pedido).','Mínimo 1 junto a Cliente → la FK es NOT NULL.']},
 {q:'Cliente (0,1) — realiza — (0,N) Pedido (un pedido puede no tener cliente)', a:'PEDIDO = id + cliente_id + fecha\nCP(id)\nC.Aj(cliente_id) → CLIENTE(id)      (sin VNN: admite NULL)', h:['El mínimo del lado "1" es 0 → la FK admite NULL.']},
 {q:'Alumno (0,N) — se matricula — (0,N) Curso, con atributo nota', a:'MATRICULA = dni_alumno + codigo_curso + nota\nCP(dni_alumno, codigo_curso)\nC.Aj(dni_alumno) → ALUMNO(dni)\nC.Aj(codigo_curso) → CURSO(codigo)', h:['N:M → tabla intermedia.','El atributo de la relación va en ella.']},
 {q:'Persona (1,1) — tiene — (1,1) Pasaporte', a:'PASAPORTE = id + numero + persona_id\nCP(id)   C.Alt(numero)\nC.Aj(persona_id) → PERSONA(id)\nVNN(persona_id)   C.Alt(persona_id)', h:['1:1 → FK en una de las dos tablas + UNIQUE (C.Alt) para que sea 1:1.']},
 {q:'Empleado [jefe] (0,1) — supervisa — (0,N) [subordinado] Empleado', a:'EMPLEADO = dni + nombre + dni_jefe\nCP(dni)\nC.Aj(dni_jefe) → EMPLEADO(dni)      (admite NULL)', h:['Reflexiva 1:N → FK a la propia tabla.','Mínimo 0 → admite NULL (el director no tiene jefe).']},
 {q:'Usuario [bloqueador] (0,N) — bloquea — (0,N) [bloqueado] Usuario', a:'BLOQUEO = id_bloqueador + id_bloqueado\nCP(id_bloqueador, id_bloqueado)\nC.Aj(id_bloqueador) → USUARIO(id)\nC.Aj(id_bloqueado) → USUARIO(id)', h:['Reflexiva N:M → tabla intermedia con dos FKs a la misma tabla.']},
 {q:'Proveedor (0,N) — suministra — (0,N) Producto — (0,N) Almacén, con atributo precio', a:'SUMINISTRO = proveedor_id + producto_id + almacen_id + precio\nCP(proveedor_id, producto_id, almacen_id)\nC.Aj → PROVEEDOR, PRODUCTO, ALMACEN\nVNN(precio)', h:['Ternaria → tabla con las tres FKs y CP de las tres.']},
 {q:'Cliente con un atributo multivalorado: teléfono', a:'TELEFONO_CLIENTE = cliente_id + telefono\nCP(cliente_id, telefono)\nC.Aj(cliente_id) → CLIENTE(id)', h:['Multivalorado → tabla aparte con CP compuesta.']},
 {q:'Pedido (1,N) — contiene — (1,1) Línea (Línea es entidad débil con clave parcial posición)', a:'LINEA = pedido_id + posicion + producto_id\nCP(pedido_id, posicion)\nC.Aj(pedido_id) → PEDIDO(id)', h:['Débil → CP = clave del fuerte + clave parcial.']},
 {q:'ISA parcial disyunta: Persona → Alumno | Profesor', a:'PERSONA = id + nombre         CP(id)\nALUMNO = id + curso          CP(id)  C.Aj(id) → PERSONA(id)\nPROFESOR = id + departamento CP(id)  C.Aj(id) → PERSONA(id)', h:['Una tabla por subtipo con FK a la CP del supertipo (que también es su CP).']},
 {q:'Departamento (1,1) — tiene — (1,N) Empleado', a:'EMPLEADO = dni + nombre + codigo_depto\nCP(dni)   C.Aj(codigo_depto) → DEPARTAMENTO(codigo)   VNN(codigo_depto)\nASERCIÓN: DEPARTAMENTO[codigo] ⊆ EMPLEADO[codigo_depto]', h:['La FK sola no garantiza que todo departamento tenga empleados: aserción.']},
 {q:'Cliente con dirección compuesta (calle, número, ciudad)', a:'CLIENTE = dni + nombre + calle + numero + ciudad\nCP(dni)', h:['Compuesto → una columna por componente.']}
];
})();
