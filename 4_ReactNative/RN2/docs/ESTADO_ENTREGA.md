# Estado de la entrega

## Aplicación

Pulso 1.0.1 (versión Android 2), React Native 0.86.3, React 19.2.3 y Expo SDK 57. Android: `com.pulsolab.mobile`. Perfil EAS `preview`, distribución interna y formato APK con firma Android administrada en Expo.

Compilación EAS: `cfc1df24-1022-450f-bc0d-720d1ff21ba9`, estado **FINISHED**.

- Detalles: https://expo.dev/accounts/nachot/projects/pulso-native/builds/cfc1df24-1022-450f-bc0d-720d1ff21ba9
- APK: https://expo.dev/artifacts/eas/W8miiEuqXw5YcV2UCp8XvDbQjP4NaKajL29cm-ITH3A.apk
- Copia local: `artifacts/pulso-1.0.1.apk`.
- Registro de descarga y SHA-256: `artifacts/download-log-1.0.1.json`.
- Tamaño: 102.561.603 bytes. El APK contiene AndroidManifest.xml, classes.dex y el bundle JavaScript embebido para ejecutar sin Metro.
- SHA-256: `d11439557a57254b804ac6d9d29caa5317bb49d5fd8a7032157da26763d8d271`.
- Manifiesto Android verificado: paquete y versiones correctos, compilación no depurable y permisos de cámara, ubicación y biometría presentes. Resultado en `artifacts/apk-verification-1.0.1.json`.

Instalar sobre la versión anterior para conservar los registros. Se mantienen el identificador Android, la firma y las claves de almacenamiento. Los cambios están documentados en [CORRECCIONES_1.0.1.md](CORRECCIONES_1.0.1.md).

No se genera ZIP, por indicación del usuario. El código permanece en la carpeta del proyecto.

## Verificaciones realizadas

| Verificación | Resultado |
| --- | --- |
| TypeScript estricto | Correcto. |
| ESLint | Correcto. |
| Pruebas automáticas | 23 aprobadas, 0 fallidas; incluyen 11 casos del ciclo de vida GPS. |
| Regresión de layout con Yoga | 25 escenarios aprobados entre 320 y 1440 puntos, incluidos filtros y formularios expandidos. |
| Expo Doctor | 21 de 21 comprobaciones aprobadas. |
| Exportación web de producción | Correcta. |
| EAS Android release | APK compilado y firmado correctamente. |
| Interfaz a 390 × 844 y 1440 × 1000 | Revisada en modo oscuro y claro. |
| Navegación, tema persistente y estados vacíos | Verificados en navegador. |
| Volver arriba | Verificado: aparece al desplazar y vuelve al inicio. |
| Permisos de cámara | Pantalla explicativa verificada sin solicitar acceso anticipado. |
| Sensores y biometría en web | Indicación de usar la aplicación nativa, sin mediciones simuladas. |
| Desbordes horizontales en escritorio | Sin desborde: contenido y viewport de 1440 px. |

## Límites de la verificación

No se ejecutó la APK en un teléfono o emulador Android durante esta entrega. Cámara, escaneo físico, precisión GPS, acelerómetro, giroscopio, biometría, teclado nativo y lector de pantalla requieren las pruebas de aceptación en un dispositivo real detalladas en PRUEBAS.md. Un APK compilado correctamente no equivale a una prueba física de hardware.

`npm audit` reportó 22 avisos en dependencias transitivas del entorno Expo/React Native (7 moderados y 15 altos). Las versiones consultadas de node-forge y braces siguen siendo las señaladas por la auditoría; no se aplicó `audit fix --force`, que proponía cambios incompatibles con el SDK 57 solicitado. Se conserva el archivo de dependencias reproducible y se documenta esta limitación.

El primer empaquetado de EAS tomó la carpeta superior del repositorio, por lo que su archivo de carga fue innecesariamente grande. La compilación 1.0.1 utilizó EAS_PROJECT_ROOT y EAS_NO_VCS, documentados en README.md, y cargó únicamente 137 KB de esta carpeta.

## Revisión de frontend

Se aplicaron las skills Awesome Design MD, Graphify y las guías de pulido de interfaces. Los cambios y límites de revisión están en REVISION_FRONTEND.md. No se añadieron bibliotecas de animación ni funcionalidades ajenas a la consigna.
