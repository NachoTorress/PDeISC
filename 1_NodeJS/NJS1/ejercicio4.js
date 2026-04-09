// Importación de las funciones desde el archivo calculos.js y uso de las mismas para mostrar resultados
import{suma, resta, multiplicacion, division} from "./calculos.js";
//Console log para mostrar el resultado de las operaciones utilizando las funciones importadas
console.log("Resultado de la suma 5 y 3: "+ suma(5,3));
console.log("Resultado de la resta de 6 a 8: "+ resta(8,6));
console.log("Resultado de la multiplicación de 3 por 11: "+ multiplicacion(3,11));
console.log("Resultado de la división de 30 entre 5: "+ division(30,5));