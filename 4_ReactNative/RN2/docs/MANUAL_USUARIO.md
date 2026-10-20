# Manual de usuario de Pulso

Proyecto académico de herramientas nativas  
React Native · Expo SDK 57  
15 de octubre de 2026

## Introducción

Pulso permite explorar seis herramientas del teléfono y conservar los resultados en registros locales. Este manual presenta los procedimientos de uso y las soluciones a los problemas habituales. Sigue una estructura de títulos y referencias basada en APA, séptima edición; es documentación Markdown, no un documento maquetado para impresión académica.

## Instalación

Descargue el APK desde el enlace de la compilación de Expo EAS. Abra el archivo en Android y permita la instalación desde esa fuente si el sistema lo solicita. Las autorizaciones de cámara, ubicación y movimiento se piden al utilizar cada función. El procedimiento de compilación para quien entrega el proyecto se encuentra en el README.

## Navegación y apariencia

En la pantalla principal, seleccione una herramienta. En móviles, la barra inferior permite alternar entre Herramientas y Mis registros. En pantallas grandes, estas opciones aparecen en el lateral. El botón de luna o sol cambia el tema y guarda la preferencia. El botón Todas las herramientas regresa al inicio. Si una pantalla es extensa y se ha desplazado hacia abajo, Volver arriba lleva al comienzo.

## Cámara

Abra Cámara y permita el acceso. Seleccione la cámara frontal o trasera; la linterna se ofrece con la cámara trasera. Pulse Tomar foto. Revise la captura, escriba un título y, opcionalmente, notas. Pulse Guardar registro. El botón de guardado desaparece tras confirmar la operación. Tomar otra foto inicia una captura nueva; una foto que no se guardó no se incorpora al historial.

## Lector de códigos

Abra Lector de códigos, permita la cámara y enfoque un QR o un código de barras dentro del recuadro. La lectura se detiene al detectar un código. Revise el contenido antes de guardarlo; los enlaces no se abren automáticamente. Leer otro código inicia una lectura nueva.

## Ubicación y GPS

Abra Ubicación y GPS y pulse Iniciar GPS. Permita la ubicación y compruebe que el GPS del teléfono esté activo. Espere la primera posición y revise las coordenadas y la precisión en metros. Conservar este punto detiene el seguimiento y prepara el resultado para guardarlo. Detener GPS pausa la consulta sin guardarla. Actualizar ubicación inicia una nueva lectura. Abrir en mapas abre un servicio externo; puede requerir conexión.

## Acelerómetro y giroscopio

Estas pruebas se realizan en la aplicación nativa; la vista web muestra la indicación de instalar la APK. Abra el sensor y pulse Iniciar medición. Mueva o gire suavemente el teléfono. Los ejes X, Y y Z y el gráfico muestran lecturas reales. El acelerómetro se expresa en g e incluye la gravedad; el giroscopio se expresa en radianes por segundo. Los valores negativos representan direcciones válidas. Pausar medición detiene la lectura. Conservar esta lectura congela la muestra para guardarla como registro. El gráfico no representa una calibración científica ni un instrumento de precisión.

## Biometría

El teléfono debe tener hardware compatible y una huella o un rostro configurado en los ajustes de seguridad. Pulse Verificar mi identidad y siga las indicaciones del sistema. Después de una verificación correcta, puede guardar el resultado y su hora. La app no recibe ni almacena huellas o imágenes faciales. La biometría es una demostración independiente; no funciona como contraseña del historial. Esta prueba requiere la aplicación nativa, no la página web.

## Consulta, edición y eliminación

Abra Mis registros. Utilice la búsqueda por título o notas y los filtros por herramienta. Cada tarjeta muestra el día, mes y año de creación en formato DD/MM/AA y la hora local. Editar permite cambiar el título y las notas; las mediciones originales permanecen intactas. Los errores se muestran inmediatamente junto al campo. Guardar cambios aplica la edición; Cancelar edición conserva los valores anteriores.

Para eliminar, pulse Eliminar en la tarjeta correspondiente. Lea la confirmación que aparece dentro de esa misma tarjeta. Conservar registro cancela; Sí, eliminar borra el registro y, cuando corresponde, su foto. La eliminación es permanente.

## Resolución de problemas

| Situación | Acción |
| --- | --- |
| Permiso bloqueado | Habilite el permiso para Pulso en los ajustes y vuelva a la herramienta. En web, use los permisos del navegador y recargue. |
| Cámara ocupada | Cierre otras aplicaciones que utilicen la cámara y reiníciela desde Pulso. |
| GPS sin señal | Active la ubicación; pruebe al aire libre o cerca de una ventana y vuelva a iniciar. |
| Sensor no disponible | Pruebe en un teléfono físico compatible. Un equipo de escritorio puede carecer de sensores. |
| Biometría sin configurar | Registre una huella o un rostro en los ajustes de seguridad y vuelva a comprobar. |
| No se pudo guardar | Libere espacio y reintente. El resultado sigue visible y los registros anteriores se conservan. |
| Registros no legibles | Pulse Reintentar carga. No borre los datos de la app si desea conservarlos. |

## Privacidad y conservación

Las pruebas y fotografías se guardan localmente. No hay cuentas ni servidor. Los permisos se utilizan para las herramientas elegidas; la cámara y los sensores se detienen al abandonar su pantalla. Al desinstalar o borrar los datos de la aplicación se pierden los registros. La autenticación biométrica queda a cargo del sistema operativo (Expo, s. f.).

## Referencias

Expo. (2026, 30 de junio). *Expo SDK 57*. https://expo.dev/changelog/sdk-57

Expo. (s. f.). *Camera*. https://docs.expo.dev/versions/v57.0.0/sdk/camera/

Expo. (s. f.). *LocalAuthentication*. https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/

Expo. (s. f.). *Location*. https://docs.expo.dev/versions/v57.0.0/sdk/location/

Expo. (s. f.). *Sensors*. https://docs.expo.dev/versions/v57.0.0/sdk/sensors/
