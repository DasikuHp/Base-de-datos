// BDA-QUEST · contenido SOLO para el modo papel: E/R de los boletines (con solución propuesta),
// cardinalidades, normalización y los DML de los boletines que faltaban.
// Convención de clase: el par (min,max) va pegado a la entidad que se cuenta.
window.BQ = window.BQ || {};
(function () {
const P = s => [s[0], s[1]];                         // '0N' -> ['0','N']
const sing = {'0,1': 'como mucho 1', '1,1': 'exactamente 1', '0,N': '0 o varios', '1,N': '1 o varios'};
const R = (a, verb, b, na, nb, extra) => Object.assign({a, verb, b, na: P(na), nb: P(nb), tipo: (na[1] === 'N' && nb[1] === 'N') ? 'N:M' : (na[1] === 'N' || nb[1] === 'N') ? '1:N' : '1:1',
  why: `Junto a ${a}: ${sing[P(na).join()]} ${a.toLowerCase()} por cada ${b.toLowerCase()}. Junto a ${b}: ${sing[P(nb).join()]} ${b.toLowerCase()} por cada ${a.toLowerCase()}.`}, extra || {});
// tablas en notación compacta:  NOMBRE = col*, col!, col?, col+!, col!->TABLA, col*->TABLA#grupo
//   * CP · + C.Alt · ! obligatorio · ? opcional · ->T clave ajena (#n agrupa FKs compuestas)
const T = line => { const [name, rest] = line.split(' = '); return {name: name.trim(), cols: rest.split(',').map(s => {
  const m = /^\s*([A-Za-z0-9_]+)([*+!?]*)(?:->([A-Z_0-9]+)(?:#(\d))?)?\s*$/.exec(s); if (!m) throw new Error('col ' + s);
  const f = m[2]; return [m[1], (f.includes('*') ? 'P' : '') + (f.includes('+') ? 'A' : '') + (f.includes('!') ? 'V' : '') + (f.includes('?') ? 'o' : ''), m[3], undefined, m[4]]; })}; };

BQ.PCASES = [
{id:'concesionario', name:'Concesionario de coches', from:'Boletín 1 E/R · ej. 4',
 rules:['Clientes (a los que se compra y vende): CIF, nombre, teléfonos, calle, número, provincia y CP.',
  'Coches: matrícula, marca, modelo, color, número de bastidor, año de fabricación, kilómetros y una lista de desperfectos.',
  'Empleados de venta: DNI, nombre, fecha de nacimiento y de contratación, salario base y porcentaje de comisión.',
  'Compra: se anota el empleado, el coche, el cliente que lo vende y la fecha (un mismo coche puede comprarse varias veces en fechas distintas).',
  'A cada coche comprado se le pueden hacer reparaciones: se anotan las reparaciones, quién las realiza y su precio.',
  'Venta: se anota el vendedor, el coche, el cliente que compra, la fecha y el precio (un mismo coche puede venderse varias veces).'],
 er:{entities:[
  {n:'Cliente', attrs:[['cif','I'],['nombre',''],['telefono','m'],['calle','c'],['numero','c'],['provincia','c'],['cp','c']]},
  {n:'Coche', attrs:[['matricula','I'],['marca',''],['modelo',''],['color',''],['num_bastidor','a'],['anio_fabricacion',''],['kilometros',''],['desperfecto','m']]},
  {n:'Empleado', attrs:[['dni','I'],['nombre',''],['fecha_nacimiento',''],['fecha_contratacion',''],['salario_base',''],['porcentaje_comision','']]},
  {n:'Compra', attrs:[['id_compra','I'],['fecha','']]},
  {n:'Venta', attrs:[['id_venta','I'],['fecha',''],['precio','']]},
  {n:'Reparación', attrs:[['id_reparacion','I'],['descripcion',''],['realizada_por',''],['precio','']]}]},
 rels:[R('Empleado','realiza','Compra','11','0N'), R('Coche','es comprado en','Compra','11','1N'), R('Cliente','vende en','Compra','11','0N'),
  R('Empleado','realiza','Venta','11','0N'), R('Coche','es vendido en','Venta','11','0N'), R('Cliente','compra en','Venta','11','0N'), R('Coche','recibe','Reparación','11','0N')],
 asserts:[{t:'COCHE[matricula] ⊆ COMPRA[matricula]', why:'Todo coche del concesionario se ha comprado al menos una vez (mínimo 1 en Compra).'}],
 extra:['<b>Compra y Venta son entidades</b> (con identificador propio) y no relaciones: el mismo coche se compra o se vende varias veces en fechas distintas, y una relación N:M no permitiría repetir la pareja.','Desperfectos y teléfonos son <b>multivalorados</b> (doble óvalo). La dirección del cliente es un atributo <b>compuesto</b>.'],
 tables:[T('CLIENTE = cif*, nombre!, calle!, numero!, provincia!, cp!'), T('TELEFONO_CLIENTE = cif*->CLIENTE, telefono*'),
  T('COCHE = matricula*, marca!, modelo!, color!, num_bastidor+!, anio_fabricacion!, kilometros!'), T('DESPERFECTO = matricula*->COCHE, desperfecto*'),
  T('EMPLEADO = dni*, nombre!, fecha_nacimiento!, fecha_contratacion!, salario_base!, porcentaje_comision!'),
  T('COMPRA = id_compra*, fecha!, dni_empleado!->EMPLEADO, matricula!->COCHE, cif_cliente!->CLIENTE'),
  T('VENTA = id_venta*, fecha!, precio!, dni_empleado!->EMPLEADO, matricula!->COCHE, cif_cliente!->CLIENTE'),
  T('REPARACION = id_reparacion*, descripcion!, realizada_por!, precio!, matricula!->COCHE')]},

{id:'agencia', name:'Agencia de viajes', from:'Boletín 1 E/R · ej. 5',
 rules:['Los clientes reservan viajes. La reserva tiene identificador único, las plazas reservadas, el tiempo total para llegar y la compañía.',
  'El viaje reservado tiene ciudad de origen y de destino. Cada viaje se realiza como mínimo en un vuelo, aunque puede tener varios.',
  'De cada vuelo: IATA (compañía), fecha y hora de salida prevista de un aeropuerto, fecha y hora de llegada prevista a otro aeropuerto, y el avión que lo realiza.',
  'Los aeropuertos tienen código único, nombre, localidad y país. Los aviones: compañía, código y número de plazas.',
  'Un vuelo lo realiza un único avión, pero un avión puede realizar otros vuelos.',
  'Cada reserva es de un único cliente: dni, nombre, apellidos, dirección, teléfono y forma de pago (visa, paypal...) con número de tarjeta.'],
 er:{entities:[
  {n:'Cliente', attrs:[['dni','I'],['nombre',''],['apellidos',''],['direccion',''],['telefono',''],['forma_pago',''],['num_tarjeta','o']]},
  {n:'Reserva', attrs:[['id_reserva','I'],['plazas',''],['tiempo_total',''],['compania','']]},
  {n:'Viaje', attrs:[['id_viaje','I'],['ciudad_origen',''],['ciudad_destino','']]},
  {n:'Vuelo', attrs:[['id_vuelo','I'],['iata',''],['fecha_hora_salida',''],['fecha_hora_llegada','']]},
  {n:'Aeropuerto', attrs:[['codigo','I'],['nombre',''],['localidad',''],['pais','']]},
  {n:'Avión', attrs:[['codigo_avion','I'],['compania',''],['num_plazas','']]}]},
 rels:[R('Cliente','realiza','Reserva','11','0N'), R('Viaje','se reserva en','Reserva','11','0N'), R('Viaje','se realiza en','Vuelo','11','1N'),
  R('Aeropuerto','es origen de','Vuelo','11','0N'), R('Aeropuerto','es destino de','Vuelo','11','0N'), R('Avión','realiza','Vuelo','11','0N')],
 asserts:[{t:'VIAJE[id_viaje] ⊆ VUELO[id_viaje]', why:'"Cada viaje se realiza como mínimo en un vuelo" → mínimo 1: todo viaje aparece en VUELO.'}],
 extra:['<b>Dos relaciones</b> distintas entre Vuelo y Aeropuerto (origen y destino): no se pueden fundir en una.','Si lees que un vuelo sirve a varios viajes, Viaje–Vuelo sería N:M (tabla intermedia). Aquí se elige 1:N porque el enunciado habla de "los vuelos de un viaje".'],
 tables:[T('CLIENTE = dni*, nombre!, apellidos!, direccion!, telefono!, forma_pago!, num_tarjeta?'), T('VIAJE = id_viaje*, ciudad_origen!, ciudad_destino!'),
  T('RESERVA = id_reserva*, plazas!, tiempo_total!, compania!, dni_cliente!->CLIENTE, id_viaje!->VIAJE'), T('AEROPUERTO = codigo*, nombre!, localidad!, pais!'),
  T('AVION = codigo_avion*, compania!, num_plazas!'),
  T('VUELO = id_vuelo*, iata!, fecha_hora_salida!, fecha_hora_llegada!, id_viaje!->VIAJE, aeropuerto_salida!->AEROPUERTO, aeropuerto_llegada!->AEROPUERTO, codigo_avion!->AVION')]},

{id:'comidas', name:'Empresa de comidas', from:'Boletín 2 · DER 1',
 rules:['Empleados: nombre y apellidos, DNI, nº de Seguridad Social, teléfono fijo y móvil.',
  'Algunos empleados son cocineros (años de servicio) y otros pinches (fecha de nacimiento). La mayoría no son ni lo uno ni lo otro.',
  'Cada plato: nombre, precio, tipo (entrante, primero, segundo, postre) y los ingredientes que lleva con la cantidad y para cuántas personas.',
  'Cada almacén: número, nombre y descripción. Cada estante se identifica con dos letras y un tamaño en cm; dos almacenes distintos pueden tener estantes con las mismas letras.',
  'Hay que saber qué cocineros pueden preparar cada plato. Cada pinche está a cargo de un cocinero.',
  'Se guarda cuántas unidades de cada ingrediente hay en cada estante (se actualiza al instante).'],
 er:{entities:[
  {n:'Empleado', attrs:[['dni','I'],['nombre','c'],['apellidos','c'],['num_ss','a'],['telefono_fijo','o'],['movil','o']]},
  {n:'Cocinero', attrs:[['anios_servicio','']]}, {n:'Pinche', attrs:[['fecha_nacimiento','']]},
  {n:'Plato', attrs:[['id_plato','I'],['nombre',''],['precio',''],['tipo',''],['personas','']]},
  {n:'Ingrediente', attrs:[['id_ingrediente','I'],['nombre','']]},
  {n:'Almacén', attrs:[['num_almacen','I'],['nombre',''],['descripcion','']]},
  {n:'Estante', attrs:[['letras','p'],['tamano_cm','']]}]},
 rels:[R('Plato','lleva','Ingrediente','0N','1N',{attr:'cantidad'}), R('Cocinero','puede preparar','Plato','0N','0N'),
  R('Cocinero','está a cargo de','Pinche','11','0N'), R('Almacén','contiene','Estante','11','0N'), R('Ingrediente','se guarda en','Estante','0N','0N',{attr:'cantidad'})],
 asserts:[],
 extra:['<b>ISA</b> Empleado → Cocinero | Pinche: <b>parcial</b> ("la mayoría no son ni lo uno ni lo otro") y <b>disyunta</b> (nadie es las dos cosas).','<b>Estante es entidad débil</b> de Almacén: su identificador es (num_almacen + letras); clave parcial = letras (discontinuo), relación identificadora con doble rombo.','Ingrediente–Estante es N:M con atributo <b>cantidad</b> (las unidades en cada estante).'],
 tables:[T('EMPLEADO = dni*, nombre!, apellidos!, num_ss+!, telefono_fijo?, movil?'), T('COCINERO = dni*->EMPLEADO, anios_servicio!'),
  T('PINCHE = dni*->EMPLEADO, fecha_nacimiento!, dni_cocinero!->COCINERO'), T('PLATO = id_plato*, nombre!, precio!, tipo!, personas!'), T('INGREDIENTE = id_ingrediente*, nombre!'),
  T('PLATO_INGREDIENTE = id_plato*->PLATO, id_ingrediente*->INGREDIENTE, cantidad!'), T('COCINERO_PLATO = dni_cocinero*->COCINERO, id_plato*->PLATO'),
  T('ALMACEN = num_almacen*, nombre!, descripcion!'), T('ESTANTE = num_almacen*->ALMACEN, letras*, tamano_cm!'),
  T('ESTANTE_INGREDIENTE = num_almacen*->ESTANTE#1, letras*->ESTANTE#1, id_ingrediente*->INGREDIENTE, cantidad!')]},

{id:'escolar', name:'Centro escolar de FP', from:'Boletín 2 · DER 2',
 rules:['Solo interesa el control de ocupación de las aulas en el horario escolar: 6 horas diarias; se anota la hora (primera, segunda...) y el día de la semana.',
  'Asignaturas: nombre, código interno del centro y código europeo. La misma asignatura en dos ciclos tiene el mismo nombre y código europeo, pero distinto código interno. Hace falta saber en qué curso del ciclo se imparte.',
  'Ciclos: nombre, grado (superior, medio o iniciación profesional) y código interno.',
  'Aulas: código, nombre (no se repite), número (no se repite) y metros. A una hora concreta el aula puede estar vacía u ocupada por UNA sola asignatura.',
  'Una asignatura puede exigir haber aprobado otras antes (más de una).',
  'Cada asignatura la imparte un único profesor titular todo el año. Profesores: nombre, dirección, teléfono, email, DNI, nº de SS, código interno y los años de antigüedad impartiendo cada asignatura. Un profesor puede ser tutor de un curso y se anota su antigüedad como tutor.'],
 er:{entities:[
  {n:'Aula', attrs:[['cod_aula','I'],['nombre','a'],['num_aula','a'],['metros','']]},
  {n:'Franja', attrs:[['dia','p'],['hora','p']]},
  {n:'Asignatura', attrs:[['cod_interno','I'],['nombre',''],['cod_europeo','']]},
  {n:'Ciclo', attrs:[['cod_ciclo','I'],['nombre',''],['grado','']]},
  {n:'Profesor', attrs:[['cod_profesor','I'],['nombre',''],['direccion',''],['telefono',''],['email',''],['dni','a'],['num_ss','a']]}]},
 rels:[{verb:'ocupa', ternary:[{e:'Aula', m:['0','N']},{e:'Franja', m:['0','N']},{e:'Asignatura', m:['0','N']}], tipo:'N:M:N', why:'Ternaria: en una franja concreta, un aula tiene como mucho UNA asignatura. Por eso la CP es (aula, franja) y la asignatura queda como columna.'},
  R('Ciclo','incluye','Asignatura','11','1N',{attr:'curso'}), R('Asignatura','requiere','Asignatura','0N','0N',{roles:{a:'requisito',b:'requerida'}}),
  R('Profesor','imparte','Asignatura','11','0N',{attr:'anios_imparte'}), R('Profesor','tutoriza','Ciclo','0N','01',{attr:'curso, anios_tutor'})],
 asserts:[],
 extra:['<b>Aula–Franja–Asignatura es una ternaria</b> con una restricción: (aula, franja) determina la asignatura. En tablas: OCUPACION(cod_aula, dia, hora, cod_interno) con CP (cod_aula, dia, hora).','<b>Reflexiva</b> Asignatura–Asignatura N:M con roles requisito / requerida → tabla REQUISITO con dos FKs a ASIGNATURA y CP compuesta.','Los atributos de las relaciones 1:N (curso, años) viajan al lado N (ASIGNATURA).'],
 tables:[T('AULA = cod_aula*, nombre+!, num_aula+!, metros!'), T('FRANJA = dia*, hora*'), T('CICLO = cod_ciclo*, nombre!, grado!'),
  T('PROFESOR = cod_profesor*, nombre!, direccion!, telefono!, email!, dni+!, num_ss+!'),
  T('ASIGNATURA = cod_interno*, nombre!, cod_europeo!, cod_ciclo!->CICLO, curso!, cod_profesor!->PROFESOR, anios_imparte!'),
  T('OCUPACION = cod_aula*->AULA, dia*->FRANJA#1, hora*->FRANJA#1, cod_interno!->ASIGNATURA'),
  T('REQUISITO = cod_asignatura*->ASIGNATURA, cod_requisito*->ASIGNATURA'),
  T('TUTORIA = cod_profesor*->PROFESOR, cod_ciclo!->CICLO, curso!, anios_tutor!')]},

{id:'redsocial', name:'Red social', from:'Boletín 2 · DER 3',
 rules:['Usuarios: identificador numérico, mail (no se repite), contraseña obligatoria de 8 caracteres como mínimo, nombre, apellidos, dirección, teléfono (varios) y foto de perfil.',
  'Los usuarios tienen contactos (otros usuarios) y de cada contacto se guarda un comentario personal.',
  'Los usuarios organizan sus contactos en grupos (nombre); un mismo contacto puede estar en varios grupos.',
  'Cada usuario puede tener una lista de usuarios bloqueados.',
  'Los usuarios publican comentarios: públicos, restringidos (solo contactos) o exclusivos (contacto o grupo destinatario). Con texto y, opcionalmente, contenido binario (I imagen, A audio, V vídeo) y fecha de creación.'],
 er:{entities:[
  {n:'Usuario', attrs:[['id_usuario','I'],['mail','a'],['contrasena',''],['nombre',''],['apellidos',''],['direccion',''],['telefono','m'],['foto_perfil','o']]},
  {n:'Grupo', attrs:[['id_grupo','I'],['nombre','']]},
  {n:'Comentario', attrs:[['id_comentario','I'],['texto',''],['tipo_contenido','o'],['contenido','o'],['fecha_creacion',''],['visibilidad','']]}]},
 rels:[R('Usuario','tiene como contacto','Usuario','0N','0N',{roles:{a:'propietario',b:'contacto'},attr:'comentario'}), R('Usuario','bloquea','Usuario','0N','0N',{roles:{a:'bloqueador',b:'bloqueado'}}),
  R('Usuario','organiza','Grupo','11','0N'), R('Grupo','incluye','Usuario','0N','0N'), R('Usuario','publica','Comentario','11','0N'),
  R('Comentario','se dirige a','Usuario','0N','0N'), R('Comentario','se dirige a','Grupo','0N','0N')],
 asserts:[],
 extra:['<b>Dos reflexivas</b> N:M sobre Usuario (contactos y bloqueos): cada una necesita sus <b>roles</b>. La de contactos lleva el atributo <b>comentario</b>.','Teléfonos: <b>multivalorado</b>. La contraseña de 8 caracteres mínimo es una restricción de dominio (CHECK).','Los destinatarios solo existen en los comentarios exclusivos: relaciones opcionales (0,N).'],
 tables:[T('USUARIO = id_usuario*, mail+!, contrasena!, nombre!, apellidos!, direccion!, foto_perfil?'), T('TELEFONO_USUARIO = id_usuario*->USUARIO, telefono*'),
  T('CONTACTO = id_usuario*->USUARIO, id_contacto*->USUARIO, comentario?'), T('BLOQUEO = id_usuario*->USUARIO, id_bloqueado*->USUARIO'),
  T('GRUPO = id_grupo*, nombre!, id_usuario!->USUARIO'), T('GRUPO_CONTACTO = id_grupo*->GRUPO, id_contacto*->USUARIO'),
  T('COMENTARIO = id_comentario*, texto!, tipo_contenido?, contenido?, fecha_creacion!, visibilidad!, id_usuario!->USUARIO'),
  T('DESTINATARIO_USUARIO = id_comentario*->COMENTARIO, id_destinatario*->USUARIO'), T('DESTINATARIO_GRUPO = id_comentario*->COMENTARIO, id_grupo*->GRUPO')]},

{id:'piezas', name:'Piezas de ferretería (almacenes)', from:'Boletín normalización · ej. 3 (a y b)',
 rules:['Cada pieza: nombre, descripción y precio de venta. Se identifica con cuatro letras (tipo de pieza) y un número de modelo de 4 dígitos (TUER0006). Un mismo tipo siempre tiene el mismo nombre, aunque distinta descripción.',
  'Una pieza (la principal) puede estar formada por otras piezas en cierta cantidad, y viceversa (el TORN0006 se usa en una visagra y en pomos).',
  'Varios almacenes: identificador numérico, descripción y dirección postal.',
  'Cada almacén puede contener varias estanterías, identificadas por un código numérico, con posición, número de estantes, peso máximo y % de espacio libre. Una estantería está forzosamente en un almacén.',
  'Una estantería puede almacenar varias piezas, pero cada pieza está en una única estantería. Se anota la cantidad almacenada de cada pieza.'],
 er:{entities:[
  {n:'Tipo de pieza', attrs:[['tipo','I'],['nombre','']]},
  {n:'Pieza', attrs:[['modelo','p'],['descripcion',''],['precio','']]},
  {n:'Almacén', attrs:[['id_almacen','I'],['descripcion',''],['direccion','']]},
  {n:'Estantería', attrs:[['cod_estanteria','I'],['posicion',''],['num_estantes',''],['peso_max',''],['pct_libre','']]}]},
 rels:[R('Tipo de pieza','clasifica','Pieza','11','1N'), R('Pieza','está formada por','Pieza','0N','0N',{roles:{a:'principal',b:'componente'},attr:'cantidad'}),
  R('Almacén','contiene','Estantería','11','0N'), R('Estantería','almacena','Pieza','11','0N',{attr:'cantidad'})],
 asserts:[],
 extra:['<b>Pieza es entidad débil</b> de Tipo de pieza: su identificador es (tipo + modelo); clave parcial = modelo. Sacar el nombre a Tipo de pieza evita la dependencia tipo → nombre.','<b>Reflexiva N:M</b> con roles principal / componente y atributo cantidad.','En la relación 1:N Estantería–Pieza, la <b>cantidad</b> viaja a PIEZA (lado N).'],
 tables:[T('TIPO_PIEZA = tipo*, nombre!'), T('ALMACEN = id_almacen*, descripcion!, direccion!'), T('ESTANTERIA = cod_estanteria*, posicion!, num_estantes!, peso_max!, pct_libre!, id_almacen!->ALMACEN'),
  T('PIEZA = tipo*->TIPO_PIEZA, modelo*, descripcion!, precio!, cod_estanteria!->ESTANTERIA, cantidad!'),
  T('COMPOSICION = tipo_principal*->PIEZA#1, modelo_principal*->PIEZA#1, tipo_componente*->PIEZA#2, modelo_componente*->PIEZA#2, cantidad!')]}
];

// ---------- cardinalidades (Boletín 0) ----------
BQ.CARD0 = [
 ['Un tren contiene vagones.', 'Tren (1,1) — contiene — (1,N) Vagón. El vagón no existe sin el tren: entidad <b>débil</b> (doble rectángulo, rombo doble).'],
 ['Un libro tiene ejemplares.', 'Libro (1,1) — tiene — (1,N) Ejemplar. Ejemplar es débil (num_ejemplar = clave parcial).'],
 ['Una provincia está compuesta por municipios.', 'Provincia (1,1) — compuesta por — (1,N) Municipio. Municipio débil de Provincia.'],
 ['Un coche tiene matrícula.', 'Mejor: <b>matrícula es un atributo</b> de Coche (identificador o alternativa). Como relación sería Coche (1,1) — (1,1) Matrícula (1:1).'],
 ['Un autor escribe libros.', 'Autor (1,N) — escribe — (1,N) Libro: <b>N:M</b> (un libro puede tener varios autores).'],
 ['Un cliente realiza pedidos.', 'Cliente (1,1) — realiza — (0,N) Pedido: 1:N. Un cliente puede no tener pedidos; cada pedido es de exactamente un cliente.'],
 ['Tienda y trabajadores: la tienda es administrada por un trabajador.', 'Trabajador(<u>nº trabajador</u>, dni, nombre, apellidos) · Tienda(<u>cif</u>, nombre, dirección, m² <i>opcional</i>). Trabajador (1,1) — administra — (0,1) Tienda: cada tienda tiene exactamente un administrador y un trabajador administra como mucho una tienda.'],
 ['Un proveedor suministra material para una fábrica de coches.', 'Proveedor(<u>cif</u>, nombre sociedad, dirección, email, teléfono) · Pieza(<u>referencia</u>, tamaño). Proveedor (0,N) — suministra — (0,N) Pieza: <b>N:M</b>. Si hubiera varias fábricas: ternaria con Fábrica.'],
 ['Un médico atiende a varios pacientes y un paciente puede ser atendido por varios médicos. De cada consulta: fecha y diagnóstico.', 'Médico (0,N) — atiende — (0,N) Paciente: <b>N:M</b> con atributos fecha y diagnóstico. Si el mismo médico y paciente se ven varias veces, Consulta pasa a <b>entidad</b> (1,1)/(0,N) con cada uno.'],
 ['Estudiante cursa módulo. ¿Cómo guardar la nota de cada alumno en cada módulo?', 'Estudiante (0,N) — cursa — (0,N) Módulo: N:M. La <b>nota</b> es un <b>atributo de la relación</b> (en tablas, en la tabla intermedia CURSA).']
];

// ---------- normalización (Boletín normalización) ----------
BQ.NORM = [
{id:'n-1', title:'Ej. 1 · hasta 1FN', q:'Normaliza hasta 1FN: <code>X = a0 + a1 + {x + y + z}</code>', hints:['1FN = valores atómicos: nada de grupos repetidos {…}.','El grupo repetido {x+y+z} sale a otra tabla.','La nueva tabla lleva la clave de X (a0) para poder volver.'],
 sol:'<pre class="code">X1 = a0 + a1            CP(a0)\nX2 = a0 + x + y + z     CP(a0, x)   C.Aj(a0) → X1\n(si x no identifica cada repetición, CP(a0, x, y, z))</pre>', rub:['Saco el grupo repetido {x+y+z} a otra tabla','La nueva tabla incluye a0 como C.Aj hacia X1','CP de la nueva tabla compuesta con a0']},
{id:'n-2', title:'Ej. 2 · hasta 2FN', q:'Normaliza hasta 2FN: <code>A = a0 + {a1 + a2} + c + d</code> con <code>DF = {a1 → a2, c → d}</code>', hints:['Primero 1FN: saca el grupo repetido.','2FN: ¿algún atributo depende solo de una PARTE de la clave compuesta?','a1 → a2 es dependencia parcial en la tabla del grupo.'],
 sol:'<pre class="code">1FN:  A1 = a0 + c + d        CP(a0)\n      A2 = a0 + a1 + a2      CP(a0, a1)\n2FN:  A2a = a1 + a2          CP(a1)            (a1 → a2)\n      A2b = a0 + a1          CP(a0, a1)  C.Aj(a1) → A2a\n      A1 se queda (c → d es transitiva: eso es 3FN, no 2FN)</pre>', rub:['Hago 1FN sacando {a1+a2}','Detecto la dependencia parcial a1 → a2','Separo A2a(a1,a2) y A2b(a0,a1) con su C.Aj','No toco c → d (es de 3FN)']},
{id:'n-3', title:'Ej. 3 (c y d) · DFs y FNBC de las piezas', q:'Con el esquema de <b>piezas de ferretería</b> (ver su E/R y tablas en la sección E/R): busca las dependencias funcionales no triviales y normaliza hasta FNBC.', hints:['Una DF por cada determinante: la clave de cada tabla y cualquier otro atributo que determine algo.','«Un mismo tipo siempre tiene el mismo nombre»: tipo → nombre.','Comprueba que todo determinante es clave en su tabla.'],
 sol:'<pre class="code">DF:  tipo → nombre\n     (tipo, modelo) → descripcion, precio, cod_estanteria, cantidad\n     cod_estanteria → posicion, num_estantes, peso_max, pct_libre, id_almacen\n     id_almacen → descripcion, direccion\n     (tipo_p, modelo_p, tipo_c, modelo_c) → cantidad\nFNBC: TIPO_PIEZA(tipo, nombre) · PIEZA(tipo, modelo, descripcion, precio, cod_estanteria, cantidad)\n      ESTANTERIA(cod_estanteria, posicion, num_estantes, peso_max, pct_libre, id_almacen)\n      ALMACEN(id_almacen, descripcion, direccion) · COMPOSICION(...)\n(tipo → nombre ya está separada: PIEZA no repite el nombre)</pre>', rub:['Encuentro tipo → nombre','Encuentro cod_estanteria → … y id_almacen → …','Compruebo que todos los determinantes son clave']},
{id:'n-4', title:'Ej. 4 · concurso enológico', q:'<pre class="code">CATADORES = dniCatador + nombre + experiencia + dnipareja\nVINOS = codBarras + añada + precio + bodega\nCOMPOSICIÓN = codBarras + tipoUva + porcentaje\nCATAS = dniCatador + CodBarras + notaAromas + notaSabor + tipoVino</pre>a) Deduce las DF. b) Normaliza hasta FNBC. c) ¿Puedes unificar tablas?', hints:['Una DF por tabla: la clave determina el resto.','¿De qué depende el tipoVino: del catador+vino o solo del vino?','Si depende solo de codBarras es una dependencia PARCIAL en CATAS.'],
 sol:'<pre class="code">DF: dniCatador → nombre, experiencia, dnipareja\n    codBarras → añada, precio, bodega, tipoVino\n    (codBarras, tipoUva) → porcentaje\n    (dniCatador, codBarras) → notaAromas, notaSabor\nFNBC: CATADORES(dniCatador, nombre, experiencia, dnipareja)  C.Aj(dnipareja) → CATADORES\n      VINOS(codBarras, añada, precio, bodega, tipoVino)\n      COMPOSICION(codBarras, tipoUva, porcentaje)\n      CATAS(dniCatador, codBarras, notaAromas, notaSabor)\nc) tipoVino pasa de CATAS a VINOS (dependía solo de codBarras). Las demás tablas tienen claves distintas: no se unifican.</pre>', rub:['Escribo las 4 DF de las claves','Detecto codBarras → tipoVino (dependencia parcial en CATAS)','Muevo tipoVino a VINOS','Explico por qué no se unifican más tablas']},
{id:'n-5', title:'Ej. 5 · alumnos de un IES', q:'<code>ALUMNO = Expediente + Nombre + Ape1 + Ape2 + DNI + NSS + calle + municipio + provincia + CP</code><br>a) Claves candidatas. b) Elige CP y alternativas. c) DFs. d) Hasta FNBC.', hints:['Candidata = identifica a cada alumno sin repetirse: ¿cuáles?','CP → municipio, provincia (un código postal pertenece a un municipio).','El determinante CP no es clave de ALUMNO: dependencia transitiva.'],
 sol:'<pre class="code">a) Expediente, DNI, NSS\nb) CP(Expediente)  C.Alt(DNI)  C.Alt(NSS)\nc) Expediente → todo · DNI → todo · NSS → todo\n   CP → municipio, provincia · municipio → provincia\nd) ALUMNO(Expediente, Nombre, Ape1, Ape2, DNI, NSS, calle, CP)  C.Aj(CP)\n   CODIGO_POSTAL(CP, municipio)  C.Aj(municipio)\n   MUNICIPIO(municipio, provincia)</pre>', rub:['Las 3 claves candidatas','CP elegida y 2 alternativas','Detecto CP → municipio y municipio → provincia','Separo las tablas hasta FNBC']},
{id:'n-6a', title:'Ej. 6a', q:'<code>ALUMNOS = expediente + nombre + apellido + {teléfono} + dirección</code>', hints:['Hay un grupo repetido: {teléfono}.'], sol:'<pre class="code">ALUMNOS(expediente, nombre, apellido, dirección)\nTELEFONOS(expediente, teléfono)   CP(expediente, teléfono)   C.Aj(expediente) → ALUMNOS</pre>', rub:['Saco {teléfono} a otra tabla','CP compuesta y C.Aj a ALUMNOS']},
{id:'n-6b', title:'Ej. 6b', q:'<code>ALUMNOS = expediente + nombre + apellido + {asignatura + nota + curso + aula}</code> con <code>DF = {asignatura → curso, curso → aula}</code>', hints:['1FN: saca el grupo.','2FN: curso depende solo de asignatura (parte de la clave).','3FN: curso → aula es transitiva.'],
 sol:'<pre class="code">ALUMNOS(expediente, nombre, apellido)\nNOTAS(expediente, asignatura, nota)      CP(expediente, asignatura)\nASIGNATURAS(asignatura, curso)           C.Aj(curso) → CURSOS\nCURSOS(curso, aula)</pre>', rub:['1FN: saco el grupo repetido','2FN: asignatura → curso sale de NOTAS','3FN: curso → aula en tabla aparte']},
{id:'n-6c', title:'Ej. 6c', q:'<code>LIBROS = ISBN + título + editorial + país</code> (la editorial determina el país)', hints:['Dependencia transitiva: ISBN → editorial → país.'], sol:'<pre class="code">LIBROS(ISBN, título, editorial)   C.Aj(editorial) → EDITORIALES\nEDITORIALES(editorial, país)</pre>', rub:['Detecto editorial → país','Separo EDITORIALES']},
{id:'n-6d', title:'Ej. 6d', q:'<code>PERSONAS = DNI + Nombre + Apellidos + Dirección + CP + Población + Provincia</code>', hints:['CP → población, provincia.'], sol:'<pre class="code">PERSONAS(DNI, Nombre, Apellidos, Dirección, CP)   C.Aj(CP) → CODIGOS_POSTALES\nCODIGOS_POSTALES(CP, Población, Provincia)</pre>', rub:['Detecto CP → población, provincia','Separo CODIGOS_POSTALES']},
{id:'n-6e', title:'Ej. 6e', q:'<code>EMPLEADOS = DNI + NSS + Nombre + apellidos + departamento + puesto + salario</code>, C.Alt: NSS, <code>DF = {puesto → salario}</code>', hints:['puesto → salario: el determinante no es clave.'], sol:'<pre class="code">EMPLEADOS(DNI, NSS, Nombre, apellidos, departamento, puesto)   C.Alt(NSS)   C.Aj(puesto) → PUESTOS\nPUESTOS(puesto, salario)</pre>', rub:['Separo puesto → salario','Mantengo C.Alt(NSS)']},
{id:'n-6f', title:'Ej. 6f', q:'<code>FIGURAS = nombre + color + tamaño</code>, C.Alt: color + tamaño, <code>DF = {tamaño → nombre}</code>', hints:['¿nombre forma parte de alguna clave candidata? Si sí, está en 3FN, pero no en FNBC.','FNBC: todo determinante debe ser clave.'], sol:'<pre class="code">3FN: ya cumple (nombre es atributo primo).\nFNBC: TAMAÑOS(tamaño, nombre)   FIGURAS(color, tamaño)   C.Aj(tamaño) → TAMAÑOS\n(se pierde la DF nombre+color → tamaño: es el caso clásico en que FNBC no conserva todas las DF)</pre>', rub:['Explico que está en 3FN pero no en FNBC','Separo TAMAÑOS(tamaño, nombre)','Comento la pérdida de una DF']},
{id:'n-7', title:'Ej. 7 · ventas', q:'<code>VENTAS = fecha + vendedor + cliente + producto + NombreProducto + costeProducto + margenProducto + cantidadVendida + precioUnidad + importeBase + tipoIVA + %IVA + importeIVA + importeTotal + %comision + importeComision + ganancia</code><br>Cada vendedor tiene un único % de comisión; cada producto un único precio, coste y margen; cada tipo de IVA un único %. Se guardan los importes calculados por eficiencia. a) DFs. b) FNBC sin perder rendimiento.', hints:['Tres determinantes claros: vendedor, producto, tipoIVA.','Los importes calculados se quedan en VENTAS a propósito (rendimiento).'],
 sol:'<pre class="code">DF: vendedor → %comision\n    producto → NombreProducto, costeProducto, margenProducto, precioUnidad\n    tipoIVA → %IVA\n    (fecha, vendedor, cliente, producto) → cantidadVendida, tipoIVA y los importes\nFNBC: VENDEDORES(vendedor, %comision)\n      PRODUCTOS(producto, NombreProducto, costeProducto, margenProducto, precioUnidad)\n      IVA(tipoIVA, %IVA)\n      VENTAS(fecha, vendedor, cliente, producto, cantidadVendida, importeBase, tipoIVA,\n             importeIVA, importeTotal, importeComision, ganancia)\nLos importes calculados se mantienen en VENTAS (desnormalización consciente).</pre>', rub:['Tres DF: vendedor, producto, tipoIVA','Separo VENDEDORES, PRODUCTOS e IVA','Mantengo los importes calculados en VENTAS y lo justifico']},
{id:'n-8', title:'Ej. 8 · videoclub', q:'<code>AT = Película + Director + { Ejemplar + estado + {Fecha + Socio} }</code> con <code>DF = {Ejemplar → Película, Película → Director}</code>. Pasa a FNBC.', hints:['Hay dos grupos repetidos anidados.','Ejemplar → Película: cada ejemplar es de una película.'], sol:'<pre class="code">PELICULAS(Película, Director)\nEJEMPLARES(Ejemplar, Película, estado)     C.Aj(Película) → PELICULAS\nALQUILERES(Ejemplar, Fecha, Socio)         CP(Ejemplar, Fecha)   C.Aj(Ejemplar) → EJEMPLARES</pre>', rub:['Saco los dos grupos repetidos','PELICULAS(Película, Director)','EJEMPLARES con su C.Aj','ALQUILERES con CP (Ejemplar, Fecha)']}
];

// ---------- DML de los boletines que no estaban ----------
BQ.DMLW.push(
{id:'w-h-del4', db:'huerto', kind:'write', src:'Boletín 0 Huerto · ej. 7', title:'Elimina un monitor con talleres', prompt:'Elimina al monitor con DNI 33333333C. Ojo: imparte un taller. Escribe las sentencias necesarias.', ref:"DELETE FROM Taller WHERE dni_monitor = '33333333C'; DELETE FROM Monitor WHERE dni_monitor = '33333333C'", hints:['Taller tiene una FK RESTRICT hacia Monitor.','Primero los talleres del monitor (sus inscripciones caen en cascada), después el monitor.']},
{id:'w-h-grp5', db:'huerto', kind:'select', src:'Boletín 0 Huerto II · ej. 4', title:'Media de parcela superior a 25', prompt:'Muestra los vecinos cuya superficie promedio por parcela es superior a 25 m²: dni_vecino, número de parcelas, metros promedio y metros totales. Ordena por metros promedio de mayor a menor.', ref:'SELECT dni_vecino, COUNT(*), AVG(metros), SUM(metros) FROM Parcela GROUP BY dni_vecino HAVING AVG(metros) > 25 ORDER BY AVG(metros) DESC', hints:['HAVING AVG(metros) > 25.']},
{id:'w-h-grp6', db:'huerto', kind:'select', src:'Boletín 0 Huerto II · ej. 5', title:'Menor, mayor y diferencia', prompt:'Para los vecinos con más de 1 parcela muestra: dni_vecino, número de parcelas, tamaño de la más pequeña, de la más grande y la diferencia entre ambas. Ordena por diferencia de mayor a menor.', ref:'SELECT dni_vecino, COUNT(*), MIN(metros), MAX(metros), MAX(metros) - MIN(metros) FROM Parcela GROUP BY dni_vecino HAVING COUNT(*) > 1 ORDER BY MAX(metros) - MIN(metros) DESC', hints:['MIN, MAX y su resta en el SELECT; el filtro de la cuenta va en HAVING.']},
{id:'w-c-agg5', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 2', title:'Edad mínima', prompt:'Obtén la edad mínima de los ciclistas.', ref:'SELECT MIN(edad) FROM ciclista', hints:['MIN(edad).']},
{id:'w-c-agg6', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 5', title:'Cuántos equipos', prompt:'Obtén cuántos equipos hay registrados.', ref:'SELECT COUNT(*) FROM equipo', hints:['COUNT(*) sobre equipo.']},
{id:'w-c-agg7', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 7', title:'Distancia media', prompt:'Obtén la distancia media recorrida en las etapas.', ref:'SELECT AVG(km) FROM etapa', hints:['AVG(km).']},
{id:'w-c-agg8', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 8', title:'Altura máxima de puertos', prompt:'Obtén la altura máxima de los puertos.', ref:'SELECT MAX(altura) FROM puerto', hints:['MAX(altura).']},
{id:'w-c-agg9', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 9', title:'Premio total de los maillots', prompt:'Obtén el premio total ofrecido por todos los maillots.', ref:'SELECT SUM(premio) FROM maillot', hints:['SUM(premio).']},
{id:'w-c-grp4', db:'ciclismo', kind:'select', src:'Boletín 1 Ciclismo · ej. 14', title:'Altura media por categoría', prompt:'Obtén la altura media de los puertos de cada categoría.', ref:'SELECT categoria, AVG(altura) FROM puerto GROUP BY categoria', hints:['GROUP BY categoria.']},
{id:'w-i-14', db:'instituto', kind:'select', src:'Boletín extra · ej. 1', title:'Todos los alumnos', prompt:'Obtén todos los datos de todos los alumnos.', ref:'SELECT * FROM alumno', hints:['SELECT * FROM tabla.']},
{id:'w-i-15', db:'instituto', kind:'select', src:'Boletín extra · ej. 2', title:'Solo los nombres', prompt:'Obtén el listado de todos los nombres de los alumnos.', ref:'SELECT nombre FROM alumno', hints:['Una sola columna.']},
{id:'w-i-16', db:'instituto', kind:'select', src:'Boletín extra · ej. 4', title:'El alumno con id 5', prompt:'Obtén todos los datos del alumno con id igual a 5.', ref:'SELECT * FROM alumno WHERE id = 5', hints:['WHERE id = 5.']},
{id:'w-i-17', db:'instituto', kind:'select', src:'Boletín extra · ej. 7', title:'Por fecha de nacimiento descendente', prompt:'Obtén todos los alumnos ordenados por fecha_nacimiento de forma descendente.', ref:'SELECT * FROM alumno ORDER BY fecha_nacimiento DESC', hints:['ORDER BY ... DESC.']},
{id:'w-i-18', db:'instituto', kind:'select', src:'Boletín extra · ej. 14', title:'Email generado', prompt:'Obtén los alumnos con una columna adicional que muestre un email con el formato nombre.apellido1@instituto.es (todo en minúsculas).', ref:"SELECT *, CONCAT(LOWER(nombre), '.', LOWER(apellido1), '@instituto.es') FROM alumno", hints:['CONCAT(LOWER(nombre), \'.\', LOWER(apellido1), \'@instituto.es\').']},
{id:'w-i-19', db:'instituto', kind:'select', src:'Boletín extra · ej. 16', title:'Día de la semana y mes', prompt:'Obtén el nombre completo, el día de la semana y el mes de la fecha de nacimiento de cada alumno.', ref:"SELECT CONCAT_WS(' ', nombre, apellido1, apellido2), DAYNAME(fecha_nacimiento), MONTHNAME(fecha_nacimiento) FROM alumno", hints:['DAYNAME() y MONTHNAME().']}
);
})();
