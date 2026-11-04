/** DFD lógicos y DER físico extraídos de las migraciones; diagramación local con Graphviz/WASM. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.join(root, 'docs/diagramas');
const work = path.join(root, 'artifacts/system-map/data-models');
const require = createRequire(import.meta.url);
const { instance } = require(path.join(root, 'artifacts/system-map/model-tools/node_modules/@viz-js/viz'));
const viz = await instance();
const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const q = s => JSON.stringify(String(s));
const check = (condition, message) => { if (!condition) throw new Error(message); };
const wrap = (text, width = 32) => {
  const lines = [''];
  for (const word of text.split(/\s+/)) {
    if (lines.at(-1) && lines.at(-1).length + word.length + 1 > width) lines.push(word);
    else lines[lines.length - 1] += `${lines.at(-1) ? ' ' : ''}${word}`;
  }
  return lines.join('\n');
};
function splitTop(text, delimiter = ',') {
  const parts = []; let start = 0, depth = 0, quote = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== '\\') quote = ''; }
    else if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === delimiter && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(text.slice(start).trim()); return parts.filter(Boolean);
}
const columnsOf = text => text.split(',').map(c => c.trim().replace(/`/g, ''));
function column(text) {
  const match = text.match(/^(\w+)\s+([A-Z]+(?:\([^)]*\))?(?:\s+UNSIGNED)?)\s*(.*)$/i);
  check(match, `Columna SQL no reconocida: ${text}`);
  return { name: match[1], type: match[2].toUpperCase(), nullable: !/\bNOT NULL\b|\bPRIMARY KEY\b/i.test(match[3]), declaration: text };
}

const tables = new Map(); const migrationSources = [];
function parseCreates(text, source) {
  const pattern = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(/gi;
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[0].length; let depth = 1, end = start;
    while (end < text.length && depth) { if (text[end] === '(') depth++; else if (text[end] === ')') depth--; end++; }
    const table = { name: match[1], source, line: text.slice(0, match.index).split('\n').length, columns: [], pk: [], unique: [], foreignKeys: [] };
    for (const item of splitTop(text.slice(start, end - 1))) {
      const fk = item.match(/^FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
      const pk = item.match(/^PRIMARY KEY\s*\(([^)]+)\)/i);
      const uk = item.match(/^UNIQUE(?:\s+KEY(?:\s+\w+)?)?\s*\(([^)]+)\)/i);
      if (fk) table.foreignKeys.push({ columns: columnsOf(fk[1]), parent: fk[2], parentColumns: columnsOf(fk[3]) });
      else if (pk) table.pk = columnsOf(pk[1]);
      else if (uk) table.unique.push(columnsOf(uk[1]));
      else if (/^(?:INDEX|KEY|CHECK|CONSTRAINT)\b/i.test(item)) continue;
      else {
        const col = column(item); table.columns.push(col);
        if (/\bPRIMARY KEY\b/i.test(item)) table.pk.push(col.name);
        if (/\bUNIQUE\b/i.test(item)) table.unique.push([col.name]);
      }
    }
    for (const col of table.columns) if (table.pk.includes(col.name)) col.nullable = false;
    check(!tables.has(table.name), `Tabla duplicada: ${table.name}`); tables.set(table.name, table);
  }
}
let declaredFK = 0, alters = 0;
for (const file of (await fs.readdir(path.join(root, 'backend/sql'))).filter(f => /^\d+.*\.sql$/.test(f)).sort()) {
  const source = `backend/sql/${file}`;
  const sql = (await fs.readFile(path.join(root, source), 'utf8')).replace(/--[^\n]*/g, '');
  migrationSources.push(source); declaredFK += [...sql.matchAll(/FOREIGN KEY\s*\(/gi)].length;
  parseCreates(sql, source);
  for (const statement of splitTop(sql, ';').filter(s => /^ALTER TABLE/i.test(s))) {
    const match = statement.match(/^ALTER TABLE (\w+) ADD COLUMN (.+) AFTER (\w+)$/i);
    check(match, `ALTER no contemplado: ${statement}`);
    const table = tables.get(match[1]); check(table, `ALTER sobre tabla inexistente: ${match[1]}`);
    const col = column(match[2]); const after = table.columns.findIndex(c => c.name === match[3]);
    check(after >= 0 && !table.columns.some(c => c.name === col.name), `ALTER inválido: ${statement}`);
    table.columns.splice(after + 1, 0, col); col.source = source; alters++;
  }
}
const migrationEngine = await fs.readFile(path.join(root, 'backend/scripts/migrations.mjs'), 'utf8');
parseCreates(migrationEngine, 'backend/scripts/migrations.mjs');
const relations = [];
for (const table of tables.values()) {
  const known = new Set(table.columns.map(c => c.name));
  check(table.pk.length && [...table.pk, ...table.unique.flat()].every(c => known.has(c)), `Claves inválidas: ${table.name}`);
  for (const [i, fk] of table.foreignKeys.entries()) {
    const parent = tables.get(fk.parent);
    check(parent && fk.columns.length === fk.parentColumns.length, `FK inválida en ${table.name}`);
    check(fk.columns.every(c => known.has(c)) && fk.parentColumns.every(c => parent.columns.some(pc => pc.name === c)), `Columnas FK inválidas: ${table.name}`);
    const parentKey = [parent.pk, ...parent.unique].some(k => k.length === fk.parentColumns.length && k.every(c => fk.parentColumns.includes(c)));
    check(parentKey, `La FK no apunta a una clave candidata: ${table.name}`);
    const optional = fk.columns.some(c => table.columns.find(col => col.name === c).nullable);
    const unique = [table.pk, ...table.unique].some(k => k.every(c => fk.columns.includes(c)));
    relations.push({ id: `${table.name}-fk-${i + 1}`, child: table.name, ...fk, parentCard: optional ? '0..1' : '1', childCard: unique ? '0..1' : '0..N', identifying: fk.columns.every(c => table.pk.includes(c)) });
  }
}
check(relations.length === declaredFK, 'No se preservaron todas las restricciones FOREIGN KEY.');
check(tables.get('social_flows').columns.some(c => c.name === 'binding_hash'), 'Falta la migración 008.');
check(relations.filter(r => r.columns.length > 1).length === 2, 'Revisar las dos FK compuestas.');

const stores = {
  D1: ['Cuentas, permisos y sesiones', ['users','roles','user_roles','sessions','refresh_tokens','auth_rate_limits','social_providers','social_identities','social_flows','password_resets']],
  D2: ['Espacios y puestos', ['spaces','furniture','booths']],
  D3: ['Proyectos y asignación de puestos', ['projects','project_members','project_teachers','subjects','project_subjects','project_reviews','booth_allocations']],
  D4: ['Inventario, pedidos y reservas', ['resources','project_resource_requests','resource_allocations','resource_conditions','inventory_events','inventory_condition_events']],
  D5: ['Préstamos y devoluciones', ['loans','loan_returns']],
  D6: ['Galería y metadatos de cargas', ['gallery_photos','gallery_reviews','image_uploads']],
  D7: ['Archivos de imágenes', ['Vercel Blob privado']],
};
const actorDefs = [
  ['E1','Visitante','Consulta pública desde web o APK'],
  ['E2','Persona registrada','Alumno, invitado u operador que inicia sesión'],
  ['E3','Profesor asignado','Revisión de propuestas'],
  ['E4','Encargado de préstamos','Entregas y devoluciones'],
  ['E5','Administración','Gestión, permisos y moderación'],
  ['E6','Proveedor de identidad','Google, Discord o GitHub'],
  ['E7','Servicio de correo','SMTP de recuperación y avisos'],
];
const processDefs = [
  ['P1','1.0','Gestionar identidad y acceso','backend/src/routes/auth.mjs'],
  ['P2','2.0','Administrar espacios y puestos','backend/src/routes/spaces.mjs'],
  ['P3','3.0','Gestionar propuestas y revisiones','backend/src/routes/projects.mjs'],
  ['P4','4.0','Mantener catálogo y existencias','backend/src/routes/inventory.mjs'],
  ['P5','5.0','Registrar préstamos y devoluciones','backend/src/routes/loans.mjs'],
  ['P6','6.0','Gestionar imágenes y galería','backend/src/routes/gallery.mjs'],
  ['P7','7.0','Producir consultas públicas y TV','backend/src/repositories/projects.mjs'],
];
const actors = actorDefs.map(([id,name,detail]) => ({id,kind:'external',name,detail}));
const processes = processDefs.map(([id,number,name,source]) => ({id,kind:'process',number,name,source}));
const dataStores = Object.entries(stores).map(([id,[name,tables]]) => ({id,kind:'store',name,tables}));
const boundaryRows = [
  ['B01','E1','P7','Solicitudes de espacios, proyectos, galería o TV'],
  ['B02','P7','E1','Planos y contenido publicado'],
  ['B03','E2','P1','Datos de registro, credenciales, renovación o recuperación'],
  ['B04','P1','E2','Sesión, perfil y resultado de acceso o recuperación'],
  ['B05','E2','P3','Consulta, propuesta, corrección o cancelación propia'],
  ['B06','P3','E2','Expediente, estado y observaciones de su proyecto'],
  ['B07','E3','P3','Consulta o dictamen de revisión, motivo y versión'],
  ['B08','P3','E3','Expedientes asignados y resultados de revisión'],
  ['B09','E4','P5','Datos de entrega, devolución o novedad'],
  ['B10','P5','E4','Préstamos, saldos e historial de movimientos'],
  ['B11','E5','P1','Consulta de usuarios y cambios de roles o estado'],
  ['B12','P1','E5','Cuentas y resultado de gestión de permisos'],
  ['B13','E5','P2','Datos del plano, puestos y baja de espacio'],
  ['B14','P2','E5','Plano, versión y resultado de gestión'],
  ['B15','E5','P4','Cambios de existencias y condición'],
  ['B16','P4','E5','Inventario, disponibilidad e historial'],
  ['B17','E5','P6','Dictamen de moderación o eliminación'],
  ['B18','P6','E5','Fotos por estado y resultado de moderación'],
  ['B19','E5','P3','Consulta, reapertura o cancelación administrativa'],
  ['B20','P3','E5','Expediente y resultado administrativo'],
  ['B21','E2','P6','Imagen, metadatos y aporte de galería'],
  ['B22','P6','E2','Permiso de carga, URL y estado de aportes'],
  ['B23','P1','E6','Solicitud de autenticación e intercambio OAuth'],
  ['B24','E6','P1','Prueba de identidad y perfil del proveedor'],
  ['B25','P1','E7','Mensajes de recuperación o cambio de contraseña'],
  ['B26','E7','P1','Resultado del envío SMTP'],
  ['B27','E2','P4','Consulta de catálogo o inventario según permiso'],
  ['B28','P4','E2','Catálogo o detalle de inventario permitido'],
];
const storeRows = [
  ['S01','D1','P1','Cuentas, permisos, sesiones y flujos de acceso'],['S02','P1','D1','Altas, sesiones, permisos y tokens invalidados'],
  ['S03','D1','P2','Identidad y permiso de administración'],['S04','D2','P2','Planos, puestos y versiones actuales'],['S05','P2','D2','Espacios, mobiliario y puestos actualizados'],['S06','D3','P2','Referencias de propuestas y ocupación de puestos'],
  ['S07','D1','P3','Cuentas activas y roles de participantes'],['S08','D2','P3','Puestos habilitados y espacios activos'],['S09','D3','P3','Expedientes, versiones y asignaciones vigentes'],['S10','P3','D3','Propuestas, relaciones, dictámenes y asignaciones'],['S11','D4','P3','Catálogo, pedidos, stock y reservas'],['S12','P3','D4','Pedidos y reservas actualizados'],['S13','D5','P3','Saldos de unidades sin devolver'],
  ['S14','D1','P4','Identidad y permisos de inventario'],['S15','D4','P4','Catálogo, existencias, condición e historial'],['S16','P4','D4','Existencias, condición y eventos de inventario'],
  ['S17','D1','P5','Operador y alumno destinatario activos'],['S18','D3','P5','Proyectos confirmados y sus integrantes'],['S19','D4','P5','Reservas, existencias y unidades no utilizables'],['S20','P5','D4','Condiciones y eventos por daño'],['S21','D5','P5','Entregas previas, saldos y versiones'],['S22','P5','D5','Entregas, devoluciones y novedades'],
  ['S23','D1','P6','Autor activo y permisos de moderación'],['S24','D6','P6','Cargas, aportes y revisiones actuales'],['S25','P6','D6','Metadatos de cargas, aportes y moderaciones'],['S26','D7','P6','Bytes de imágenes cargadas'],['S27','P6','D7','Archivo original temporal y JPEG optimizado'],
  ['S28','D2','P7','Planos y puestos consultables'],['S29','D3','P7','Proyectos confirmados y datos públicos'],['S30','D6','P7','Fotos aprobadas y referencias de imagen'],['S31','D7','P7','Bytes JPEG con publicación permitida'],
];
const edgeRows = rows => rows.map(([id,source,target,label]) => ({id,source,target,label,refs:[id]}));
const level1 = {id:'dfd-nivel-1',family:'dfd',title:'DFD · Nivel 1: procesos y almacenes',note:'Frontera del sistema: frontend web/APK y API. D1–D6 son almacenes lógicos en TiDB; D7 contiene archivos en Blob.',nodes:[...actors,...processes,...dataStores],edges:edgeRows([...boundaryRows,...storeRows])};
const contextEdges = new Map();
for (const edge of edgeRows(boundaryRows)) {
  const source = edge.source.startsWith('P') ? 'P0' : edge.source;
  const target = edge.target.startsWith('P') ? 'P0' : edge.target;
  const key = `${source}-${target}`;
  if (!contextEdges.has(key)) contextEdges.set(key,{id:`C-${key}`,source,target,label:'',refs:[]});
  const current = contextEdges.get(key); current.refs.push(edge.id); current.label += `${current.label ? '\n' : ''}${edge.id}: ${edge.label}`;
}
const contextLabels={
  'E1-P0':'Consultas públicas de planos, proyectos, fotos y TV','P0-E1':'Planos y contenido publicado',
  'E2-P0':'Identidad, propuestas, imágenes y consultas de catálogo','P0-E2':'Acceso, expediente, estado de aportes y catálogo',
  'E3-P0':'Consultas y dictámenes de revisión','P0-E3':'Expedientes asignados y resultados',
  'E4-P0':'Datos de entrega, devolución o novedad','P0-E4':'Préstamos, saldos e historial',
  'E5-P0':'Cuentas, planos, existencias, moderación y proyectos','P0-E5':'Cuentas, planos, inventario, fotos y expedientes',
  'P0-E6':'Autenticación e intercambio OAuth','E6-P0':'Identidad y perfil del proveedor',
  'P0-E7':'Mensajes de recuperación o cambio de contraseña','E7-P0':'Resultado del envío SMTP',
};
for(const [key,edge] of contextEdges)edge.label=`${contextLabels[key]}\n${edge.refs.join(', ')}`;
const context = {id:'dfd-contexto',family:'dfd',title:'DFD · Contexto (nivel 0)',note:'Un proceso representa ExpoTec completo. Las entidades externas intercambian datos con él; no se representan decisiones ni despliegues.',nodes:[...actors,{id:'P0',kind:'process',number:'0',name:'Gestionar ExpoTec',source:'backend/src/create-app.mjs'}],edges:[...contextEdges.values()]};
const detailNodes = [
  ['P31','3.1','Validar solicitud y participantes'],['P32','3.2','Registrar propuesta o corrección'],['P33','3.3','Componer expediente y resultado'],['P34','3.4','Registrar dictamen y confirmación'],['P35','3.5','Reabrir o cancelar proyecto'],
].map(([id,number,name])=>({id,kind:'process',number,name,source:'backend/src/repositories/projects.mjs'}));
const detailEdges = [];
function detailed(ref, source, target, label) {
  const original = level1.edges.find(e=>e.id===ref);
  detailEdges.push({id:`L2-${ref}-${detailEdges.length}`,source,target,label:label??original.label,refs:[ref]});
}
detailed('B05','E2','P31'); detailed('B06','P33','E2'); detailed('B07','E3','P34'); detailed('B08','P33','E3'); detailed('B19','E5','P35'); detailed('B20','P33','E5');
for (const target of ['P31','P34','P35']) detailed('S07','D1',target);
for (const target of ['P31','P34']) detailed('S08','D2',target);
for (const target of ['P32','P33','P34','P35']) detailed('S09','D3',target);
for (const source of ['P32','P34','P35']) detailed('S10',source,'D3');
for (const target of ['P32','P34','P35']) detailed('S11','D4',target);
for (const source of ['P32','P34','P35']) detailed('S12',source,'D4');
detailed('S13','D5','P35');
detailEdges.push(...edgeRows([
  ['I31','P31','P32','Propuesta y participantes validados'],['I32','P31','P35','Cancelación propia y actor validados'],
  ['I33','P32','P33','Identificador y versión de propuesta'],['I34','P34','P33','Proyecto, dictamen y versión resultantes'],['I35','P35','P33','Estado final y referencias liberadas'],
]));
const detail = {id:'dfd-proyectos',family:'dfd',title:'DFD · Nivel 2: propuestas y revisiones (3.0)',note:'Descomposición de 3.0. Conserva B05–B08, B19–B20 y S07–S13 del nivel 1. El saldo de préstamos condiciona la liberación de asignaciones dentro de 3.5.',nodes:[...actors.filter(n=>['E2','E3','E5'].includes(n.id)),...detailNodes,...dataStores.filter(n=>['D1','D2','D3','D4','D5'].includes(n.id))],edges:detailEdges};
const dfdViews = [context,level1,detail];
for (const view of dfdViews) {
  const nodes = new Map(view.nodes.map(n=>[n.id,n]));
  for (const edge of view.edges) {
    check(nodes.has(edge.source)&&nodes.has(edge.target),`Extremo inválido: ${edge.id}`);
    check(nodes.get(edge.source).kind==='process'||nodes.get(edge.target).kind==='process',`Flujo sin proceso: ${edge.id}`);
    check(edge.label.trim(),`Flujo sin nombre: ${edge.id}`);
  }
  for (const node of view.nodes.filter(n=>n.kind==='process')) check(view.edges.some(e=>e.source===node.id)&&view.edges.some(e=>e.target===node.id),`Proceso sin entrada/salida: ${node.id}`);
}
function sameRefs(a,b,message) {check([...a].sort().join('|')===[...b].sort().join('|'),message);}
sameRefs(new Set(context.edges.flatMap(e=>e.refs)),new Set(boundaryRows.map(r=>r[0])),'Desbalance contexto/nivel 1');
sameRefs(new Set(detail.edges.filter(e=>!e.id.startsWith('I')).flatMap(e=>e.refs)),new Set(level1.edges.filter(e=>e.source==='P3'||e.target==='P3').map(e=>e.id)),'Desbalance nivel 1/nivel 2');

const palette = {identity:'#eaf0fb',spaces:'#e7f2ed',projects:'#dfeff5',inventory:'#fff1db',loans:'#f1e9f7',gallery:'#f6e8ec',technical:'#eef0f2'};
const groups = {
  identity:['users','roles','user_roles','sessions','refresh_tokens','social_providers','social_identities','social_flows','password_resets'],
  spaces:['spaces','furniture','booths'],projects:['projects','project_members','project_teachers','subjects','project_subjects','booth_allocations','project_reviews'],
  inventory:['resources','project_resource_requests','resource_allocations','resource_conditions','inventory_events','inventory_condition_events'],
  loans:['loans','loan_returns'],gallery:['gallery_photos','gallery_reviews','image_uploads'],technical:['auth_rate_limits','schema_migrations'],
};
const tableGroup = name => Object.keys(groups).find(k=>groups[k].includes(name));
const erViews = [
  {id:'der-general',title:'DER · General: claves y cardinalidades',names:[...tables.keys()],keysOnly:true},
  {id:'der-completo',title:'DER · Físico completo: todos los atributos',names:[...tables.keys()]},
  {id:'der-identidad',title:'DER · Identidad, sesiones y acceso',names:[...groups.identity,...groups.technical]},
  {id:'der-proyectos',title:'DER · Espacios, proyectos y equipos',names:['users',...groups.spaces,...groups.projects]},
  {id:'der-prestamos',title:'DER · Inventario, reservas y préstamos',names:['users','projects',...groups.inventory,...groups.loans]},
  {id:'der-galeria',title:'DER · Galería y cargas de imágenes',names:['users',...groups.gallery]},
].map(v=>({...v,family:'der',note:v.keysOnly?'Vista general con PK, FK y grupos UNIQUE. Las vistas físicas incluyen todos los atributos.':v.names.length===tables.size?'Esquema físico derivado de las migraciones 001–010 y schema_migrations. Las líneas representan exclusivamente restricciones FK declaradas.':'Vista parcial del esquema: relaciones hacia tablas fuera de esta vista se consultan en el DER completo.',nodes:v.names.map(name=>tables.get(name)),edges:relations.filter(r=>v.names.includes(r.parent)&&v.names.includes(r.child))}));

function baseDOT(title,rankdir='LR') {
  return `digraph G { graph [rankdir=${rankdir}, bgcolor="white", pad="0.45", nodesep="0.70", ranksep="1.8", splines=polyline, outputorder=edgesfirst, fontname="Arial", fontsize=22, labelloc=t, label=${q(title)}]; node [fontname="Arial",fontsize=15, color="#465360",penwidth=1.25]; edge [fontname="Arial",fontsize=12,color="#576474",fontcolor="#263341",penwidth=1.1,arrowsize=0.85];`;
}
function dfdDOT(view) {
  const lines=[baseDOT(view.title)];
  for (const node of view.nodes) {
    if(node.kind==='process') lines.push(`${q(node.id)} [shape=plain,label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="12" BGCOLOR="#e8f0fb" STYLE="ROUNDED"><TR><TD BORDER="1" SIDES="B"><B>${node.number}</B></TD></TR><TR><TD WIDTH="230">${xml(wrap(node.name,28)).replace(/\n/g,'<BR/>')}</TD></TR></TABLE>>];`);
    else if(node.kind==='store') lines.push(`${q(node.id)} [shape=plain,label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="11"><TR><TD SIDES="LTB" BGCOLOR="#ecf5ee"><B>${node.id}</B></TD><TD SIDES="TB" BGCOLOR="#ecf5ee" WIDTH="240">${xml(wrap(node.name,27)).replace(/\n/g,'<BR/>')}</TD></TR></TABLE>>];`);
    else lines.push(`${q(node.id)} [shape=box,style=filled,fillcolor="#f1f2f4",margin="0.22,0.16",label=${q(`${node.id}\n${wrap(node.name,24)}`)}];`);
  }
  const externalLeft=view.nodes.filter(n=>n.kind==='external'&&!['E6','E7'].includes(n.id)).map(n=>q(n.id));
  const proc=view.nodes.filter(n=>n.kind==='process').map(n=>q(n.id));
  const right=view.nodes.filter(n=>n.kind==='store'||['E6','E7'].includes(n.id)).map(n=>q(n.id));
  for(const row of [externalLeft,proc,right]) if(row.length)lines.push(`{rank=same;${row.join(';')};}`);
  for(const edge of view.edges){
    const source=view.nodes.find(n=>n.id===edge.source),target=view.nodes.find(n=>n.id===edge.target);
    const rank=n=>n.kind==='external'&&!['E6','E7'].includes(n.id)?0:n.kind==='process'?1:2;
    const reverse=rank(source)>rank(target);
    const from=reverse?edge.target:edge.source,to=reverse?edge.source:edge.target;
    const label=view.id==='dfd-contexto'?edge.label.split('\n').map(s=>wrap(s,34)).join('\n'): `${edge.refs.join(',')}\n${wrap(edge.label,29)}`;
    lines.push(`${q(from)} -> ${q(to)} [id=${q(edge.id)},label=${q(label)},dir=${reverse?'back':'forward'},tailport=e,headport=w,constraint=${rank(source)!==rank(target)?'true':'false'},minlen=1];`);
  }
  return lines.join('\n')+'\n}';
}
function selectedColumns(table,keysOnly){
  const keys=new Set([...table.pk,...table.unique.flat(),...table.foreignKeys.flatMap(f=>f.columns)]);
  return table.columns.filter(c=>!keysOnly||keys.has(c.name));
}
function erDOT(view){
  const lines=[baseDOT(view.title)];
  for(const table of view.nodes){
    const fk=new Set(table.foreignKeys.flatMap(f=>f.columns)), cols=selectedColumns(table,view.keysOnly);
    const rows=cols.map(c=>{
      const marks=[table.pk.includes(c.name)?'PK':'',fk.has(c.name)?'FK':'',...table.unique.flatMap((k,i)=>k.includes(c.name)?[`U${i+1}`]:[])].filter(Boolean).join(' ');
      return `<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11">${marks||'&#160;'}</FONT></TD><TD PORT="${c.name}" ALIGN="LEFT">${table.pk.includes(c.name)?'<B>':''}${c.name}${table.pk.includes(c.name)?'</B>':''}</TD><TD ALIGN="LEFT"><FONT POINT-SIZE="11">${xml(c.type)}${c.nullable?' NULL':''}</FONT></TD></TR>`;
    });
    const uniques=table.unique.map((u,i)=>`U${i+1} (${u.join(', ')})`).join('\n');
    if(uniques) rows.push(`<TR><TD COLSPAN="3" ALIGN="LEFT"><FONT POINT-SIZE="10">${xml(uniques).replace(/\n/g,'<BR ALIGN="LEFT"/>')}</FONT></TD></TR>`);
    lines.push(`${q(table.name)} [shape=plain,group=${q(tableGroup(table.name))},label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="6"><TR><TD COLSPAN="3" PORT="header" BGCOLOR="${palette[tableGroup(table.name)]}"><B>${table.name}</B></TD></TR>${rows.join('')}</TABLE>>];`);
  }
  for(const rel of view.edges){
    const parent=rel.parentCard==='1'?'teetee':'odottee';const child=rel.childCard==='0..1'?'odottee':'odotcrow';
    const label=rel.columns.length>1?`(${rel.columns.join(', ')})`:rel.columns[0];
    lines.push(`${q(rel.parent)}:e -> ${q(rel.child)}:w [id=${q(rel.id)},dir=both,arrowtail=${parent},arrowhead=${child},style=${rel.identifying?'solid':'dashed'},label=${q(wrap(label,26))},taillabel=${q(rel.parentCard)},headlabel=${q(rel.childCard)},labelfontsize=11,labeldistance=2.2];`);
  }
  return lines.join('\n')+'\n}';
}

function drawioDocument(views){
  const pages=[];
  for(const view of views){
    const graph=view.layout, bounds=graph.bb.split(',').map(Number), H=bounds[3], scale=1.35, pad=70;
    const cells=['<mxCell id="0"/>','<mxCell id="1" parent="0"/>'];
const modelNodes=new Map(view.nodes.map(n=>[n.id??n.name,n]));
    function cell(id,label,style,x,y,w,h,parent='1',extra=''){
      cells.push(`<mxCell id="${xml(id)}" value="${xml(label)}" style="${xml(style)}" vertex="1" parent="${xml(parent)}" ${extra}><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
    }
    cell(`${view.id}-title`,view.title,'text;html=1;align=left;fontSize=24;fontStyle=1;',pad,12,1600,48);
    cell(`${view.id}-note`,view.note,'text;html=1;align=left;whiteSpace=wrap;fontSize=13;',pad,H*scale+pad+24,1800,60);
    const objects=graph.objects.filter(n=>n.pos&&modelNodes.has(n.name));
    for(const item of objects){
      const model=modelNodes.get(item.name), [cx,cy]=item.pos.split(',').map(Number),w=Number(item.width)*72*scale,h=Number(item.height)*72*scale;
      const x=(cx-Number(item.width)*36)*scale+pad,y=(H-cy-Number(item.height)*36)*scale+pad;
      const id=`${view.id}-${item.name}`;
      if(view.family==='der'){
        const cols=selectedColumns(model,view.keysOnly),extra=model.unique.length?34:0,rowH=(h-36-extra)/cols.length;
        cell(id,model.name,`shape=table;startSize=36;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;fontSize=18;fillColor=${palette[tableGroup(model.name)]};strokeColor=#465360;`,x,y,w,h,'1',`data-source="${xml(model.source)}:${model.line}"`);
        cols.forEach((col,i)=>{
          const fk=model.foreignKeys.some(f=>f.columns.includes(col.name));
          const flags=[model.pk.includes(col.name)?'PK':'',fk?'FK':'',...model.unique.flatMap((u,j)=>u.includes(col.name)?[`U${j+1}`]:[])].filter(Boolean).join(' ');
          const row=`${id}-col-${col.name}`;
          cell(row,`${flags}  ${col.name} : ${col.type}${col.nullable?' NULL':''}`,'shape=tableRow;horizontal=0;startSize=0;fillColor=none;strokeColor=none;align=left;spacingLeft=8;fontFamily=Courier New;fontSize=12;',0,36+i*rowH,w,rowH-1,id);
        });
        if(extra)cell(`${id}-unique`,model.unique.map((u,i)=>`U${i+1}(${u.join(', ')})`).join('  '),'text;html=1;align=left;spacingLeft=8;fontSize=10;whiteSpace=wrap;',0,h-extra,w,extra,id);
      }else if(model.kind==='process'){
        cell(id,model.number,'swimlane;horizontal=1;startSize=30;rounded=1;html=1;whiteSpace=wrap;fillColor=#e8f0fb;strokeColor=#465360;fontSize=15;fontStyle=1;',x,y,w,h,'1',`data-source="${xml(model.source??'backend/src/create-app.mjs')}"`);
        cell(`${id}-name`,model.name,'text;html=1;whiteSpace=wrap;align=center;fontSize=17;',0,30,w,h-30,id);
      }else if(model.kind==='external')cell(id,`${model.id}\n${model.name}`,'rounded=0;html=1;whiteSpace=wrap;fillColor=#f1f2f4;strokeColor=#465360;fontSize=17;',x,y,w,h);
      else{
        cell(id,'','rounded=0;html=1;whiteSpace=wrap;fillColor=#ecf5ee;strokeColor=none;',x,y,w,h);
        cell(`${id}-code`,model.id,'text;html=1;align=center;fontSize=15;fontStyle=1;',0,0,38,h,id);
        cell(`${id}-name`,model.name,'text;html=1;whiteSpace=wrap;align=center;fontSize=17;',42,0,w-42,h,id);
        for(const [suffix,lx,ly,lw,lh] of [['top',0,0,w,1],['bottom',0,h-1,w,1],['left',0,0,1,h],['separator',38,0,1,h]])cell(`${id}-${suffix}`,'','rounded=0;strokeColor=none;fillColor=#465360;',lx,ly,lw,lh,id);
      }
    }
    for(const edge of graph.edges??[]){
      const source=graph.objects.find(n=>n._gvid===edge.tail)?.name,target=graph.objects.find(n=>n._gvid===edge.head)?.name;
      if(!modelNodes.has(source)||!modelNodes.has(target))continue;
      const semantic=view.edges.find(e=>e.id===edge.id);
      let src=`${view.id}-${source}`,dst=`${view.id}-${target}`,arrows='endArrow=block;endFill=1;';
      if(view.family==='dfd'&&semantic.source!==source)arrows='startArrow=block;startFill=1;endArrow=none;';
      if(view.family==='der'){
        arrows=`startArrow=${semantic.parentCard==='1'?'ERmandOne':'ERzeroToOne'};endArrow=${semantic.childCard==='0..1'?'ERzeroToOne':'ERzeroToMany'};startFill=0;endFill=0;dashed=${semantic.identifying?'0':'1'};`;
      }
      const points=(edge._draw_??[]).filter(op=>op.op==='b'||op.op==='L').flatMap(op=>op.points);
      const waypoints=points.map(([x,y])=>`<mxPoint x="${x*scale+pad}" y="${(H-y)*scale+pad}"/>`).join('');
      cells.push(`<mxCell id="${xml(view.id+'-'+edge.id)}" edge="1" parent="1" source="${xml(src)}" target="${xml(dst)}" value="${xml(edge.label??'')}" style="edgeStyle=none;html=1;rounded=0;fontSize=12;labelBackgroundColor=#ffffff;strokeColor=#576474;exitX=1;exitY=0.5;entryX=0;entryY=0.5;exitPerimeter=0;entryPerimeter=0;${arrows}"><mxGeometry relative="1" as="geometry"><Array as="points">${waypoints}</Array></mxGeometry></mxCell>`);
    }
    pages.push(`<diagram id="${view.id}" name="${xml(view.title)}"><mxGraphModel page="1" pageWidth="${bounds[2]*scale+pad*2}" pageHeight="${H*scale+pad*2+100}" background="#ffffff"><root>${cells.join('\n')}</root></mxGraphModel></diagram>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="drawio" version="26.0.0">${pages.join('\n')}</mxfile>\n`;
}

await fs.mkdir(work,{recursive:true});
const views=[...dfdViews,...erViews];
for(const view of views){
  view.dot=view.family==='dfd'?dfdDOT(view):erDOT(view);
  await fs.writeFile(path.join(work,`${view.id}.dot`),view.dot);
  console.log(`Diagramando ${view.id}`);
  const result=viz.render(view.dot,{format:'svg'});
  check(result.status==='success'&&!result.errors.some(e=>e.level==='error'),`${view.id}: ${JSON.stringify(result.errors)}`);
  view.svg=result.output.replace(/<\?xml[^>]*\?>\s*/,'').replace(/<!DOCTYPE[^>]*>\s*/,'');
  view.layout=viz.renderJSON(view.dot);
  await fs.writeFile(path.join(out,`${view.id}.svg`),view.svg);
  await fs.writeFile(path.join(work,`${view.id}.dot`),view.dot);
  await fs.writeFile(path.join(work,`${view.id}.layout.json`),JSON.stringify(view.layout));
}
const schema={date:'2026-11-04',basis:'Migraciones 001–010 más schema_migrations en el motor; sin introspección de la base privada.',tables:[...tables.values()],relations};
const dfd={date:'2026-11-04',notation:'Gane–Sarson',boundary:'Frontend web + APK Android + API ExpoTec',stores,views:dfdViews.map(({layout,svg,dot,...v})=>v)};
await fs.writeFile(path.join(out,'der-esquema.json'),JSON.stringify(schema,null,2)+'\n');
await fs.writeFile(path.join(out,'dfd-modelo.json'),JSON.stringify(dfd,null,2)+'\n');
await fs.writeFile(path.join(out,'DFD-ExpoTec.drawio'),drawioDocument(dfdViews));
await fs.writeFile(path.join(out,'DER-ExpoTec.drawio'),drawioDocument(erViews));
const viewer=await fs.readFile(path.join(here,'data_models_viewer.html.in'),'utf8');
const payload=views.map(({id,family,title,note,svg,nodes,edges})=>({id,family,title,note,svg,nodes:nodes.length,edges:edges.length}));
await fs.writeFile(path.join(out,'modelos-datos.html'),viewer.replace('__DIAGRAMS__',JSON.stringify(payload).replace(/<\//g,'<\\/')));
await fs.writeFile(path.join(out,'flujo-completo.html'),await fs.readFile(path.join(here,'data_models_redirect.html.in'),'utf8'));
const tableRows=[...tables.values()].map(t=>`| \`${t.name}\` | \`${t.pk.join(', ')}\` | ${t.columns.length} | ${t.foreignKeys.length} | ${t.source}:${t.line} |`).join('\n');
const relRows=relations.map(r=>`| \`${r.parent}(${r.parentColumns.join(', ')})\` | ${r.parentCard} | ${r.childCard} | \`${r.child}(${r.columns.join(', ')})\` | ${r.identifying?'Identificante':'No identificante'} |`).join('\n');
await fs.writeFile(path.join(out,'DICCIONARIO_DER.md'),`# Diccionario del DER físico\n\nFuente: ${schema.basis}\n\n${tables.size} tablas, ${[...tables.values()].reduce((s,t)=>s+t.columns.length,0)} atributos y ${relations.length} restricciones FK. Las FK compuestas se representan como una relación, no como varias relaciones independientes.\n\n## Entidades\n\n| Tabla | PK | Atributos | FK | Fuente |\n| --- | --- | --- | --- | --- |\n${tableRows}\n\n## Relaciones\n\nLa multiplicidad del extremo padre indica cuántos padres puede referenciar una fila hija; la del extremo hijo indica cuántas filas hijas admite un padre. El mínimo cero del extremo hijo no se reemplaza por uno por una regla del formulario.\n\n| Extremo padre | Multiplicidad padre | Multiplicidad hija | Extremo hijo | Tipo |\n| --- | --- | --- | --- | --- |\n${relRows}\n\n## Restricciones que no deben inferirse como FK\n\n- \`projects.image_url\` y \`gallery_photos.image_url\` se validan en código; no referencian por FK a \`image_uploads\`.\n- \`loans(project_id, resource_id)\` no tiene FK compuesta a \`resource_allocations\`; la reserva se verifica en la operación del backend.\n- \`social_flows.email\` no referencia a \`users.email\`.\n- \`auth_rate_limits\` y \`schema_migrations\` son tablas independientes.\n- \`social_flows.binding_hash\` es nullable y se incorpora en 008, después de \`proof_hash\`.\n- La unicidad diaria de préstamos es \`(project_id, resource_id, day)\`. Los grupos U1/U2 del dibujo identifican restricciones UNIQUE completas.\n`);
const flowRows=level1.edges.map(e=>`| ${e.id} | ${e.source} | ${e.target} | ${e.label} |`).join('\n');
await fs.writeFile(path.join(out,'DICCIONARIO_DFD.md'),`# Diccionario del DFD\n\nFrontera: ${dfd.boundary}. La misma persona puede actuar con varios perfiles. Los almacenes D1–D6 son agrupaciones lógicas de tablas, no bases separadas. D7 conserva archivos.\n\n## Almacenes\n\n| Código | Nombre | Tablas / soporte |\n| --- | --- | --- |\n${Object.entries(stores).map(([id,[name,list]])=>`| ${id} | ${name} | ${list.map(t=>'\x60'+t+'\x60').join(', ')} |`).join('\n')}\n\n## Flujos del nivel 1\n\n| Flujo | Origen | Destino | Datos |\n| --- | --- | --- | --- |\n${flowRows}\n\n## Balance entre niveles\n\nEl contexto agrupa B01–B28 por entidad y dirección. El nivel 1 conserva los 28 intercambios. La descomposición de 3.0 conserva exactamente B05–B08, B19–B20 y S07–S13; un mismo flujo agregado puede descomponerse en más de una lectura/escritura. I31–I35 son intercambios internos entre subprocesos. El generador verifica estos conjuntos y que cada flecha pase por al menos un proceso.\n\nLas flechas representan datos; no significan secuencia temporal, llamadas de navegación ni decisiones sí/no. La validación, permisos y transacciones se aplican dentro de los procesos. La demostración local queda fuera del DFD compartido: su persistencia no alimenta TiDB.\n`);
console.log(JSON.stringify({tables:tables.size,columns:schema.tables.reduce((s,t)=>s+t.columns.length,0),foreignKeys:relations.length,compositeFK:relations.filter(r=>r.columns.length>1).length,alterApplied:alters,dfdViews:dfdViews.length,derViews:erViews.length,balanced:true,graphviz:viz.graphvizVersion}));
