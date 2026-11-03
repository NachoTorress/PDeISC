"""Genera las vistas didácticas, el original draw.io y el modelo compartido."""
from pathlib import Path
import argparse
import html
import json
import textwrap
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "diagramas"
VIEWS = []


def view(key, title, takeaway, levels, edges):
    nodes = []
    for rank, items in enumerate(levels):
        for order, (node_id, label, detail, source) in enumerate(items):
            nodes.append(dict(id=node_id, label=label, detail=detail,
                              source=source, rank=rank, order=order))
    VIEWS.append(dict(id=key, title=title, takeaway=takeaway, nodes=nodes,
                      edges=[dict(source=a, target=b, label=c) for a, b, c in edges]))


view("general", "1. Estructura general", "Web y APK comparten frontend y API; TiDB conserva los datos compartidos.", [
    [("persona", "Persona", "Visitante o cuenta con roles", "frontend/native/src/components/navigation/navigationItems.ts")],
    [("web", "Web y TV", "React Native Web en Vercel", "frontend/native/vercel.json"), ("apk", "APK Android", "Expo / React Native instalado", "frontend/native/app.json")],
    [("api", "API ExpoTec", "Express / Node.js en Vercel", "backend/src/app.mjs")],
    [("tidb", "TiDB", "Filas, relaciones e historiales", "backend/src/config/database.mjs"), ("blob", "Vercel Blob", "Archivos de imágenes privados", "backend/src/services/uploads.mjs"), ("externos", "Identidad y correo", "Google, Discord, GitHub y SMTP", "backend/src/create-app.mjs")],
], [("persona", "web", "Navegador"), ("persona", "apk", "Instalación"), ("web", "api", "HTTPS /api"), ("apk", "api", "HTTPS directo"), ("api", "tidb", "SQL + TLS"), ("api", "blob", "Archivos"), ("api", "externos", "Servicios")])

view("peticion", "2. Del botón a la base", "La pantalla ayuda a validar; el servidor decide permisos y guarda los cambios relacionados juntos.", [
    [("pantalla", "Pantalla y formulario", "Captura datos y muestra errores", "frontend/native/src/pages/SharedProposalPage.tsx")],
    [("hook", "Hook y cliente", "Borrador, sesión y pedido JSON", "frontend/native/src/hooks/useSharedProposal.ts")],
    [("ruta", "Express y ruta", "Protecciones, sesión y validadores", "backend/src/create-app.mjs")],
    [("repo", "Repositorio", "Roles vigentes y reglas de negocio", "backend/src/repositories/projects.mjs")],
    [("db", "Transacción TiDB", "Confirma todo o revierte todo", "backend/src/config/database.mjs")],
    [("json", "Resultado JSON", "Éxito o error con código y campos", "backend/src/lib/errors.mjs")],
], [("pantalla", "hook", "Enviar"), ("hook", "ruta", "HTTPS"), ("ruta", "repo", "Datos válidos"), ("repo", "db", "SQL"), ("db", "json", "Resultado"), ("json", "pantalla", "Actualizar o corregir")])

view("sesion", "3. Acceso y sesión", "La web renueva mediante cookie HttpOnly; Android usa SecureStore. Los roles los comprueba la API.", [
    [("abrir", "Abrir ExpoTec", "AuthProvider restaura la sesión", "frontend/native/src/contexts/AuthContext.tsx")],
    [("correo", "Correo y contraseña", "Registro o verificación del hash", "backend/src/services/auth.mjs"), ("social", "Acceso social", "Identidad verificada por proveedor", "backend/src/services/social.mjs")],
    [("sesion", "Sesión ExpoTec", "Acceso de 15 min y renovación rotativa", "backend/src/services/crypto.mjs")],
    [("memoria", "Token de acceso", "Se conserva en memoria", "frontend/native/src/lib/authClient.ts"), ("seguro", "Renovación", "Cookie web o SecureStore Android", "frontend/native/src/lib/sessionStorage.native.ts")],
    [("operar", "Llamada autenticada", "API comprueba cuenta y roles", "backend/src/middleware/auth.mjs")],
], [("abrir", "correo", "Si necesita ingresar"), ("abrir", "social", "Otra forma de ingreso"), ("correo", "sesion", "Credenciales válidas"), ("social", "sesion", "Completar flujo"), ("sesion", "memoria", "Acceso"), ("sesion", "seguro", "Hasta 30 días"), ("memoria", "operar", "Bearer"), ("seguro", "operar", "Renueva cuando hace falta")])

view("proyectos", "4. Ciclo del proyecto", "La confirmación asigna puesto y reserva elementos en una sola transacción.", [
    [("borrador", "Alumno: propuesta", "Datos, equipo, lugar y revisión final", "frontend/native/src/pages/SharedProposalPage.tsx")],
    [("pending", "En revisión", "Estado pending; todavía es un pedido", "backend/src/repositories/projects.mjs")],
    [("changes", "Requiere cambios", "Integrante corrige y reenvía", "frontend/native/src/pages/SharedProjectPage.tsx"), ("approved", "Confirmado", "Puesto y elementos reservados", "backend/src/repositories/inventory.mjs")],
    [("publico", "Muestra, plano y TV", "Se expone la información pública", "backend/src/repositories/projects.mjs")],
    [("cancelled", "Cancelado", "Conserva historial y libera asignaciones", "backend/src/repositories/projects.mjs"), ("reabrir", "Reabrir propuesta", "Admin; exige devolver y libera reservas", "backend/src/repositories/loan-balances.mjs")],
], [("borrador", "pending", "Enviar"), ("pending", "changes", "Profesor pide cambios"), ("pending", "approved", "Profesor asignado confirma"), ("changes", "pending", "Reenviar"), ("approved", "publico", "Publicar"), ("approved", "reabrir", "Administración"), ("reabrir", "pending", "Vuelve a revisión"), ("pending", "cancelled", "Cancelación autorizada"), ("changes", "cancelled", "Cancelación autorizada"), ("approved", "cancelled", "Antes debe devolver")])

view("espacios", "5. Espacios e inventario", "Un puesto es una mesa habilitada. Un pedido de elementos se convierte en reserva al confirmar el proyecto.", [
    [("admin", "Administración", "Cuenta real con rol admin", "frontend/native/src/components/navigation/navigationItems.ts")],
    [("plano", "Espacio y mobiliario", "Crea y acomoda el plano", "backend/src/repositories/spaces.mjs"), ("stock", "Inventario", "Total y unidades fuera de servicio", "backend/src/repositories/inventory.mjs")],
    [("puestos", "Puestos habilitados", "Mesas que el equipo puede solicitar", "backend/sql/002_spaces.sql"), ("catalogo", "Catálogo autorizado", "Elementos para el pedido del equipo", "backend/src/routes/inventory.mjs")],
    [("confirmar", "Confirmación", "Verifica disponibilidad y versión", "backend/src/repositories/projects.mjs")],
    [("asignar", "Asignaciones", "Puesto ocupado y elementos reservados", "backend/sql/004_inventory.sql")],
], [("admin", "plano", "Gestiona"), ("admin", "stock", "Gestiona"), ("plano", "puestos", "Habilita"), ("stock", "catalogo", "Ofrece"), ("puestos", "confirmar", "Puesto pedido"), ("catalogo", "confirmar", "Cantidades pedidas"), ("confirmar", "asignar", "Todo junto o nada")])

view("prestamos", "6. Entregas y devoluciones", "Cambiar de jornada no cierra saldos. Devolver libera disponibilidad física y conserva la reserva del proyecto.", [
    [("reserva", "Proyecto confirmado", "Reserva vigente de elementos", "backend/src/repositories/loans.mjs")],
    [("entrega", "Revisar entrega", "Jornada, alumno, reserva y stock físico", "frontend/native/src/components/SharedLendingForm.tsx")],
    [("prestamo", "Entrega registrada", "Una por proyecto, elemento y jornada", "backend/sql/005_loans.sql")],
    [("devolver", "Devolución parcial o total", "Saldo = entregado menos devuelto", "frontend/native/src/components/SharedReturnForm.tsx")],
    [("bien", "Vuelve utilizable", "Recupera disponibilidad física", "backend/src/repositories/loans.mjs"), ("dano", "Vuelve con daño", "Cuenta devuelta y fuera de servicio", "backend/src/repositories/inventory.mjs")],
    [("historia", "Saldo e historial", "Registra quién, cuándo y observación", "backend/src/repositories/loan-balances.mjs")],
], [("reserva", "entrega", "Encargado o admin"), ("entrega", "prestamo", "Confirmar"), ("prestamo", "devolver", "Registrar retorno"), ("devolver", "bien", "Sin daño"), ("devolver", "dano", "Con motivo"), ("bien", "historia", "Actualizar"), ("dano", "historia", "Evento de inventario")])

view("fotos", "7. Archivo y foto publicada", "Subir el archivo no lo publica: el aporte queda pendiente hasta la moderación.", [
    [("elegir", "Elegir foto o enlace", "Archivo JPG/PNG/WebP o URL HTTPS", "frontend/native/src/components/PhotoUploadField.tsx")],
    [("permiso", "API autoriza archivo", "Token temporal para una carga", "backend/src/services/uploads.mjs"), ("enlace", "Conservar enlace", "El archivo sigue en el sitio externo", "backend/src/validators/gallery.mjs")],
    [("blob", "Subir a Blob privado", "Cliente sube; API valida y optimiza", "frontend/native/src/lib/photoUpload.ts")],
    [("aporte", "Aporte pendiente", "TiDB guarda autor, URL y descripción", "backend/src/repositories/gallery.mjs")],
    [("moderar", "Administración revisa", "Aprueba o rechaza; controla versión", "backend/src/routes/gallery.mjs")],
    [("publicar", "Galería pública", "Solo aprobadas; imagen con acceso permitido", "backend/src/repositories/uploads.mjs"), ("eliminar", "Eliminar aporte", "Cualquier estado; borra fila y revisiones", "backend/src/repositories/gallery.mjs")],
], [("elegir", "permiso", "Archivo"), ("elegir", "enlace", "URL"), ("permiso", "blob", "Subida y complete"), ("blob", "aporte", "Enviar aporte"), ("enlace", "aporte", "Enviar aporte"), ("aporte", "moderar", "Pendiente"), ("moderar", "publicar", "Aprobar"), ("moderar", "eliminar", "Eliminar si corresponde")])

view("tv", "8. Presentación TV", "TV consulta los datos publicados; no necesita una nueva compilación cuando se confirma un proyecto.", [
    [("publicados", "Proyectos confirmados", "Origen de la muestra pública", "backend/src/repositories/projects.mjs")],
    [("consultar", "Consultar presentación", "Carga todas las páginas de fichas", "frontend/native/src/lib/sharedPresentation.ts")],
    [("reproducir", "Iniciar o pausar", "Anterior, siguiente y pantalla completa", "frontend/native/src/pages/SharedPresentationPage.tsx")],
    [("imagen", "Ficha con imagen", "Avance a los 8, 15 o 30 segundos", "frontend/native/src/pages/SharedPresentationPage.tsx"), ("video", "Ficha con video", "Avance al terminar; sonido opcional", "frontend/native/src/components/SharedPresentationVideo.web.tsx")],
    [("actualizar", "Actualizar cada minuto", "Pausa ante error de conexión", "frontend/native/src/pages/SharedPresentationPage.tsx")],
], [("publicados", "consultar", "POST público"), ("consultar", "reproducir", "Fichas cargadas"), ("reproducir", "imagen", "Imagen"), ("reproducir", "video", "Video"), ("imagen", "actualizar", "Sigue la secuencia"), ("video", "actualizar", "Sigue la secuencia"), ("actualizar", "consultar", "Volver a consultar")])

view("publicacion", "9. Código, web y APK", "La web y la API se despliegan desde main; Android requiere construir y distribuir otra APK.", [
    [("codigo", "Código de ExpoTec", "Repositorio PDelSC: carpeta ExpoTec", "AGENTS.md")],
    [("main", "Commit y push a main", "Publicación autorizada del proyecto", "AGENTS.md"), ("eas", "EAS build preview", "Compila y firma Android", "frontend/native/eas.json")],
    [("vercelweb", "Vercel: frontend", "Expo export web genera dist", "frontend/native/vercel.json"), ("vercelapi", "Vercel: backend", "Publica Express por separado", "backend/src/app.mjs"), ("apk", "Archivo APK", "Descarga e instalación en Android", "docs/APK_PRUEBA.md")],
    [("web", "Web actualizada", "Al cargar la versión publicada", "frontend/native/package.json"), ("api", "API actualizada", "Clientes compatibles usan el servidor", "backend/src/create-app.mjs"), ("android", "Android actualizado", "La APK instalada cambia al reemplazarla", "frontend/native/app.json")],
], [("codigo", "main", "Guardar y publicar"), ("codigo", "eas", "Build aparte"), ("main", "vercelweb", "Frontend"), ("main", "vercelapi", "Backend"), ("eas", "apk", "Resultado"), ("vercelweb", "web", "Publicar"), ("vercelapi", "api", "Publicar"), ("apk", "android", "Instalar")])

view("demo", "10. Demostración local", "Cambiar el perfil del ejemplo no cambia los roles reales ni sincroniza los datos con TiDB.", [
    [("demo", "Demostración", "Datos ficticios de ejemplo", "frontend/native/src/contexts/DemoContext.tsx")],
    [("perfil", "Perfil ficticio", "Alumno, profesor, organización y otros", "frontend/native/src/components/navigation/DemoBar.tsx")],
    [("modelo", "Pantallas y modelo local", "applyMutation comprueba reglas del ejemplo", "frontend/native/src/lib/model.ts")],
    [("web", "En navegador", "AsyncStorage / almacenamiento local", "frontend/native/src/lib/demoStorage.web.ts"), ("android", "En Android", "Archivos JSON con respaldo", "frontend/native/src/lib/demoStorage.native.ts")],
    [("local", "Datos de ese dispositivo", "Separados de cuenta real y base compartida", "frontend/native/src/contexts/DemoContext.tsx")],
], [("demo", "perfil", "Elegir vista"), ("perfil", "modelo", "Probar acciones"), ("modelo", "web", "Web"), ("modelo", "android", "APK"), ("web", "local", "Guardar"), ("android", "local", "Guardar")])

view("datos", "11. Relaciones de los datos", "La base conecta identidad, lugares y movimientos; los archivos de imagen permanecen en Blob.", [
    [("cuentas", "Cuentas y roles", "users, user_roles, sessions", "backend/sql/001_auth.sql")],
    [("proyectos", "Proyectos y equipo", "projects, members, teachers, reviews", "backend/sql/003_projects.sql"), ("galeria", "Fotos y cargas", "gallery_photos, reviews, image_uploads", "backend/sql/006_gallery.sql")],
    [("lugares", "Espacios y puestos", "spaces, furniture, booths, allocations", "backend/sql/002_spaces.sql"), ("recursos", "Pedidos y reservas", "resources, requests, allocations", "backend/sql/004_inventory.sql")],
    [("movimientos", "Préstamos y devoluciones", "loans, loan_returns", "backend/sql/005_loans.sql")],
    [("condicion", "Condición e historial", "Fuera de servicio y eventos de inventario", "backend/sql/005_loans.sql")],
], [("cuentas", "proyectos", "Participan"), ("cuentas", "galeria", "Autor y moderador"), ("proyectos", "lugares", "Solicitan y ocupan"), ("proyectos", "recursos", "Piden y reservan"), ("recursos", "movimientos", "Entrega física"), ("movimientos", "condicion", "Daño o novedad")])


def geometry(flow, width=1120):
    groups = {}
    for node in flow["nodes"]:
        groups.setdefault(node["rank"], []).append(node)
    boxes = {}
    for rank, nodes in groups.items():
        span = (width - 140) / len(nodes)
        for order, node in enumerate(nodes):
            boxes[node["id"]] = (70 + span * order + (span - 276) / 2, 116 + rank * 156, 276, 84)
    if flow["id"] == "proyectos":
        for node_id in ("changes", "cancelled"):
            _, y, w, h = boxes[node_id]
            boxes[node_id] = (80, y, w, h)
        for node_id in ("approved", "publico", "reabrir"):
            _, y, w, h = boxes[node_id]
            boxes[node_id] = (720, y, w, h)
    return boxes, max(groups) * 156 + 320


def route(flow, edge, boxes, index):
    a, b = boxes[edge["source"]], boxes[edge["target"]]
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    if flow["id"] == "proyectos" and edge["target"] == "cancelled":
        if edge["source"] == "approved":
            return [(ax + aw / 2, ay + ah), (ax + aw / 2, ay + ah + 24), (560, ay + ah + 24), (560, by - 28), (bx + bw / 2, by - 28), (bx + bw / 2, by)]
        return [(ax + aw / 2, ay + ah), (ax + aw / 2, by - 28), (bx + bw / 2, by - 28), (bx + bw / 2, by)]
    if by > ay:
        if by - ay <= 156:
            points = [(ax + aw / 2, ay + ah), (ax + aw / 2, (ay + ah + by) / 2), (bx + bw / 2, (ay + ah + by) / 2), (bx + bw / 2, by)]
        else:
            lane = 1092 - index % 3 * 12
            points = [(ax + aw / 2, ay + ah), (ax + aw / 2, ay + ah + 24), (lane, ay + ah + 24), (lane, by - 28), (bx + bw / 2, by - 28), (bx + bw / 2, by)]
    else:
        lane = 1092 if flow["id"] == "proyectos" and edge["source"] == "reabrir" else 24 + index % 3 * 12
        points = [(ax + aw / 2, ay + ah), (ax + aw / 2, ay + ah + 24), (lane, ay + ah + 24), (lane, by - 28), (bx + bw / 2, by - 28), (bx + bw / 2, by)]
    return points


def svg(flow):
    boxes, height = geometry(flow)
    s = ['<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="%s" viewBox="0 0 1120 %s" role="img" aria-labelledby="title desc">' % (height, height),
         '<title id="title">%s</title><desc id="desc">%s</desc>' % (html.escape(flow["title"]), html.escape(flow["takeaway"])),
         '<rect width="1120" height="%s" fill="#ffffff"/>' % height,
         '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#60746a"/></marker></defs>',
         '<g font-family="Arial, sans-serif" fill="#173e2b">',
         '<text x="70" y="46" font-size="27" font-weight="700">%s</text>' % html.escape(flow["title"])]
    for i, edge in enumerate(flow["edges"]):
        points = route(flow, edge, boxes, i)
        s.append('<polyline points="%s" fill="none" stroke="#60746a" stroke-width="1.7" marker-end="url(#arrow)"/>' % " ".join(f"{x},{y}" for x, y in points))
    for node in flow["nodes"]:
        x, y, w, h = boxes[node["id"]]
        s.append('<g><title>%s</title><rect x="%s" y="%s" width="%s" height="%s" rx="8" fill="#edf5ef" stroke="#799783"/>' % (html.escape(node["source"]), x, y, w, h))
        label_lines = textwrap.wrap(node["label"], 29)
        for j, line in enumerate(label_lines):
            s.append('<text x="%s" y="%s" text-anchor="middle" font-size="19" font-weight="700">%s</text>' % (x + w / 2, y + 29 + j * 22, html.escape(line)))
        for j, line in enumerate(textwrap.wrap(node["detail"], 37)):
            s.append('<text x="%s" y="%s" text-anchor="middle" font-size="13" fill="#395d48">%s</text>' % (x + w / 2, y + 56 + j * 16, html.escape(line)))
        s.append('</g>')
    for i, edge in enumerate(flow["edges"]):
        points = route(flow, edge, boxes, i)
        if boxes[edge["target"]][1] - boxes[edge["source"]][1] > 156:
            continue
        if len(points) == 4 and boxes[edge["target"]][1] > boxes[edge["source"]][1]:
            x = (points[1][0] + points[2][0]) / 2
            y = points[1][1] - 7
        elif len(points) == 6:
            x, y = (points[1][0] + points[2][0]) / 2, points[1][1] + 18
        else:
            x, y = (points[0][0] + points[1][0]) / 2, points[0][1] - 9
        s.append('<text x="%s" y="%s" text-anchor="middle" font-size="12" fill="#3b5445" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">%s</text>' % (x, y, html.escape(edge["label"])))
    for j, line in enumerate(textwrap.wrap(flow["takeaway"], 105)):
        s.append('<text x="70" y="%s" font-size="16">%s</text>' % (height - 54 + j * 22, html.escape(line)))
    s.append('</g></svg>')
    return "\n".join(s) + "\n"


def drawio():
    document = ET.Element("mxfile", host="drawio", version="26.0.0")
    for flow in VIEWS:
        boxes, height = geometry(flow)
        page = ET.SubElement(document, "diagram", id=flow["id"], name=flow["title"])
        model = ET.SubElement(page, "mxGraphModel", page="1", pageWidth="1120", pageHeight=str(height), background="#ffffff")
        root = ET.SubElement(model, "root")
        ET.SubElement(root, "mxCell", id="0")
        ET.SubElement(root, "mxCell", id="1", parent="0")
        for suffix, text, y, size in [("title", flow["title"], 24, 25), ("note", flow["takeaway"], height - 80, 16)]:
            cell = ET.SubElement(root, "mxCell", id=f'{flow["id"]}-{suffix}', value=text, vertex="1", parent="1", style=f"text;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontFamily=Arial;fontSize={size};fontColor=#173e2b;")
            ET.SubElement(cell, "mxGeometry", x="70", y=str(y), width="980", height="56", **{"as": "geometry"})
        for node in flow["nodes"]:
            node_id = f'{flow["id"]}-{node["id"]}'
            label = html.escape(node["label"]) + "<br><small>" + html.escape(node["detail"]) + "</small>"
            cell = ET.SubElement(root, "mxCell", id=node_id, value=label, vertex="1", parent="1", **{"data-source": node["source"], "data-model-id": node_id}, style="rounded=1;whiteSpace=wrap;html=1;fillColor=#edf5ef;strokeColor=#799783;fontColor=#173e2b;fontFamily=Arial;fontSize=18;spacing=8;")
            x, y, w, h = boxes[node["id"]]
            ET.SubElement(cell, "mxGeometry", x=str(x), y=str(y), width=str(w), height=str(h), **{"as": "geometry"})
        for i, edge in enumerate(flow["edges"]):
            points = route(flow, edge, boxes, i)
            ports = "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
            cell = ET.SubElement(root, "mxCell", id=f'{flow["id"]}-edge-{i}', value=edge["label"], edge="1", parent="1", source=f'{flow["id"]}-{edge["source"]}', target=f'{flow["id"]}-{edge["target"]}', style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#60746a;fontColor=#3b5445;fontSize=12;labelBackgroundColor=#ffffff;" + ports)
            g = ET.SubElement(cell, "mxGeometry", relative="1", **{"as": "geometry"})
            waypoints = ET.SubElement(g, "Array", **{"as": "points"})
            for x, y in points[1:-1]:
                ET.SubElement(waypoints, "mxPoint", x=str(x), y=str(y))
    ET.indent(document)
    return ET.tostring(document, encoding="unicode", xml_declaration=True) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inline-output", type=Path)
    args = parser.parse_args()
    for flow in VIEWS:
        ids = {n["id"] for n in flow["nodes"]}
        assert len(ids) == len(flow["nodes"])
        for node in flow["nodes"]:
            assert (ROOT / node["source"]).is_file(), node["source"]
        for edge in flow["edges"]:
            assert edge["source"] in ids and edge["target"] in ids
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "flujo-completo.json").write_text(json.dumps(dict(reviewed="2026-11-03", views=VIEWS), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "flujo-completo.drawio").write_text(drawio(), encoding="utf-8")
    for flow in VIEWS:
        (OUT / f'flujo-{flow["id"]}.svg').write_text(svg(flow), encoding="utf-8")
    if args.inline_output:
        template = (Path(__file__).parent / "system_flow_fragment.html").read_text(encoding="utf-8")
        content = template.replace("__FLOW_DATA__", json.dumps(VIEWS, ensure_ascii=False).replace("</", "<\\/"))
        args.inline_output.write_text(content, encoding="utf-8")
    print(json.dumps(dict(views=len(VIEWS), nodes=sum(len(v["nodes"]) for v in VIEWS), edges=sum(len(v["edges"]) for v in VIEWS), source_paths="verified")))


if __name__ == "__main__":
    main()
