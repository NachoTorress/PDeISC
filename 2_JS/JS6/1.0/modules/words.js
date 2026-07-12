/**
 * modules/words.js
 * -------------------------------------------------------
 * De donde viene: banco de palabras fijo definido en el
 *                  propio backend (el sistema "tiene" las
 *                  palabras, el usuario nunca las ingresa).
 * A donde va:     lo consume modules/routes/wordRoutes.js,
 *                  que expone la ruta GET /api/palabra para
 *                  que el front la pida via fetch.
 * Que hace:       guarda palabras en español (sin tildes,
 *                  con Ñ donde corresponda) junto a una
 *                  categoria y una pista, y expone una
 *                  funcion para elegir una al azar.
 * -------------------------------------------------------
 */

const BANCO_DE_PALABRAS = [
    { palabra: 'ELEFANTE', categoria: 'Animales', pista: 'Mamifero enorme con trompa' },
    { palabra: 'JIRAFA', categoria: 'Animales', pista: 'El animal terrestre mas alto' },
    { palabra: 'TIBURON', categoria: 'Animales', pista: 'Depredador marino con muchos dientes' },
    { palabra: 'CANGURO', categoria: 'Animales', pista: 'Animal australiano que salta' },
    { palabra: 'PINGUINO', categoria: 'Animales', pista: 'Ave que no vuela y vive en el frio' },
    { palabra: 'COMPUTADORA', categoria: 'Objetos', pista: 'La usas para programar' },
    { palabra: 'TELEFONO', categoria: 'Objetos', pista: 'Sirve para llamar y enviar mensajes' },
    { palabra: 'BICICLETA', categoria: 'Objetos', pista: 'Vehiculo de dos ruedas a pedal' },
    { palabra: 'PARAGUAS', categoria: 'Objetos', pista: 'Te protege de la lluvia' },
    { palabra: 'MOCHILA', categoria: 'Objetos', pista: 'Se lleva en la espalda con utiles' },
    { palabra: 'MONTAÑA', categoria: 'Naturaleza', pista: 'Elevacion natural del terreno' },
    { palabra: 'VOLCAN', categoria: 'Naturaleza', pista: 'Puede hacer erupcion con lava' },
    { palabra: 'CASCADA', categoria: 'Naturaleza', pista: 'Caida de agua desde una altura' },
    { palabra: 'DESIERTO', categoria: 'Naturaleza', pista: 'Zona muy seca y arenosa' },
    { palabra: 'BOSQUE', categoria: 'Naturaleza', pista: 'Lugar con muchos arboles' },
    { palabra: 'MILANESA', categoria: 'Comida', pista: 'Carne rebozada tipica argentina' },
    { palabra: 'EMPANADA', categoria: 'Comida', pista: 'Masa rellena, tipica en Argentina' },
    { palabra: 'ALFAJOR', categoria: 'Comida', pista: 'Dulce con dulce de leche entre galletas' },
    { palabra: 'SANDIA', categoria: 'Comida', pista: 'Fruta grande, verde por fuera y roja por dentro' },
    { palabra: 'PIÑATA', categoria: 'Comida', pista: 'Se rompe en los cumpleaños (no es comida, es un juego)' },
    { palabra: 'BOMBERO', categoria: 'Profesiones', pista: 'Apaga incendios' },
    { palabra: 'ASTRONAUTA', categoria: 'Profesiones', pista: 'Viaja al espacio' },
    { palabra: 'PROGRAMADOR', categoria: 'Profesiones', pista: 'Escribe codigo para crear software' },
    { palabra: 'ARQUITECTO', categoria: 'Profesiones', pista: 'Diseña edificios y planos' },
];

/**
 * Devuelve una palabra al azar del banco, con su categoria y pista.
 * @returns {{palabra: string, categoria: string, pista: string}}
 */
export function obtenerPalabraAleatoria() {
    const indice = Math.floor(Math.random() * BANCO_DE_PALABRAS.length);
    return BANCO_DE_PALABRAS[indice];
}
