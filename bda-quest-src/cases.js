// BDA-QUEST · Casos con formato de examen (3 partes):
//   1) E/R: poner los (min,max) de cada relación a partir de las reglas.
//   2) Paso a tablas: marcar CP, C.Alt, C.Aj y VNN de cada columna.
//   3) Validar el DDL contra el enunciado: marcar las líneas mal y explicar POR QUÉ (campo libre).
//
// Convención (la de los dibujos de la web): el par pegado a una entidad dice cuántas de ESA
// entidad le corresponden a UNA de la otra. na = par junto a la entidad a; nb = par junto a b.
//
// Columnas de las tablas: [nombre, marcas, tabla a la que apunta (C.Aj)]
//   P = forma parte de la CP · A = C.Alt · V = VNN obligatorio · o = debe admitir NULL
//   (sin V ni o = el enunciado no lo dice, no se corrige)
//
// DDL: ⟦eN⟧ al final de la línea donde está el error N; ⟦eN~⟧ = otra línea que también vale.
// Cada error: why = grupos de palabras (vale si hay al menos una de cada grupo), model = respuesta modelo.
window.BQ = window.BQ || {};
BQ.CASES = [
{id:'huerto', name:'Huertos comunitarios', from:'huertos.sql y Boletín 0 SQL Huerto',
 rules:[
  'R1. De cada <b>vecino</b> se guarda su DNI (lo identifica), nombre, primer apellido y, si lo tiene, segundo apellido.',
  'R2. De cada <b>parcela</b> se guarda un número interno, los metros y la orientación. Toda parcela pertenece a <b>un único vecino</b>; un vecino <b>puede no tener</b> parcelas o tener varias.',
  'R3. De cada <b>monitor</b> se guarda su DNI, nombre y sus dos apellidos (obligatorios).',
  'R4. De cada <b>taller</b> se guarda un número interno, el equipo necesario y la fecha en que se celebra. Cada taller lo imparte <b>exactamente un</b> monitor; un monitor puede impartir varios talleres o ninguno todavía.',
  'R5. Los vecinos <b>se apuntan</b> a talleres y se guarda la <b>fecha de alta</b>. Un vecino puede no apuntarse a ninguno y un taller puede no tener apuntados.'],
 rels:[
  {a:'Vecino', verb:'tiene', b:'Parcela', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R2: cada parcela tiene exactamente 1 vecino → (1,1) junto a Vecino. Un vecino puede tener 0 o varias parcelas → (0,N) junto a Parcela.'},
  {a:'Monitor', verb:'imparte', b:'Taller', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R4: "exactamente un monitor" por taller → (1,1) junto a Monitor. "Varios o ninguno todavía" → (0,N) junto a Taller.'},
  {a:'Vecino', verb:'se apunta', b:'Taller', na:['0','N'], nb:['0','N'], tipo:'N:M', attr:'fecha_alta', why:'R5: un taller puede tener 0 o muchos vecinos y un vecino 0 o muchos talleres → N:M con el atributo fecha_alta en la relación.'}],
 tables:[
  {name:'VECINO', cols:[['dni_vecino','P'],['nombre','V'],['apellido1','V'],['apellido2','o']]},
  {name:'PARCELA', cols:[['id_parcela','P'],['metros',''],['orientacion',''],['dni_vecino','V','VECINO']], note:'R2: "toda parcela pertenece a un único vecino" → la FK no puede ser NULL.'},
  {name:'MONITOR', cols:[['dni_monitor','P'],['nombre','V'],['apellido1','V'],['apellido2','V']]},
  {name:'TALLER', cols:[['id_taller','P'],['equipo',''],['fecha',''],['dni_monitor','V','MONITOR']], note:'1:N → la FK va en TALLER (lado N) y es VNN porque lo imparte "exactamente un" monitor.'},
  {name:'SE_APUNTA', cols:[['dni_vecino','P','VECINO'],['id_taller','P','TALLER'],['fecha_alta','V']], note:'N:M → tabla intermedia con CP compuesta por las dos FKs; fecha_alta es el atributo de la relación.'}],
 ddl:`CREATE TABLE vecino (
  dni_vecino   CHAR(9),
  nombre       VARCHAR(50) NOT NULL,
  apellido1    VARCHAR(50) NOT NULL,
  apellido2    VARCHAR(50) NOT NULL, ⟦e1⟧
  PRIMARY KEY (dni_vecino)
);

CREATE TABLE parcela (
  id_parcela   INT AUTO_INCREMENT PRIMARY KEY,
  metros       DECIMAL(6,2) NOT NULL,
  orientacion  VARCHAR(10) NOT NULL,
  dni_vecino   CHAR(9), ⟦e2⟧
  FOREIGN KEY (dni_vecino) REFERENCES vecino(dni_vecino) ⟦e2~⟧
);

CREATE TABLE taller (
  id_taller    INT AUTO_INCREMENT PRIMARY KEY,
  equipo       VARCHAR(100) NOT NULL,
  fecha        VARCHAR(10) NOT NULL, ⟦e3⟧
  dni_monitor  CHAR(9) NOT NULL,
  FOREIGN KEY (dni_monitor) REFERENCES monitor(dni_monitor) ⟦e4⟧
); ⟦e4~⟧

CREATE TABLE monitor (
  dni_monitor  CHAR(9) PRIMARY KEY,
  nombre       VARCHAR(50) NOT NULL,
  apellido1    VARCHAR(50) NOT NULL,
  apellido2    VARCHAR(50) NOT NULL
);

CREATE TABLE se_apunta (
  dni_vecino   CHAR(9) NOT NULL,
  id_taller    INT NOT NULL,
  fecha_alta   DATE NOT NULL,
  PRIMARY KEY (dni_vecino), ⟦e5⟧
  FOREIGN KEY (dni_vecino) REFERENCES vecino(dni_vecino),
  FOREIGN KEY (id_taller) REFERENCES taller(equipo) ⟦e6⟧
);`,
 errors:{
  e1:{why:[['opcional','obligatori','null','nulo','si lo tiene','puede no']], model:'R1 dice "si lo tiene": el segundo apellido es <b>opcional</b>, así que no puede llevar NOT NULL. Con NOT NULL no se podría dar de alta a un vecino sin segundo apellido.'},
  e2:{why:[['not null','vnn','nulo','null','obligatori']], model:'R2: toda parcela pertenece a un único vecino (participación obligatoria) → la FK <code>dni_vecino</code> debe ser <b>NOT NULL</b> (VNN). Tal como está se admiten parcelas sin dueño.'},
  e3:{why:[['date','tipo','texto','varchar','cadena']], model:'Una fecha guardada como <b>VARCHAR</b>: debe ser <b>DATE</b>. Como texto se aceptan valores imposibles ("31-02-xx") y no se puede ordenar ni calcular con fechas.'},
  e4:{why:[['orden','no existe','antes','todavia','aun no','despues','primero','se crea']], model:'<b>Orden de creación</b>: la FK apunta a <code>monitor</code>, que se crea <b>después</b>. Al ejecutar este CREATE la tabla referenciada no existe y da error. Hay que crear <code>monitor</code> antes (o añadir la FK luego con ALTER TABLE).'},
  e5:{why:[['compuesta','id_taller','las dos','ambas','falta','solo un','un solo']], model:'Tabla intermedia de una N:M: la CP debe ser <b>compuesta</b> <code>(dni_vecino, id_taller)</code>. Con solo <code>dni_vecino</code> cada vecino podría apuntarse a <b>un único</b> taller, y R5 permite varios.'},
  e6:{why:[['equipo','no es clave','no es la clave','no es pk','primaria','primary','unique','id_taller','clave','tipo']], model:'La FK <code>id_taller</code> referencia <code>taller(equipo)</code>, que <b>no es PK ni UNIQUE</b> (y además es VARCHAR frente a INT). Debe referenciar <code>taller(id_taller)</code>.'}
 }},

{id:'ciclismo', name:'Vuelta ciclista', from:'ciclismo.sql y Boletín 1 SQL',
 rules:[
  'R1. De cada <b>equipo</b> se guarda su nombre (lo identifica) y el director, que puede no constar.',
  'R2. De cada <b>ciclista</b>: dorsal (lo identifica), nombre (obligatorio) y edad (puede no constar). Todo ciclista pertenece a <b>un único equipo</b>; un equipo tiene <b>al menos un</b> ciclista.',
  'R3. De cada <b>etapa</b>: número (la identifica), km, salida y llegada (obligatorios). Cada etapa la gana <b>como mucho un</b> ciclista (si aún no se ha corrido, no tiene ganador); un ciclista puede ganar varias etapas o ninguna.',
  'R4. De cada <b>puerto</b>: nombre (lo identifica), altura y categoría (obligatorias) y pendiente (puede no constar). Cada puerto está en <b>exactamente una</b> etapa; una etapa puede tener varios puertos o ninguno. Cada puerto lo gana como mucho un ciclista.',
  'R5. De cada <b>maillot</b>: código (lo identifica), tipo, color y premio.',
  'R6. En cada etapa, <b>cada maillot lo lleva un único ciclista</b>. Un ciclista puede llevar varios maillots en varias etapas.'],
 rels:[
  {a:'Equipo', verb:'tiene', b:'Ciclista', na:['1','1'], nb:['1','N'], tipo:'1:N', why:'R2: cada ciclista está en exactamente 1 equipo → (1,1) junto a Equipo. Un equipo tiene "al menos un" ciclista → (1,N) junto a Ciclista.'},
  {a:'Ciclista', verb:'gana', b:'Etapa', na:['0','1'], nb:['0','N'], tipo:'1:N', why:'R3: una etapa tiene "como mucho un" ganador y puede no tenerlo → (0,1) junto a Ciclista. Un ciclista gana 0 o varias → (0,N) junto a Etapa.'},
  {a:'Etapa', verb:'tiene', b:'Puerto', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R4: cada puerto está en "exactamente una" etapa → (1,1) junto a Etapa. Una etapa tiene 0 o varios puertos → (0,N) junto a Puerto.'}],
 tables:[
  {name:'EQUIPO', cols:[['nomeq','P'],['director','o']], note:'ASERCIÓN: EQUIPO[nomeq] ⊆ CICLISTA[nomeq] (todo equipo tiene al menos un ciclista: no sale con FK).'},
  {name:'CICLISTA', cols:[['dorsal','P'],['nombre','V'],['edad','o'],['nomeq','V','EQUIPO']]},
  {name:'ETAPA', cols:[['netapa','P'],['km','V'],['salida','V'],['llegada','V'],['dorsal','o','CICLISTA']], note:'El ganador puede no existir → la FK dorsal admite NULL.'},
  {name:'PUERTO', cols:[['nompuerto','P'],['altura','V'],['categoria','V'],['pendiente','o'],['netapa','V','ETAPA'],['dorsal','o','CICLISTA']]},
  {name:'MAILLOT', cols:[['codigo','P'],['tipo',''],['color',''],['premio','']]},
  {name:'LLEVAR', cols:[['netapa','P','ETAPA'],['codigo','P','MAILLOT'],['dorsal','V','CICLISTA']], note:'R6: "en cada etapa, cada maillot lo lleva un único ciclista" → la CP es (netapa, codigo); el dorsal NO entra en la CP (si entrase, dos ciclistas podrían llevar el mismo maillot en la misma etapa).'}],
 ddl:`CREATE TABLE equipo (
  nomeq     VARCHAR(25) PRIMARY KEY,
  director  VARCHAR(30) NOT NULL ⟦e1⟧
);

CREATE TABLE ciclista (
  dorsal    SMALLINT PRIMARY KEY,
  nombre    VARCHAR(30) NOT NULL,
  edad      SMALLINT,
  nomeq     INT NOT NULL, ⟦e2⟧
  FOREIGN KEY (nomeq) REFERENCES equipo(nomeq) ⟦e2~⟧
);

CREATE TABLE etapa (
  netapa    SMALLINT PRIMARY KEY,
  km        SMALLINT NOT NULL,
  salida    VARCHAR(35) NOT NULL,
  llegada   VARCHAR(35) NOT NULL,
  dorsal    SMALLINT NOT NULL, ⟦e3⟧
  FOREIGN KEY (dorsal) REFERENCES ciclista(dorsal)
);

CREATE TABLE puerto (
  nompuerto VARCHAR(35) PRIMARY KEY,
  altura    SMALLINT NOT NULL,
  categoria CHAR(1) NOT NULL,
  pendiente DECIMAL(5,2),
  netapa    SMALLINT NOT NULL, ⟦e4⟧
  dorsal    SMALLINT,
  FOREIGN KEY (dorsal) REFERENCES ciclista(dorsal) ⟦e4~⟧
); ⟦e4~⟧

CREATE TABLE maillot (
  codigo    CHAR(3) PRIMARY KEY,
  tipo      VARCHAR(30) NOT NULL,
  color     VARCHAR(20) NOT NULL,
  premio    INT NOT NULL
);

CREATE TABLE llevar (
  dorsal    SMALLINT NOT NULL,
  netapa    SMALLINT NOT NULL,
  codigo    CHAR(3) NOT NULL,
  PRIMARY KEY (dorsal, netapa, codigo), ⟦e5⟧
  FOREIGN KEY (dorsal) REFERENCES ciclista(dorsal),
  FOREIGN KEY (netapa) REFERENCES etapa(netapa),
  FOREIGN KEY (codigo) REFERENCES maillot(codigo)
);`,
 errors:{
  e1:{why:[['opcional','puede no','null','nulo','obligatori','no consta']], model:'R1: el director "puede no constar" → debe <b>admitir NULL</b>. El NOT NULL sobra.'},
  e2:{why:[['tipo','int','varchar','coincid','distinto','mismo']], model:'<b>Tipos incompatibles</b>: <code>nomeq</code> es INT y apunta a <code>equipo.nomeq</code>, que es VARCHAR(25). La FK y la columna referenciada deben tener el mismo tipo: <code>nomeq VARCHAR(25) NOT NULL</code>.'},
  e3:{why:[['null','nulo','opcional','obligatori','puede no','ganador','como mucho']], model:'R3: una etapa puede <b>no tener ganador</b> todavía (mínimo 0) → la FK <code>dorsal</code> debe <b>admitir NULL</b>. Con NOT NULL no se puede dar de alta una etapa que aún no se ha corrido.'},
  e4:{why:[['foreign','fk','c.aj','clave ajena','referenc','falta']], model:'<b>Falta la FK</b> <code>FOREIGN KEY (netapa) REFERENCES etapa(netapa)</code>. Sin ella se pueden meter puertos en etapas que no existen.'},
  e5:{why:[['dorsal','sobra','netapa, codigo','netapa y codigo','etapa y maillot','mismo maillot','dos ciclistas','un unico ciclista']], model:'R6: en cada etapa cada maillot lo lleva <b>un único ciclista</b> → la CP es <code>(netapa, codigo)</code>. Con <code>dorsal</code> dentro de la CP se aceptarían dos ciclistas con el mismo maillot en la misma etapa. El dorsal es FK VNN, pero no forma parte de la CP.'}
 }},

{id:'hospital', name:'Hospital', from:'Boletín 1 E/R, ejercicio 2',
 rules:[
  'R1. Los <b>pacientes</b> se identifican por su NSS. Se guarda nombre completo (obligatorio), fecha de nacimiento, teléfono, email y grupo sanguíneo.',
  'R2. Los <b>doctores</b> tienen número de colegiado (identificador), nombre completo y especialidad (obligatorios) y teléfono.',
  'R3. Las <b>salas</b> se identifican por su número. Se guarda planta, capacidad y tipo ("consulta", "quirófano" o "urgencias").',
  'R4. De cada <b>consulta</b> se guarda fecha y hora (obligatoria), diagnóstico y tratamiento. Cada consulta la atiende <b>UN</b> doctor, en <b>UNA</b> sala, para <b>UN</b> paciente: solo tiene sentido con los tres.',
  'R5. Un paciente puede tener muchas consultas o <b>ninguna aún</b>. Un doctor atiende muchas consultas y <b>todos los doctores</b> están dando consultas. Una sala se usa en muchas consultas.'],
 rels:[
  {a:'Paciente', verb:'tiene', b:'Consulta', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'Cada consulta es de UN paciente → (1,1) junto a Paciente. Un paciente puede no tener consultas aún → (0,N) junto a Consulta.'},
  {a:'Doctor', verb:'atiende', b:'Consulta', na:['1','1'], nb:['1','N'], tipo:'1:N', why:'Cada consulta la atiende UN doctor → (1,1) junto a Doctor. "Todos los doctores están dando consultas" → al menos 1 → (1,N) junto a Consulta.'},
  {a:'Sala', verb:'acoge', b:'Consulta', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'Cada consulta es en UNA sala → (1,1) junto a Sala. El enunciado no obliga a que todas las salas se usen → (0,N).'}],
 tables:[
  {name:'PACIENTE', cols:[['nss','P'],['nombre','V'],['fecha_nac',''],['telefono',''],['email',''],['grupo_sang','']]},
  {name:'DOCTOR', cols:[['num_colegiado','P'],['nombre','V'],['especialidad','V'],['telefono','']], note:'ASERCIÓN: DOCTOR[num_colegiado] ⊆ CONSULTA[num_colegiado] ("todos los doctores están dando consultas").'},
  {name:'SALA', cols:[['num_sala','P'],['planta',''],['capacidad',''],['tipo','']]},
  {name:'CONSULTA', cols:[['id','P'],['fecha_hora','V'],['diagnostico',''],['tratamiento',''],['nss','V','PACIENTE'],['num_colegiado','V','DOCTOR'],['num_sala','V','SALA']], note:'Las tres FKs son VNN: "solo tiene sentido con los tres".'}],
 ddl:`CREATE TABLE paciente (
  nss          CHAR(12) PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  fecha_nac    DATE,
  telefono     VARCHAR(15),
  email        VARCHAR(120),
  grupo_sang   VARCHAR(3)
);

CREATE TABLE doctor (
  num_colegiado INT NOT NULL, ⟦e1⟧
  nombre        VARCHAR(100) NOT NULL,
  especialidad  VARCHAR(60) NOT NULL,
  telefono      VARCHAR(15)
); ⟦e1~⟧

CREATE TABLE sala (
  num_sala   INT PRIMARY KEY,
  planta     INT NOT NULL,
  capacidad  INT NOT NULL,
  tipo       ENUM('consulta','quirofano','urgencias') NOT NULL
);

CREATE TABLE consulta (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  fecha_hora    DATETIME NOT NULL,
  diagnostico   TEXT,
  tratamiento   TEXT,
  nss           CHAR(12) NOT NULL,
  num_colegiado INT, ⟦e2⟧
  num_sala      INT NOT NULL,
  PRIMARY KEY (id), ⟦e3⟧
  FOREIGN KEY (nss) REFERENCES paciente(nss),
  FOREIGN KEY (num_colegiado) REFERENCES doctor(num_colegiado),
  FOREIGN KEY (num_sala) REFERENCES paciente(nss) ⟦e4⟧
);`,
 errors:{
  e1:{why:[['primary','pk','clave primaria','cp','identifica']], model:'<b>DOCTOR no tiene clave primaria</b>: R2 dice que el número de colegiado lo identifica → <code>PRIMARY KEY (num_colegiado)</code>. Sin ella, además, la FK de CONSULTA hacia <code>doctor(num_colegiado)</code> no puede crearse (la columna referenciada debe ser PK o UNIQUE).'},
  e2:{why:[['not null','vnn','nulo','null','obligatori','un doctor']], model:'R4: cada consulta la atiende <b>UN</b> doctor y "solo tiene sentido con los tres" → <code>num_colegiado</code> debe ser <b>NOT NULL</b>.'},
  e3:{why:[['dos','doble','repet','ya','otra vez','segunda','duplic','multiple']], model:'<b>PK declarada dos veces</b>: <code>id</code> ya lleva PRIMARY KEY en su línea. Una tabla solo puede tener una clave primaria; MySQL da "Multiple primary key defined".'},
  e4:{why:[['sala','tabla equivocada','otra tabla','paciente','tipo','no corresponde']], model:'La FK <code>num_sala</code> apunta a <b>la tabla equivocada</b> (<code>paciente(nss)</code>, que además es CHAR(12) frente a INT). Debe ser <code>REFERENCES sala(num_sala)</code>.'}
 }},

{id:'tienda', name:'Tienda online', from:'Boletín 1 E/R, ejercicio 1',
 rules:[
  'R1. De cada <b>cliente</b>: DNI (identificador), nombre, apellidos y email (obligatorios). El email <b>no puede repetirse</b>.',
  'R2. Un cliente puede tener <b>varias direcciones</b> de envío guardadas (calle, número, CP, ciudad) o ninguna. Cada dirección es de un único cliente.',
  'R3. De cada <b>producto</b>: código (identificador), nombre, descripción, precio unitario y stock.',
  'R4. De cada <b>pedido</b>: número (identificador), fecha, estado ("pendiente", "enviado", "entregado", "cancelado"), importe total y la dirección de envío. Cada pedido pertenece a <b>un único cliente</b> (obligatorio); un cliente puede tener varios pedidos o ninguno si acaba de registrarse.',
  'R5. Un pedido contiene <b>al menos un</b> producto. De cada producto del pedido se guarda la <b>cantidad</b> y el <b>precio unitario en el momento de la compra</b>. Un producto puede aparecer en muchos pedidos.'],
 rels:[
  {a:'Cliente', verb:'realiza', b:'Pedido', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R4: cada pedido es de un único cliente, obligatorio → (1,1) junto a Cliente. Un cliente recién registrado puede no tener pedidos → (0,N) junto a Pedido.'},
  {a:'Pedido', verb:'contiene', b:'Producto', na:['0','N'], nb:['1','N'], tipo:'N:M', attr:'cantidad, precio_ud', why:'R5: un pedido contiene al menos un producto → (1,N) junto a Producto. Un producto puede estar en muchos pedidos o en ninguno → (0,N) junto a Pedido. Atributos de la relación: cantidad y precio del momento.'},
  {a:'Cliente', verb:'guarda', b:'Dirección', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R2: cada dirección es de un único cliente → (1,1) junto a Cliente. Un cliente tiene 0 o varias → (0,N) junto a Dirección.'}],
 tables:[
  {name:'CLIENTE', cols:[['dni','P'],['nombre','V'],['apellidos','V'],['email','AV']], note:'El email "no puede repetirse" y es obligatorio → C.Alt(email) + VNN(email).'},
  {name:'DIRECCION', cols:[['id','P'],['calle',''],['numero',''],['cp',''],['ciudad',''],['dni','V','CLIENTE']]},
  {name:'PRODUCTO', cols:[['codigo','P'],['nombre',''],['descripcion',''],['precio',''],['stock','']]},
  {name:'PEDIDO', cols:[['numero','P'],['fecha',''],['estado',''],['importe_total',''],['dni','V','CLIENTE'],['direccion_id','','DIRECCION']]},
  {name:'LINEA', cols:[['numero_pedido','P','PEDIDO'],['codigo_producto','P','PRODUCTO'],['cantidad','V'],['precio_ud','V']], note:'ASERCIÓN: PEDIDO[numero] ⊆ LINEA[numero_pedido] (todo pedido tiene al menos una línea).'}],
 ddl:`CREATE TABLE cliente (
  dni        CHAR(9) PRIMARY KEY,
  nombre     VARCHAR(60) NOT NULL,
  apellidos  VARCHAR(100) NOT NULL,
  email      VARCHAR(120) NOT NULL ⟦e1⟧
);

CREATE TABLE direccion (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  calle      VARCHAR(100) NOT NULL,
  numero     VARCHAR(10),
  cp         CHAR(5) NOT NULL,
  ciudad     VARCHAR(60) NOT NULL,
  dni        CHAR(9) NOT NULL,
  FOREIGN KEY (dni) REFERENCES cliente(dni)
);

CREATE TABLE producto (
  codigo      VARCHAR(10) PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  descripcion TEXT,
  precio      FLOAT NOT NULL, ⟦e2⟧
  stock       INT NOT NULL
);

CREATE TABLE pedido (
  numero        INT PRIMARY KEY,
  fecha         DATE NOT NULL,
  estado        ENUM('pendiente','enviado','entregado','cancelado') NOT NULL,
  importe_total DECIMAL(10,2),
  dni           CHAR(9), ⟦e3⟧
  direccion_id  INT NOT NULL,
  FOREIGN KEY (dni) REFERENCES cliente(dni),
  FOREIGN KEY (direccion_id) REFERENCES direccion(id)
);

CREATE TABLE linea (
  numero_pedido   INT NOT NULL,
  codigo_producto VARCHAR(10) NOT NULL, ⟦e5~⟧
  cantidad        INT NOT NULL,
  precio_ud       DECIMAL(8,2) NOT NULL,
  PRIMARY KEY (numero_pedido), ⟦e4⟧
  FOREIGN KEY (numero_pedido) REFERENCES pedido(numero)
); ⟦e5⟧`,
 errors:{
  e1:{why:[['unique','c.alt','alternativa','repet','unic']], model:'R1: el email <b>no puede repetirse</b> → falta <code>UNIQUE</code> (C.Alt). Con solo NOT NULL dos clientes podrían tener el mismo email.'},
  e2:{why:[['decimal','float','dinero','precio','redonde','exact']], model:'Un precio es <b>dinero</b>: se guarda con <code>DECIMAL(10,2)</code>, no con FLOAT, que es aproximado y da errores de redondeo.'},
  e3:{why:[['not null','vnn','nulo','null','obligatori']], model:'R4: cada pedido pertenece a un único cliente y es <b>obligatorio</b> → <code>dni</code> debe ser <b>NOT NULL</b>. Así se admiten pedidos sin cliente.'},
  e4:{why:[['compuesta','codigo_producto','las dos','ambas','falta','solo un','un solo']], model:'La CP de la tabla intermedia N:M debe ser <b>compuesta</b>: <code>(numero_pedido, codigo_producto)</code>. Con solo <code>numero_pedido</code> cada pedido podría llevar <b>un único</b> producto.'},
  e5:{why:[['foreign','fk','c.aj','clave ajena','referenc','producto']], model:'<b>Falta la FK</b> <code>FOREIGN KEY (codigo_producto) REFERENCES producto(codigo)</code>: se podrían meter líneas de productos que no existen.'}
 }},

{id:'taller', name:'Taller "El Tornillo Feliz"', from:'preparacion-examen/02-examen-practica.md (script corregido a fondo)',
 rules:[
  'R1. De cada <b>cliente</b>: nombre, NIF (no puede repetirse), teléfono y fecha de alta. <b>Todo cliente tiene NIF</b>.',
  'R2. De cada <b>vehículo</b>: matrícula (no puede repetirse), marca, modelo y año. Un vehículo pertenece <b>siempre a un único</b> cliente; un cliente puede tener varios vehículos.',
  'R3. De cada <b>reparación</b>: número de orden interno, fecha de entrada y fecha de salida (puede no haber salido aún). Toda reparación es sobre <b>un único vehículo</b>; un vehículo puede tener muchas reparaciones.',
  'R4. De cada <b>pieza</b>: código (no se repite), descripción, precio unitario y stock.',
  'R5. Una reparación <b>utiliza</b> piezas y se guarda cuántas <b>unidades</b>. Una reparación puede no llevar ninguna pieza todavía y una pieza puede no haberse usado nunca; ambas pueden repetirse.',
  'R6. De cada <b>mecánico</b>: nombre, DNI (no se repite), especialidad y sueldo. Cada reparación la dirige <b>exactamente un</b> mecánico; un mecánico puede no dirigir ninguna.',
  'R7. Cada reparación tiene un número de orden (único) y también un identificador interno numérico.'],
 rels:[
  {a:'Cliente', verb:'posee', b:'Vehículo', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R2: un vehículo pertenece siempre a un único cliente → (1,1) junto a Cliente. Un cliente puede tener varios (o ninguno) → (0,N) junto a Vehículo.'},
  {a:'Vehículo', verb:'sobre', b:'Reparación', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R3: toda reparación es sobre un único vehículo → (1,1) junto a Vehículo. Un vehículo puede tener muchas reparaciones o ninguna → (0,N) junto a Reparación.'},
  {a:'Mecánico', verb:'dirige', b:'Reparación', na:['1','1'], nb:['0','N'], tipo:'1:N', why:'R6: exactamente un mecánico por reparación → (1,1) junto a Mecánico. Un mecánico puede no dirigir ninguna → (0,N) junto a Reparación.'},
  {a:'Reparación', verb:'utiliza', b:'Pieza', na:['0','N'], nb:['0','N'], tipo:'N:M', attr:'unidades', why:'R5: las dos pueden ser 0 y repetirse → (0,N) en ambos lados, N:M con el atributo unidades.'}],
 tables:[
  {name:'CLIENTE', cols:[['id','P'],['nif','AV'],['nombre',''],['telefono',''],['fecha_alta','']]},
  {name:'VEHICULO', cols:[['id','P'],['matricula','A'],['marca',''],['modelo',''],['anio',''],['cliente_id','V','CLIENTE']]},
  {name:'REPARACION', cols:[['id','P'],['numero_orden','A'],['fecha_entrada',''],['fecha_salida','o'],['vehiculo_id','V','VEHICULO'],['mecanico_id','V','MECANICO']]},
  {name:'MECANICO', cols:[['id','P'],['dni','A'],['nombre',''],['especialidad',''],['sueldo','']]},
  {name:'PIEZA', cols:[['codigo','P'],['descripcion',''],['precio_ud',''],['stock','']]},
  {name:'REPARACION_PIEZA', cols:[['reparacion_id','P','REPARACION'],['pieza_codigo','P','PIEZA'],['unidades','V']]}],
 ddl:`CREATE TABLE cliente (
  id            INT AUTO_INCREMENT,
  nombre        VARCHAR(80) NOT NULL,
  nif           CHAR(9), ⟦e1⟧
  telefono      VARCHAR(15),
  fecha_alta    DATE,
  PRIMARY KEY (id)
);

CREATE TABLE vehiculo (
  id           INT AUTO_INCREMENT PRIMARY KEY, ⟦e2~⟧
  matricula    CHAR(7), ⟦e3⟧
  marca        VARCHAR(40) NOT NULL,
  modelo       VARCHAR(40) NOT NULL,
  anio         INT,
  cliente_id   INT, ⟦e4⟧
  PRIMARY KEY (id) ⟦e2⟧
);

CREATE TABLE reparacion (
  id            INT AUTO_INCREMENT PRIMARY KEY, ⟦e5~⟧
  numero_orden  VARCHAR(10) NOT NULL, ⟦e6⟧
  fecha_entrada DATE,
  fecha_salida  DATE,
  vehiculo_id   INT NOT NULL,
  mecanico_id   INT, ⟦e7⟧
  PRIMARY KEY (id) ⟦e5⟧
);

CREATE TABLE mecanico (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  dni           CHAR(9) NOT NULL, ⟦e8⟧
  nombre        VARCHAR(80) NOT NULL,
  especialidad  VARCHAR(40),
  sueldo        DECIMAL(8,2)
);

CREATE TABLE pieza (
  codigo       VARCHAR(10), ⟦e9⟧
  descripcion  VARCHAR(100) NOT NULL,
  precio_ud    DECIMAL(8,2) NOT NULL,
  stock        INT NOT NULL
); ⟦e9~⟧

CREATE TABLE reparacion_pieza (
  reparacion_id INT NOT NULL,
  pieza_id      INT NOT NULL, ⟦e10⟧
  unidades      INT NOT NULL,
  PRIMARY KEY (reparacion_id) ⟦e11⟧
); ⟦e12⟧

ALTER TABLE reparacion
  ADD FOREIGN KEY (vehiculo_id) REFERENCES pieza(id); ⟦e13⟧`,
 errors:{
  e1:{why:[['unique','c.alt','repet'],['not null','vnn','obligatori','nulo','null','todo cliente']], model:'R1: el NIF no puede repetirse y todo cliente lo tiene → le faltan <b>UNIQUE</b> (C.Alt) y <b>NOT NULL</b> (VNN).'},
  e2:{why:[['dos','doble','repet','ya','segunda','duplic','multiple']], model:'<b>PRIMARY KEY dos veces</b>: <code>id</code> ya la lleva en su línea y se vuelve a declarar al final. Una tabla tiene una sola clave primaria (error "Multiple primary key defined").'},
  e3:{why:[['unique','c.alt','repet','alternativa']], model:'R2: la matrícula no puede repetirse → falta <b>UNIQUE</b> (C.Alt).'},
  e4:{why:[['foreign','fk','c.aj','referenc','clave ajena','not null','null','vnn','obligatori']], model:'<code>cliente_id</code> no tiene <b>FOREIGN KEY</b> hacia <code>cliente(id)</code> y debe ser <b>NOT NULL</b> (R2: "pertenece siempre a un único cliente").'},
  e5:{why:[['dos','doble','repet','ya','segunda','duplic','multiple']], model:'Igual que en vehículo: <b>PRIMARY KEY declarada dos veces</b> sobre <code>id</code>.'},
  e6:{why:[['unique','c.alt','repet','unico','alternativa']], model:'R7: el número de orden es <b>único</b> → falta <b>UNIQUE</b> (C.Alt). El NOT NULL solo no evita duplicados.'},
  e7:{why:[['not null','vnn','obligatori','null','nulo','foreign','fk','referenc']], model:'R6: exactamente un mecánico dirige cada reparación → <code>mecanico_id</code> debe ser <b>NOT NULL</b> y tener su <b>FOREIGN KEY</b> hacia <code>mecanico(id)</code>, que no aparece en el script.'},
  e8:{why:[['unique','c.alt','repet','alternativa']], model:'R6: el DNI del mecánico no se repite → falta <b>UNIQUE</b> (C.Alt).'},
  e9:{why:[['primary','pk','clave primaria','cp']], model:'<b>PIEZA no tiene clave primaria</b>: el código la identifica (R4) → <code>codigo VARCHAR(10) PRIMARY KEY</code>.'},
  e10:{why:[['codigo','tipo','varchar','no existe','id']], model:'La pieza se identifica por <code>codigo VARCHAR(10)</code>, no por un <code>id</code> INT (PIEZA no tiene id) → debe ser <code>pieza_codigo VARCHAR(10) NOT NULL</code>.'},
  e11:{why:[['compuesta','las dos','ambas','pieza','falta','solo un','un solo']], model:'CP de la N:M incompleta: debe ser <b>compuesta</b> <code>(reparacion_id, pieza_codigo)</code>. Así, cada reparación solo podría usar una pieza.'},
  e12:{why:[['foreign','fk','c.aj','referenc','clave ajena']], model:'La tabla intermedia <b>no tiene ninguna FK</b>: faltan <code>FOREIGN KEY (reparacion_id) REFERENCES reparacion(id)</code> y <code>FOREIGN KEY (pieza_codigo) REFERENCES pieza(codigo)</code>.'},
  e13:{why:[['vehiculo','tabla equivocada','otra tabla','pieza','no existe']], model:'La FK <code>vehiculo_id</code> apunta a <b>la tabla equivocada</b>: debe ser <code>REFERENCES vehiculo(id)</code>. Además <code>pieza</code> no tiene columna <code>id</code>.'}
 }}
];
