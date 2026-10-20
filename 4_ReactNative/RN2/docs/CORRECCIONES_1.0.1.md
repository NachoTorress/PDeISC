# Correcciones 1.0.1

Se conservan el identificador Android, la firma, las claves de almacenamiento y el formato de los registros. Instalar la actualización sobre la versión anterior permite conservar los datos; no es necesario desinstalar.

## Cámara en PC

Expo Camera usa `object-fit: cover` en el vídeo web: el visor de ancho variable recortaba la señal, mientras la foto conservaba las dimensiones originales. El selector exclusivo del visor ahora usa `contain` y centra la señal. Si la proporción del visor difiere de la cámara aparecen bandas, sin deformar ni recortar el encuadre. No modifica la cámara de Android.

## Ubicación en Android

La búsqueda anterior cancelaba la sesión ante cualquier transición a segundo plano. Los permisos y los ajustes de precisión pueden producir esa transición temporal en Android; la cancelación dejaba el estado normal sin explicación, coincidiendo con el síntoma informado.

La nueva sesión distingue esos diálogos de una salida real de la aplicación. Comprueba los permisos existentes, solicita activación de la precisión de ubicación cuando hace falta, inicia una consulta de posición y mantiene la suscripción sin exigir desplazamiento. Usa precisión equilibrada para obtener el primer punto y muestra la precisión real recibida. Las interrupciones, el tiempo de espera y las cancelaciones dejan estados claros, y los resultados tardíos no modifican una sesión detenida.

La consulta puntual de Expo no admite cancelación nativa; su resultado se descarta después de detener o desmontar. La suscripción continua sí se libera.

## Registros y desplazamiento

Se eliminó `flex: 1` de las tarjetas de altura automática y se usa una columna normal en móvil. La grilla queda reservada para escritorio. Los ancestros del área desplazable tienen un límite vertical explícito.

La regresión con Yoga y la compatibilidad que usa React Native reprodujo el problema anterior: una grilla medida en 987 puntos contenía tarjetas que se extendían hasta 2997 puntos, fuera del área que ScrollView podía recorrer. Con el arreglo, los bordes de las tarjetas quedan dentro de la altura medida. Edición, eliminación confirmada, filtros y datos existentes permanecen disponibles.

## Validación

- TypeScript y ESLint: correctos.
- Pruebas automatizadas: 23 aprobadas, incluidas 11 de ciclo de vida GPS.
- Regresión de layout Yoga: 25 escenarios aprobados, en 320, 390, 480, 1200 y 1440 puntos, con filtros y edición expandida.
- La verificación física de la nueva ubicación y la cámara corresponde a la instalación de la APK en el dispositivo. Estas comprobaciones de código no se presentan como una prueba física realizada.

Fuente consultada para ubicación: https://docs.expo.dev/versions/v57.0.0/sdk/location/
