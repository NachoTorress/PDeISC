# Acceso: dirección visual

Aplicación personal de autenticación en React Native y web. El formulario y su acción principal tienen prioridad. La identidad es cercana, colorida y ordenada.

ENERGY 2 / RHYTHM 2 / MOTION 1. Las únicas respuestas de movimiento son estados de interacción sin desplazamientos ni animaciones automáticas.

## Sistema

- Petróleo para acciones y panel de identidad; azul tinta para texto; fondo azul claro para separar la página de los formularios; durazno para un énfasis puntual. Los proveedores conservan sus colores identificatorios.
- Las paletas de `frontend/src/styles/light.ts` y `dark.ts` son la fuente de colores. `theme.ts` concentra dimensiones y estilos compartidos.
- Campos, botones principales, proveedores y ayudas: altura base de 52 px, radio de 12 px. Las opciones de seguridad ocupan todo el ancho y tienen al menos 48 px. Los enlaces y el selector de tema tienen áreas de al menos 44 px.
- Paneles: radio de 24 px, separación de 24 px. Ancho máximo total de 1120 px y de 560 px para una columna. Desde 900 px, panel de identidad y formulario comparten una fila y se estiran a la misma altura.
- Los botones de cada grupo reparten el ancho por igual. El texto puede envolver sin recortes. Los mensajes de error y éxito incluyen texto además del color.
- Tipografía del sistema para integración nativa y carga inmediata; títulos de 30 px, cuerpo de 14–15 px. El título del panel de identidad puede crecer a 52 px en escritorio.
- Los íconos de FontAwesome5 representan acciones reales: correo, contraseña, recuperación, sesión y tema. Sol/luna describen la acción mediante una etiqueta accesible.

## Referencias y decisiones

- [Clerk Sign In](https://clerk.com/components/sign-in): separación clara entre credenciales, acceso social y recuperación. Se conserva la lógica propia de la aplicación.
- [Duolingo: shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/): coherencia de formas y color como identidad. Se aplica una paleta propia, con menor intensidad para un formulario de acceso.
- Referencias locales de Awesome DESIGN.md (Slack y Stripe): escalas de espaciado y contraste entre superficies de identidad y formularios. No se incorporan su marca, tipografía propietaria ni composiciones de marketing.

## Contrato de verificación

Objetivo: ingresar, registrar o recuperar una cuenta sin perder orientación entre pantallas. La acción principal tiene ancho completo; las opciones alternativas tienen igual tamaño entre sí.

Vistas de control: 375×812, 768×1024 y 1440×900, en claro y oscuro. Sin desborde horizontal; etiquetas largas y datos de cuenta deben envolver. El foco de teclado permanece visible. No hay animación que requiera una excepción para movimiento reducido.

Estados: formulario vacío (acción deshabilitada), campos inválidos (mensaje), operación pendiente (indicador), error de API (mensaje recuperable), éxito (verificación o cuenta), proveedores vinculados parcialmente y cierre con confirmación. Las pruebas de interfaz usan datos ficticios y respuestas de API locales al navegador; el acceso OAuth real requiere sus servicios externos.
