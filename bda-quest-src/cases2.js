// BDA-QUEST · casos nuevos para el examen real (E/R + paso a tablas + DDL/DML).
// Añade campos que los casos antiguos no tienen:
//   er:{entities:[{n, attrs:[[nombre, marcas]]}], traps:[{n, why}]}   marcas: I = identificador, o = opcional, m = multivalorado, c = compuesto
//   rels[i].roles = {a, b}      → relación reflexiva (a === b): roles de cada extremo
//   rels[i].ternary = [{e, m:[min,max]}, ...]   → relación ternaria (el par = cuántas veces participa esa entidad)
//   rels[i].alts = [{na, nb, why}]              → otra lectura válida del enunciado
//   decisions = [{title, q, opts:[[texto, correcta, porqué]], truco}]   → "resolución del problema"
//   asserts = [{t:'A[x] ⊆ B[y]', why}]          → restricciones de existencialidad que exige el enunciado
//   img = 'img/archivo.png'                      → dibujo del enunciado
window.BQ = window.BQ || {};
(function () {
const C = BQ.CASES;

// ---------- aserciones (existencialidad) de los casos antiguos ----------
const A = (id, list) => { const c = C.find(x => x.id === id); if (c) c.asserts = list; };
A('huerto', []);
A('ciclismo', [{t:'EQUIPO[nomeq] ⊆ CICLISTA[nomeq]', why:'R2: "un equipo tiene al menos un ciclista" → mínimo 1 en el lado N. La FK va en CICLISTA, así que no basta: hay que exigir que todo equipo aparezca en CICLISTA.'}]);
A('hospital', [{t:'DOCTOR[num_colegiado] ⊆ CONSULTA[num_colegiado]', why:'R5: "todos los doctores están dando consultas" → mínimo 1: todo doctor debe aparecer en CONSULTA.'}]);
A('tienda', [{t:'PEDIDO[numero] ⊆ LINEA[numero_pedido]', why:'R5: "un pedido contiene al menos un producto" → todo pedido aparece en la tabla intermedia LINEA.'}]);
A('clinica', []);

C.push(

// =====================================================================================
{id:'festival', name:'Festival de cine (examen real)', from:'Examen Lógico · Parte 1 (E/R del festival)',
 rules:[
  'R1. Los <b>asistentes</b> compran entradas. De cada asistente: nombre completo, email y país (<b>opcional</b>). Cada asistente tiene un identificador único.',
  'R2. De cada <b>película</b>: título, año de estreno y duración. Puede asociarse a varias <b>etiquetas</b> (animación, ópera prima, restaurada...) o a ninguna. Una película <b>puede ser secuela de otra</b> película anterior, cuando exista.',
  'R3. Cada película tiene <b>un único director</b>. Del <b>director</b>: identificador, nombre completo y correo (opcional). Un director ha dirigido varias películas.',
  'R4. Las <b>salas</b> tienen código identificativo, ubicación y aforo.',
  'R5. Una película se proyecta en distintos momentos y salas; una sala acoge varias <b>proyecciones</b> en fechas distintas. De cada proyección se guarda la <b>fecha</b>. Toda proyección vincula <b>una película y una sala</b>.',
  'R6. Las <b>entradas</b> se emiten para <b>una proyección concreta</b> e incluyen el número de butaca y, si lo hay, un descuento (opcional). Cada entrada la adquiere <b>un único asistente</b>.',
  'R7. Todo lo que no se dice que es opcional es <b>obligatorio</b>, y todas las entidades llevan identificador único.'],
 er:{entities:[
   {n:'Asistente', attrs:[['id_asistente','I'],['nombre_completo',''],['email',''],['pais','o']]},
   {n:'Película', attrs:[['id_pelicula','I'],['titulo',''],['anio_estreno',''],['duracion','']]},
   {n:'Etiqueta', attrs:[['id_etiqueta','I'],['nombre','']]},
   {n:'Director', attrs:[['id_director','I'],['nombre_completo',''],['email','o']]},
   {n:'Sala', attrs:[['codigo_sala','I'],['ubicacion',''],['aforo','']]},
   {n:'Proyección', attrs:[['id_proyeccion','I'],['fecha','']]},
   {n:'Entrada', attrs:[['id_entrada','I'],['num_butaca',''],['descuento','o']]}],
  traps:[{n:'Compra', why:'«Compra» es la relación entre Asistente y Entrada (un verbo), no una entidad.'},{n:'Secuela', why:'«Secuela» es un ROL de la relación reflexiva Película—Película, no una entidad aparte.'}]},
 decisions:[
  {title:'¿Proyección: entidad o relación?', q:'Las entradas se emiten "para una proyección concreta". ¿Cómo modelas Proyección?',
   opts:[['Entidad con su identificador, unida a Película y a Sala (y a Entrada)',true,'Una entrada tiene que colgar de la proyección, y una relación no puede unirse a otra sin agregación. Como entidad, "toda proyección vincula una película y una sala" son dos (1,1).'],['Relación N:M entre Película y Sala con el atributo fecha',false,'Entonces Entrada no tendría de qué colgar, y la misma película en la misma sala en dos fechas no cabría.'],['Atributo "proyecciones" de Película',false,'Una proyección tiene fecha, sala y entradas propias: no es un dato suelto.']],
   truco:'Si algo se relaciona con otras cosas (aquí las entradas), no puede ser solo una relación: hazlo entidad.'},
  {title:'La secuela', q:'"Una película puede ser secuela de otra película anterior." ¿Cómo se dibuja?',
   opts:[['Relación reflexiva Película—Película con dos roles (original y secuela)',true,'Una entidad que se relaciona consigo misma = reflexiva, y los roles evitan la ambigüedad.'],['Una segunda entidad "Secuela"',false,'Una secuela ES una película: duplicarías datos.'],['Un atributo "secuela" de tipo texto',false,'No garantiza que la película original exista.']],
   truco:'Reflexiva = misma entidad en los dos extremos + un rol en cada punta.'},
  {title:'Las etiquetas', q:'Una película puede tener varias etiquetas o ninguna, y la misma etiqueta sirve para muchas películas. ¿Cómo se modela?',
   opts:[['Entidad Etiqueta y relación N:M (0,N)–(0,N) con Película',true,'Las etiquetas se reutilizan y tienen identidad propia: entidad + N:M.'],['Atributo multivalorado "etiquetas" en Película',false,'Valdría solo si fueran datos sueltos sin reutilizar; aquí son un catálogo compartido.'],['Relación 1:N Película → Etiqueta',false,'Una misma etiqueta (p. ej. "animación") sirve para muchas películas: es N:M.']],
   truco:'"Varios y varios" → N:M. Si lo compartido tiene nombre propio, es entidad.'}],
 rels:[
  {a:'Asistente', verb:'compra', b:'Entrada', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R6: cada entrada la adquiere un único asistente → (1,1) junto a Asistente. Un asistente puede comprar varias o ninguna → (0,N) junto a Entrada.'},
  {a:'Proyección', verb:'tiene', b:'Entrada', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R6: cada entrada es para UNA proyección → (1,1) junto a Proyección. Una proyección puede tener muchas entradas (o ninguna aún) → (0,N) junto a Entrada.'},
  {a:'Película', verb:'se proyecta', b:'Proyección', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R5: toda proyección vincula una película → (1,1) junto a Película. Una película puede proyectarse varias veces o ninguna → (0,N) junto a Proyección.'},
  {a:'Sala', verb:'acoge', b:'Proyección', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R5: toda proyección tiene una sala → (1,1) junto a Sala. Una sala acoge varias proyecciones o ninguna → (0,N) junto a Proyección.'},
  {a:'Director', verb:'dirige', b:'Película', na:['1','1'], nb:['1','N'], tipo:'1:N', alts:[{na:['1','1'], nb:['0','N'], why:'Lectura válida: el enunciado solo dice que un director "ha dirigido varias"; si no obliga a que todo director tenga película, el mínimo es 0. Con (1,N) harías falta una aserción.'}], why:'R3: cada película tiene UN director → (1,1) junto a Director. "Un director ha dirigido varias películas" → (1,N) junto a Película (admito también (0,N) si lo lees como opcional).'},
  {a:'Película', verb:'tiene', b:'Etiqueta', na:['0','N'], nb:['0','N'], tipo:'N:M', why:'R2: una película puede tener varias etiquetas o ninguna → (0,N); una etiqueta puede estar en muchas películas → (0,N). N:M.'},
  {a:'Película', verb:'es secuela de', b:'Película', roles:{a:'original', b:'secuela'}, na:['0','1'], nb:['0','N'], tipo:'1:N', why:'Reflexiva. Junto al rol "original": una secuela tiene como mucho UNA película original y puede no tener ninguna → (0,1). Junto al rol "secuela": una película puede tener varias secuelas o ninguna → (0,N).'}],
 asserts:[],
 tables:[
  {name:'ASISTENTE', cols:[['id_asistente','P'],['nombre_completo','V'],['email','V'],['pais','o']]},
  {name:'DIRECTOR', cols:[['id_director','P'],['nombre_completo','V'],['email','o']]},
  {name:'PELICULA', cols:[['id_pelicula','P'],['titulo','V'],['anio_estreno','V'],['duracion','V'],['id_director','V','DIRECTOR'],['id_pelicula_original','o','PELICULA']], note:'Reflexiva con roles: la FK auto-referenciada id_pelicula_original admite NULL (una película puede no ser secuela). R3: id_director es VNN ("cada película tiene un único director").'},
  {name:'ETIQUETA', cols:[['id_etiqueta','P'],['nombre','V']]},
  {name:'PELICULA_ETIQUETA', cols:[['id_pelicula','P','PELICULA'],['id_etiqueta','P','ETIQUETA']], note:'N:M → tabla intermedia con CP compuesta por las dos FKs.'},
  {name:'SALA', cols:[['codigo_sala','P'],['ubicacion','V'],['aforo','V']]},
  {name:'PROYECCION', cols:[['id_proyeccion','P'],['fecha','V'],['id_pelicula','V','PELICULA'],['codigo_sala','V','SALA']], note:'"Toda proyección vincula una película y una sala" → las dos FKs son VNN.'},
  {name:'ENTRADA', cols:[['id_entrada','P'],['num_butaca','V'],['descuento','o'],['id_proyeccion','V','PROYECCION'],['id_asistente','V','ASISTENTE']], note:'Cada entrada tiene siempre proyección y comprador → las dos FKs son VNN. El descuento es opcional.'}],
 ddl:`CREATE TABLE asistentes ( ⟦e1⟧
  id_asistente    INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  email           VARCHAR(120) NOT NULL,
  pais            VARCHAR(50)
);

CREATE TABLE director (
  id_director     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  email           VARCHAR(120)
);

CREATE TABLE pelicula (
  id_pelicula          INT AUTO_INCREMENT PRIMARY KEY,
  titulo               VARCHAR(150) NOT NULL,
  anio_estreno         SMALLINT NOT NULL,
  duracion             SMALLINT NOT NULL,
  id_director          INT, ⟦e2⟧
  id_pelicula_original INT NOT NULL, ⟦e3⟧
  FOREIGN KEY (id_director) REFERENCES director(id_director),
  FOREIGN KEY (id_pelicula_original) REFERENCES pelicula(id_pelicula)
);

CREATE TABLE etiqueta (
  id_etiqueta INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(40) NOT NULL
);

CREATE TABLE pelicula_etiqueta (
  id_pelicula INT NOT NULL,
  id_etiqueta INT NOT NULL,
  PRIMARY KEY (id_pelicula), ⟦e4⟧
  FOREIGN KEY (id_pelicula) REFERENCES pelicula(id_pelicula),
  FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
);

CREATE TABLE sala (
  codigo_sala INT AUTO_INCREMENT PRIMARY KEY,
  ubicacion   VARCHAR(80) NOT NULL,
  aforo       SMALLINT NOT NULL
);

CREATE TABLE proyeccion (
  id_proyeccion INT AUTO_INCREMENT PRIMARY KEY,
  fecha         DATE NOT NULL,
  id_pelicula   INT NOT NULL,
  codigo_sala   INT NOT NULL,
  FOREIGN KEY (id_pelicula) REFERENCES pelicula(id_pelicula) ⟦e5~⟧
); ⟦e5⟧

CREATE TABLE entrada (
  id_entrada    INT AUTO_INCREMENT PRIMARY KEY,
  num_butaca    SMALLINT NOT NULL,
  descuento     DECIMAL(4,2) NOT NULL, ⟦e6⟧
  id_proyeccion INT NOT NULL,
  id_asistente  INT NOT NULL,
  FOREIGN KEY (id_proyeccion) REFERENCES proyeccion(id_proyeccion),
  FOREIGN KEY (id_asistente) REFERENCES asistentes(id_asistente)
);`,
 errors:{
  e1:{why:[['singular','plural','asistentes','nombre']], model:'<b>Nombre en plural</b>: las tablas se nombran en <b>singular</b> (<code>asistente</code>, como <code>director</code> o <code>pelicula</code>). Una fila es UN asistente. Ojo: la FK de <code>entrada</code> también tendría que apuntar a <code>asistente</code>.'},
  e2:{why:[['not null','vnn','nulo','null','obligatori','un unico','cada pelicula']], model:'R3: cada película tiene <b>un único director</b> (obligatorio) → <code>id_director</code> debe ser <b>NOT NULL</b>. Tal como está se admiten películas sin director.'},
  e3:{why:[['null','nulo','opcional','secuela','no es secuela','puede no','original','primera']], model:'La reflexiva "es secuela de" es opcional (una película puede no ser secuela): <code>id_pelicula_original</code> debe <b>admitir NULL</b>. Con NOT NULL no se podría dar de alta ninguna película original.'},
  e4:{why:[['compuesta','id_etiqueta','las dos','ambas','falta','solo un','un solo']], model:'Tabla intermedia N:M: la CP debe ser <b>compuesta</b> <code>(id_pelicula, id_etiqueta)</code>. Con solo <code>id_pelicula</code> cada película tendría <b>una única</b> etiqueta.'},
  e5:{why:[['foreign','fk','c.aj','clave ajena','referenc','sala','falta']], model:'<b>Falta la FK</b> <code>FOREIGN KEY (codigo_sala) REFERENCES sala(codigo_sala)</code>: se podrían programar proyecciones en salas que no existen (R5).'},
  e6:{why:[['null','nulo','opcional','descuento','obligatori','cuando exista','si lo hay']], model:'El descuento es <b>opcional</b> ("cuando corresponda") → debe <b>admitir NULL</b>. Con NOT NULL habría que inventar un descuento 0 en cada entrada.'}}},

// =====================================================================================
{id:'consultora', name:'Consultora de proyectos (ternaria)', from:'Boletín 1 E/R, ejercicio 3 (adaptado)',
 rules:[
  'R1. De cada <b>empresa cliente</b>: código interno (la identifica), CIF (<b>no se repite</b>), nombre, dirección y teléfono.',
  'R2. Cada <b>proyecto</b> lo encarga <b>una única empresa</b>; <b>a todas las empresas</b> se les ha hecho <b>al menos un proyecto</b>. De cada proyecto: número, fecha de inicio, fecha de fin prevista y fecha de fin real (<b>puede no haber terminado</b>).',
  'R3. De cada <b>trabajador</b>: código (lo identifica), DNI (<b>no se repite</b>), nombre y apellidos. <b>Todos los trabajadores</b> han participado en algún proyecto.',
  'R4. De cada <b>rol</b>: código (lo identifica) y nombre (analista, jefe de proyecto, programador...). Hay roles que todavía no ha desempeñado nadie.',
  'R5. En un proyecto trabajan varios trabajadores y cada uno desempeña un rol; <b>un mismo trabajador puede tener roles distintos en el mismo proyecto</b>. Se anotan las <b>horas</b> trabajadas por cada trabajador, en cada rol y proyecto. (Es una relación <b>ternaria</b>: el par (min,max) dice cuántas veces participa una entidad.)'],
 er:{entities:[
   {n:'Empresa', attrs:[['codigo_empresa','I'],['cif',''],['nombre',''],['direccion',''],['telefono','']]},
   {n:'Proyecto', attrs:[['id_proyecto','I'],['fecha_inicio',''],['fecha_fin_prevista',''],['fecha_fin_real','o']]},
   {n:'Trabajador', attrs:[['codigo_trabajador','I'],['dni',''],['nombre',''],['apellidos','']]},
   {n:'Rol', attrs:[['codigo_rol','I'],['nombre','']]}],
  traps:[{n:'Participa', why:'«Participa» es la relación ternaria entre Proyecto, Trabajador y Rol, no una entidad.'},{n:'Horas', why:'«Horas» es un atributo de la relación ternaria (se guarda por trabajador, rol y proyecto).'}]},
 decisions:[
  {title:'Tres entidades a la vez', q:'Cada trabajador desempeña un rol EN un proyecto. ¿Cómo lo dibujas?',
   opts:[['Una relación ternaria Proyecto—Trabajador—Rol con el atributo horas',true,'Las tres entidades intervienen a la vez en cada hecho: ternaria, y "horas" cuelga de la relación.'],['Tres relaciones binarias separadas',false,'Perderías qué trabajador hizo qué rol en qué proyecto.'],['Un atributo "rol" dentro de Trabajador',false,'El rol cambia según el proyecto, no es propio del trabajador.']],
   truco:'Si el hecho necesita tres cosas juntas para tener sentido → ternaria.'},
  {title:'La ternaria a tablas', q:'¿Cómo se pasa la ternaria PARTICIPA(Proyecto, Trabajador, Rol, horas) a tablas?',
   opts:[['Una tabla con las 3 FKs y CP compuesta por las tres; horas va en esa tabla',true,'Las tres son N y un trabajador puede repetir rol/proyecto con otro rol: la CP es (proyecto, trabajador, rol).'],['Dos tablas N:M encadenadas',false,'Se pierde la combinación de los tres.'],['horas en la tabla TRABAJADOR',false,'Las horas dependen de los tres a la vez.']],
   truco:'Ternaria = tabla intermedia con 3 FKs y CP compuesta por las 3 (si los tres máximos son N).'}],
 rels:[
  {a:'Empresa', verb:'encarga', b:'Proyecto', na:['1','1'], nb:['1','N'], tipo:'1:N', why:'R2: cada proyecto lo encarga UNA empresa → (1,1) junto a Empresa. "A todas las empresas les hemos hecho al menos un proyecto" → (1,N) junto a Proyecto.'},
  {verb:'participa', ternary:[{e:'Proyecto', m:['0','N']},{e:'Trabajador', m:['1','N']},{e:'Rol', m:['0','N']}], attr:'horas', tipo:'N:M:N', why:'R3: todos los trabajadores han participado en algún proyecto → Trabajador (1,N). R2/R5: un proyecto puede no tener todavía participantes → Proyecto (0,N). R4: hay roles que nadie ha desempeñado → Rol (0,N). Atributo de la relación: horas.'}],
 asserts:[{t:'EMPRESA[codigo_empresa] ⊆ PROYECTO[codigo_empresa]', why:'R2: "a todas las empresas les hemos realizado al menos un proyecto" → mínimo 1: toda empresa aparece en PROYECTO.'},{t:'TRABAJADOR[codigo_trabajador] ⊆ PARTICIPA[codigo_trabajador]', why:'R3: "todos los trabajadores han participado en algún proyecto" → Trabajador (1,N) en la ternaria: todo trabajador aparece en PARTICIPA.'}],
 tables:[
  {name:'EMPRESA', cols:[['codigo_empresa','P'],['cif','AV'],['nombre','V'],['direccion','V'],['telefono','V']], note:'El CIF "no se repite" y es obligatorio → C.Alt(cif) + VNN(cif).'},
  {name:'PROYECTO', cols:[['id_proyecto','P'],['fecha_inicio','V'],['fecha_fin_prevista','V'],['fecha_fin_real','o'],['codigo_empresa','V','EMPRESA']], note:'1:N → la FK va en PROYECTO (lado N) y es VNN (lo encarga UNA empresa). fecha_fin_real admite NULL.'},
  {name:'TRABAJADOR', cols:[['codigo_trabajador','P'],['dni','AV'],['nombre','V'],['apellidos','V']]},
  {name:'ROL', cols:[['codigo_rol','P'],['nombre','V']]},
  {name:'PARTICIPA', cols:[['id_proyecto','P','PROYECTO'],['codigo_trabajador','P','TRABAJADOR'],['codigo_rol','P','ROL'],['horas','V']], note:'TERNARIA → tabla con las tres FKs; CP compuesta por las tres; horas es el atributo de la relación.'}],
 ddl:`CREATE TABLE empresa (
  codigo_empresa INT AUTO_INCREMENT PRIMARY KEY,
  cif            CHAR(9) NOT NULL, ⟦e1⟧
  nombre         VARCHAR(80) NOT NULL,
  direccion      VARCHAR(120) NOT NULL,
  telefono       VARCHAR(15) NOT NULL
);

CREATE TABLE proyecto (
  id_proyecto        INT AUTO_INCREMENT PRIMARY KEY,
  fecha_inicio       DATE NOT NULL,
  fecha_fin_prevista DATE NOT NULL,
  fecha_fin_real     DATE NOT NULL, ⟦e2⟧
  codigo_empresa     INT, ⟦e3⟧
  FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo_empresa)
);

CREATE TABLE trabajador (
  codigo_trabajador INT AUTO_INCREMENT PRIMARY KEY,
  dni               CHAR(9) UNIQUE NOT NULL,
  nombre            VARCHAR(50) NOT NULL,
  apellidos         VARCHAR(100) NOT NULL
);

CREATE TABLE rol (
  codigo_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(40) NOT NULL
);

CREATE TABLE participa (
  id_proyecto       INT NOT NULL,
  codigo_trabajador INT NOT NULL,
  codigo_rol        INT NOT NULL,
  horas             DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (id_proyecto, codigo_trabajador), ⟦e4⟧
  FOREIGN KEY (id_proyecto) REFERENCES proyecto(id_proyecto),
  FOREIGN KEY (codigo_trabajador) REFERENCES trabajador(codigo_trabajador)
); ⟦e5⟧`,
 errors:{
  e1:{why:[['unique','c.alt','repet','alternativa','unic']], model:'R1: el CIF <b>no se repite</b> → le falta <code>UNIQUE</code> (C.Alt). El NOT NULL solo no evita duplicados.'},
  e2:{why:[['null','nulo','opcional','obligatori','puede no','no ha terminado','no han terminado','real']], model:'R2: un proyecto puede no haber terminado → <code>fecha_fin_real</code> debe <b>admitir NULL</b>. El NOT NULL impide dar de alta proyectos en curso.'},
  e3:{why:[['not null','vnn','nulo','null','obligatori','una unica','una empresa']], model:'R2: cada proyecto lo encarga <b>una única empresa</b> (obligatorio) → <code>codigo_empresa</code> debe ser <b>NOT NULL</b>.'},
  e4:{why:[['compuesta','codigo_rol','rol','las tres','los tres','falta','tres']], model:'La CP de la ternaria debe incluir <b>las tres</b> columnas: <code>(id_proyecto, codigo_trabajador, codigo_rol)</code>. Sin <code>codigo_rol</code>, un trabajador no podría tener dos roles distintos en el mismo proyecto (R5).'},
  e5:{why:[['foreign','fk','c.aj','clave ajena','referenc','rol','falta']], model:'<b>Falta la FK</b> <code>FOREIGN KEY (codigo_rol) REFERENCES rol(codigo_rol)</code>: se podrían anotar roles que no existen.'}}},

// =====================================================================================
{id:'empresa', name:'Empresa: jefes y departamentos (reflexiva)', from:'Apuntes de lógico · reflexiva con roles + existencialidad',
 rules:[
  'R1. De cada <b>empleado</b>: DNI (lo identifica), nombre y salario. Un empleado puede tener <b>varios teléfonos</b>.',
  'R2. De cada <b>departamento</b>: código (lo identifica) y nombre. Todo empleado trabaja en <b>un único departamento</b>, y <b>todo departamento tiene al menos un empleado</b>.',
  'R3. Un empleado puede tener un <b>supervisor</b> (que es otro empleado) y un empleado puede supervisar a varios. El <b>director general no tiene supervisor</b>.'],
 er:{entities:[
   {n:'Empleado', attrs:[['dni','I'],['nombre',''],['salario',''],['telefono','m']]},
   {n:'Departamento', attrs:[['codigo_depto','I'],['nombre','']]}],
  traps:[{n:'Supervisor', why:'«Supervisor» es un ROL de la reflexiva Empleado—Empleado: sigue siendo un empleado, no una entidad nueva.'},{n:'Teléfono', why:'El teléfono es un atributo multivalorado de Empleado; solo pasará a ser tabla al convertir el E/R en tablas.'}]},
 decisions:[
  {title:'Reflexiva con roles', q:'Un empleado supervisa a otros empleados. ¿Cómo se dibuja?',
   opts:[['Relación reflexiva Empleado—Empleado con roles supervisor y subordinado',true,'Una entidad relacionada consigo misma; los roles indican qué papel juega cada extremo.'],['Dos entidades: Jefe y Empleado',false,'Un jefe también es empleado: se duplicarían los datos.'],['Un atributo "jefe" con el nombre del jefe',false,'No garantiza que el jefe exista; hay que referenciar al empleado.']],
   truco:'Reflexiva: la misma entidad en las dos puntas y un ROL en cada una.'},
  {title:'Reflexiva a tablas', q:'(0,1) supervisor y (0,N) subordinado. ¿Qué sale en tablas?',
   opts:[['Una FK auto-referenciada en EMPLEADO (dni_jefe → EMPLEADO) que admite NULL',true,'1:N reflexiva: FK en el lado N (el subordinado) apuntando a la propia tabla; min=0 → admite NULL (el director general no tiene jefe).'],['Una tabla intermedia SUPERVISA con dos FKs',false,'Solo haría falta si fuera N:M o tuviera atributos propios.'],['La FK dni_jefe como NOT NULL',false,'Con NOT NULL el director general no podría existir.']],
   truco:'Reflexiva 1:N = FK a sí misma; min 0 → NULL.'}],
 rels:[
  {a:'Departamento', verb:'tiene', b:'Empleado', na:['1','1'], nb:['1','N'], tipo:'1:N', why:'R2: todo empleado trabaja en UN departamento → (1,1) junto a Departamento. "Todo departamento tiene al menos un empleado" → (1,N) junto a Empleado.'},
  {a:'Empleado', verb:'supervisa', b:'Empleado', roles:{a:'supervisor', b:'subordinado'}, na:['0','1'], nb:['0','N'], tipo:'1:N', why:'R3: junto al rol "supervisor": un subordinado tiene como mucho UN supervisor y puede no tener ninguno (el director general) → (0,1). Junto a "subordinado": un supervisor puede supervisar varios o ninguno → (0,N).'}],
 asserts:[{t:'DEPARTAMENTO[codigo_depto] ⊆ EMPLEADO[codigo_depto]', why:'R2: "todo departamento tiene al menos un empleado" → mínimo 1: todo departamento aparece en EMPLEADO.'}],
 tables:[
  {name:'DEPARTAMENTO', cols:[['codigo_depto','P'],['nombre','V']]},
  {name:'EMPLEADO', cols:[['dni','P'],['nombre','V'],['salario','V'],['codigo_depto','V','DEPARTAMENTO'],['dni_jefe','o','EMPLEADO']], note:'Reflexiva: FK auto-referenciada dni_jefe → EMPLEADO(dni) que admite NULL (el director general no tiene jefe). codigo_depto es VNN.'},
  {name:'TELEFONO_EMPLEADO', cols:[['dni','P','EMPLEADO'],['telefono','P']], note:'Atributo MULTIVALORADO → tabla aparte con CP compuesta (dni, telefono) y FK a EMPLEADO.'}],
 ddl:`CREATE TABLE empleado ( ⟦e1~⟧
  dni           CHAR(9) PRIMARY KEY,
  nombre        VARCHAR(80) NOT NULL,
  salario       DECIMAL(8,2) NOT NULL,
  codigo_depto  INT, ⟦e2⟧
  dni_jefe      CHAR(9) NOT NULL, ⟦e3⟧
  FOREIGN KEY (codigo_depto) REFERENCES departamento(codigo_depto), ⟦e1⟧
  FOREIGN KEY (dni_jefe) REFERENCES empleado(dni)
);

CREATE TABLE departamento (
  codigo_depto INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(60) NOT NULL
);

CREATE TABLE telefono_empleado (
  dni      CHAR(9) NOT NULL,
  telefono VARCHAR(15) NOT NULL,
  PRIMARY KEY (dni), ⟦e4⟧
  FOREIGN KEY (dni) REFERENCES empleado(dni)
);`,
 errors:{
  e1:{why:[['orden','no existe','antes','todavia','aun no','despues','primero','se crea']], model:'<b>Orden de creación</b>: <code>empleado</code> tiene una FK hacia <code>departamento</code>, que se crea <b>después</b>. Al ejecutar ese CREATE la tabla referenciada aún no existe. Hay que crear <code>departamento</code> primero.'},
  e2:{why:[['not null','vnn','nulo','null','obligatori','un unico','departamento']], model:'R2: todo empleado trabaja en un único departamento (obligatorio) → <code>codigo_depto</code> debe ser <b>NOT NULL</b>.'},
  e3:{why:[['null','nulo','opcional','director','no tiene','puede no','jefe','supervisor']], model:'R3: el director general <b>no tiene supervisor</b> → la FK reflexiva <code>dni_jefe</code> debe <b>admitir NULL</b>. Con NOT NULL nadie podría ser el primer empleado.'},
  e4:{why:[['compuesta','telefono','multivalorado','varios','falta','solo un','un solo']], model:'Atributo multivalorado: la CP debe ser <b>compuesta</b> <code>(dni, telefono)</code>. Con solo <code>dni</code> cada empleado tendría <b>un único</b> teléfono, contra R1.'}}},

// =====================================================================================
{id:'huertoex', name:'Huerto (examen real · Parte 2)', from:'Examen Lógico · Parte 2 (paso a tablas del huerto)', img:'img/huerto-examen-er.png',
 rules:[
  'El diagrama es el del examen. <b>Atributos con línea discontinua = opcionales</b> (apellido2 de vecino y monitor, orientación); el resto son obligatorios.',
  'R1. <b>Vecino</b>: dni_vecino (identificador) y nombre compuesto (nombre, apellido1, apellido2). <b>Monitor</b>: dni_monitor y nombre compuesto (nombre, apellido1, apellido2).',
  'R2. <b>Taller</b>: id_taller y cupo. <b>Parcela</b>: id_parcela, metros y orientación.',
  'R3. <b>Se apunta a</b>: Vecino (0,n) – Taller (0,n), con atributo fecha_alta. <b>Imparte</b>: Taller (1,n) – Monitor (1,1), con atributo fecha_celebración. <b>Cultiva</b>: Vecino (0,1) – Parcela (1,n).'],
 er:{entities:[
   {n:'Vecino', attrs:[['dni_vecino','I'],['nombre_vecino','c'],['apellido1_vecino','c'],['apellido2_vecino','co']]},
   {n:'Monitor', attrs:[['dni_monitor','I'],['nombre_monitor','c'],['apellido1_monitor','c'],['apellido2_monitor','co']]},
   {n:'Taller', attrs:[['id_taller','I'],['cupo','']]},
   {n:'Parcela', attrs:[['id_parcela','I'],['metros',''],['orientacion','o']]}],
  traps:[{n:'Se apunta a', why:'«Se apunta a» es una relación (rombo) N:M, no una entidad.'}]},
 decisions:[
  {title:'Atributo compuesto', q:'El nombre del vecino es un atributo compuesto (nombre, apellido1, apellido2). ¿Cómo queda en la tabla VECINO?',
   opts:[['Una columna por cada parte: nombre_vecino, apellido1_vecino, apellido2_vecino',true,'Los compuestos se aplanan: cada componente es una columna (apellido2 admite NULL por ser opcional).'],['Una columna nombre_c_vecino con todo junto',false,'Rompería la atomicidad (1FN) y no se podría buscar por apellido.'],['Una tabla aparte NOMBRE',false,'No es multivalorado: no hace falta otra tabla.']],
   truco:'Compuesto → una columna por componente. Multivalorado → otra tabla.'},
  {title:'Atributo de la relación imparte', q:'"Imparte" (Taller 1,n – Monitor 1,1) lleva el atributo fecha_celebración. ¿Dónde va en tablas?',
   opts:[['En TALLER, que es el lado N donde está la FK',true,'En una 1:N el atributo de la relación migra al lado N junto con la FK.'],['En MONITOR',false,'Un monitor da varios talleres: no tendría una única fecha.'],['En una tabla IMPARTE',false,'Solo se crea tabla para las N:M; esta es 1:N.']],
   truco:'Relación 1:N con atributo → el atributo viaja a la tabla del lado N.'}],
 rels:[
  {a:'Vecino', verb:'se apunta a', b:'Taller', na:['0','N'], nb:['0','N'], tipo:'N:M', attr:'fecha_alta', why:'Diagrama: Vecino (0,n) y Taller (0,n) → N:M con el atributo fecha_alta en la relación.'},
  {a:'Monitor', verb:'imparte', b:'Taller', na:['1','1'], nb:['1','N'], tipo:'1:N', attr:'fecha_celebracion', why:'Diagrama: Monitor (1,1) → cada taller lo imparte UN monitor; Taller (1,n) → todo monitor imparte al menos un taller. 1:N con el atributo fecha_celebración.'},
  {a:'Vecino', verb:'cultiva', b:'Parcela', na:['0','1'], nb:['1','N'], tipo:'1:N', why:'Diagrama: Vecino (0,1) → una parcela puede no tener vecino (la FK admite NULL); Parcela (1,n) → todo vecino cultiva al menos una parcela (aserción).'}],
 asserts:[{t:'VECINO[dni_vecino] ⊆ PARCELA[dni_vecino]', why:'Vecino —cultiva— Parcela (1,n): "todo vecino cultiva al menos una parcela" → todo vecino debe aparecer en PARCELA. La FK está en PARCELA, así que esto NO sale de la clave ajena: hay que escribirlo.'},{t:'MONITOR[dni_monitor] ⊆ TALLER[dni_monitor]', why:'Monitor —imparte— Taller: Taller (1,n) → todo monitor imparte al menos un taller → todo monitor aparece en TALLER.'}],
 tables:[
  {name:'VECINO', cols:[['dni_vecino','P'],['nombre_vecino','V'],['apellido1_vecino','V'],['apellido2_vecino','o']], note:'Atributo compuesto → una columna por componente; apellido2 es opcional (línea discontinua) → admite NULL.'},
  {name:'MONITOR', cols:[['dni_monitor','P'],['nombre_monitor','V'],['apellido1_monitor','V'],['apellido2_monitor','o']]},
  {name:'TALLER', cols:[['id_taller','P'],['cupo','V'],['fecha_celebracion','V'],['dni_monitor','V','MONITOR']], note:'1:N → FK en TALLER (lado N), VNN porque Monitor es (1,1). fecha_celebracion es el atributo de "imparte" y viaja a TALLER.'},
  {name:'PARCELA', cols:[['id_parcela','P'],['metros','V'],['orientacion','o'],['dni_vecino','o','VECINO']], note:'Vecino (0,1): una parcela puede no tener vecino → la FK dni_vecino admite NULL. La orientación es opcional.'},
  {name:'SE_APUNTA', cols:[['dni_vecino','P','VECINO'],['id_taller','P','TALLER'],['fecha_alta','V']], note:'N:M → tabla intermedia con CP compuesta; fecha_alta es el atributo de la relación.'}],
 ddl:`CREATE TABLE vecino (
  dni_vecino        CHAR(9) PRIMARY KEY,
  nombre_vecino     VARCHAR(50) NOT NULL,
  apellido1_vecino  VARCHAR(50) NOT NULL,
  apellido2_vecino  VARCHAR(50)
);

CREATE TABLE monitor (
  dni_monitor       CHAR(9) PRIMARY KEY,
  nombre_monitor    VARCHAR(50) NOT NULL,
  apellido1_monitor VARCHAR(50) NOT NULL,
  apellido2_monitor VARCHAR(50) NOT NULL, ⟦e1⟧
  fecha_celebracion DATE NOT NULL ⟦e2⟧
);

CREATE TABLE taller (
  id_taller   INT AUTO_INCREMENT PRIMARY KEY,
  cupo        SMALLINT NOT NULL,
  dni_monitor CHAR(9), ⟦e3⟧
  FOREIGN KEY (dni_monitor) REFERENCES monitor(dni_monitor)
);

CREATE TABLE parcela (
  id_parcela  INT AUTO_INCREMENT PRIMARY KEY,
  metros      DECIMAL(6,2) NOT NULL,
  orientacion VARCHAR(10),
  dni_vecino  CHAR(9) NOT NULL, ⟦e4⟧
  FOREIGN KEY (dni_vecino) REFERENCES vecino(dni_vecino)
);

CREATE TABLE se_apunta (
  dni_vecino  CHAR(9) NOT NULL,
  id_taller   INT NOT NULL,
  fecha_alta  DATE NOT NULL,
  PRIMARY KEY (dni_vecino), ⟦e5⟧
  FOREIGN KEY (dni_vecino) REFERENCES vecino(dni_vecino),
  FOREIGN KEY (id_taller) REFERENCES taller(id_taller)
);`,
 errors:{
  e1:{why:[['null','nulo','opcional','discontinua','puede no','obligatori','apellido2']], model:'El segundo apellido del monitor es <b>opcional</b> (línea discontinua en el diagrama) → <code>apellido2_monitor</code> debe <b>admitir NULL</b>.'},
  e2:{why:[['taller','imparte','atributo','lado n','otra tabla','no va','monitor','muchos']], model:'<code>fecha_celebracion</code> es el atributo de la relación <b>imparte</b> (1:N): debe ir en <b>TALLER</b> (lado N, donde está la FK), no en MONITOR. Un monitor da varios talleres y no tiene una única fecha.'},
  e3:{why:[['not null','vnn','nulo','null','obligatori','un unico','(1,1)','monitor']], model:'Diagrama: Monitor (1,1) → cada taller tiene <b>exactamente un</b> monitor → <code>dni_monitor</code> debe ser <b>NOT NULL</b>.'},
  e4:{why:[['null','nulo','opcional','(0,1)','puede no','sin vecino','sin dueno','vecino']], model:'Vecino (0,1) en "cultiva": una parcela <b>puede no tener vecino</b> → <code>dni_vecino</code> debe <b>admitir NULL</b>. Con NOT NULL no se podrían registrar parcelas libres.'},
  e5:{why:[['compuesta','id_taller','las dos','ambas','falta','solo un','un solo']], model:'Tabla intermedia de la N:M: la CP debe ser <b>compuesta</b> <code>(dni_vecino, id_taller)</code>. Con solo <code>dni_vecino</code> cada vecino se apuntaría a un único taller.'}}}

); // fin C.push

// alternativas aceptadas para los roles de las reflexivas
C.forEach(c => c.rels.forEach(r => {
  if (r.verb === 'es secuela de') { r.ra = ['original', 'precuela', 'anterior', 'primera', 'previa']; r.rb = ['secuela', 'continuacion', 'posterior', 'segunda', 'sucesora']; }
  if (r.verb === 'supervisa' && r.roles) { r.ra = ['supervisor', 'jefe']; r.rb = ['subordinad', 'empleado', 'supervisad']; }
}));
})();
