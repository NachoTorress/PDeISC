# Migración a Expo SDK 57

Fecha: 13/10/26. Cliente activo: `frontend/native`. La versión anterior permanece en `frontend/web` como referencia.

## Conservación de datos

Se mantiene el esquema de proyectos, integrantes, espacios, mobiliario, etiquetas, recursos y préstamos. La vista web utiliza el mismo almacenamiento del prototipo cuando se abre desde el mismo origen. Se comprobó la restauración de los cuatro proyectos confirmados, los tres espacios y la etiqueta «Zona de robótica» en `http://127.0.0.1:5173`.

Android guarda datos en archivos locales con una copia de respaldo; la preferencia del tema usa AsyncStorage. Un teléfono nuevo comienza con los ejemplos. No hay transferencia automática de datos desde la computadora ni sincronización entre dispositivos.

## Comprobaciones realizadas

- Expo instalado 57.0.28, React 19.2.3 y React Native 0.86.3; módulos nativos contrastados con el mapa de compatibilidad incluido en Expo.
- TypeScript y ESLint sin errores.
- 40 pruebas de reglas y restauración pasan.
- Exportación web y empaquetado Android con Hermes completados.
- Vista Expo Web: edición y guardado de enlaces, validación inmediata de nombres y direcciones, confirmación al quitar enlaces, ficha y retroceso, cambio de tamaño por arrastre, etiquetas y conservación al recargar.
- Navegación lateral y de celular, paletas clara y oscura, controles del editor de 48 dp.
- Registro de una entrega y devolución parcial con saldo correcto; presentación de fichas, avance automático comprobado de 1/4 a 2/4 y sus controles.

Las capturas de revisión en `.impeccable/review/native-*.png` corresponden a **Expo Web**. No acreditan ejecución en Android.

## Etapa posterior

El usuario postergó la generación del APK. Antes de compilarlo se probarán en un teléfono Android la navegación, teclado, gestos, selección de fotos, reproducción de videos y recuperación del almacenamiento. El backend, autenticación, MySQL, permisos reales y documentación final permanecen en el alcance de las etapas siguientes.
