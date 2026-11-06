# Revisión visual del 6 de noviembre de 2026

Se conservaron la navegación, la estructura de pantallas y la paleta de ExpoTec. Se afinaron los bordes de campos y botones, se redujo el encabezado del acceso en celular, se dio más separación visual a las cabeceras oscuras y se agruparon las acciones de proyectos. El acceso de la barra superior usa el ícono de login y conserva su etiqueta accesible, foco de teclado y estados de interacción.

Incluye los cambios previos: puestos libres azules y ocupados verdes en modo oscuro, texto legible sobre el puesto ocupado y Google en una fila completa con Discord y GitHub juntos debajo en la vista compacta.

## Comprobaciones

- Edge con un perfil temporal, exportación web local y respuestas ficticias de la API; sin escrituras ni consultas a la base de producción.
- 30 capturas de espacios, plano, acceso, registro y proyectos a 320, 390 y 1440 píxeles, en ambos temas.
- 20 capturas adicionales de espacios, proyectos, inventario, préstamos y galería con sesión administrativa ficticia, a 390 y 1440 píxeles, en ambos temas.
- Sin desbordes horizontales del documento ni errores de ejecución en esos recorridos. Se verificó la alineación de los proveedores sociales en las vistas compactas.
- Revisión de tipos, análisis de código y exportación web completados correctamente.

Las capturas antes/después, los datos ficticios y los informes quedan en `artifacts/visual-review/`, excluido de Git. Estas pruebas de navegador no sustituyen la instalación y el uso del APK en un teléfono físico.

El frontend de la APK 0.5.4 (código Android 10) corresponde a `30f06cf4209f2d9987c7758f4a1ecef73b676b98`. La descarga y la verificación del archivo se registran en [APK de prueba](APK_PRUEBA.md).
