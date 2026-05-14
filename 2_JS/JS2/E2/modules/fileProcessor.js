/**
 * modules/fileProcessor.js
 * Procesa el contenido de un archivo de texto y extrae números válidos.
 *
 * Funcionalidades:
 *  - Extrae todos los números (enteros y decimales) del texto
 *  - Elimina duplicados
 *  - Identifica números "útiles" (primer y último dígito iguales, mínimo 2 dígitos)
 *  - Identifica cuáles de los enteros positivos son factoriales
 */

// ─── Regex para extraer números del texto ─────────────────────────────────────
// Captura enteros y decimales (con un único punto interno)
const NUMBER_REGEX = /\d+(?:\.\d+)?/g;

// ─── Público ──────────────────────────────────────────────────────────────────

/**
 * Procesa el contenido raw de un archivo de texto.
 *
 * @param {string} content - Contenido completo del archivo .txt
 * @returns {{
 *   usefulNumbers:    number[],
 *   factorialNumbers: number[],
 *   total:            number,
 *   useful:           number,
 *   nonUseful:        number,
 *   percentage:       number
 * }}
 */
export function processFileContent(content) {
    const rawMatches = content.match(NUMBER_REGEX) ?? [];

    // Convertir a float y eliminar duplicados
    const uniqueNumbers = [
        ...new Set(rawMatches.map(s => parseFloat(s)))
    ];

    const usefulNumbers   = filterUseful(uniqueNumbers);
    const factorialNumbers = identifyFactorials(uniqueNumbers);

    const total      = uniqueNumbers.length;
    const useful     = usefulNumbers.length;
    const nonUseful  = total - useful;
    const percentage = total === 0
        ? 0
        : parseFloat(((useful / total) * 100).toFixed(2));

    return {
        usefulNumbers,
        factorialNumbers,
        total,
        useful,
        nonUseful,
        percentage
    };
}

// ─── Privadas ─────────────────────────────────────────────────────────────────

/**
 * Filtra los números cuyo primer y último dígito (ignorando el punto decimal)
 * son iguales. Requiere al menos 2 dígitos para ser considerado útil.
 *
 * Criterio: se evalúan SÓLO los dígitos (sin el punto).
 * Ejemplo: 3.3  → dígitos "33" → primer "3" == último "3" → útil
 *          121  → dígitos "121" → primer "1" == último "1" → útil
 *          1.21 → dígitos "121" → primer "1" == último "1" → útil
 *          12   → dígitos "12"  → "1" != "2" → no útil
 *
 * Si se desea excluir los decimales de esta lógica, se puede ajustar
 * la condición `Number.isInteger(num)` antes de procesar.
 *
 * @param {number[]} numbers
 * @returns {number[]} Ordenados de menor a mayor
 */
function filterUseful(numbers) {
    const useful = numbers.filter(num => {
        // Obtener solo los dígitos (sin punto decimal)
        const digits = num.toString().replace('.', '');

        // Necesita al menos 2 dígitos
        if (digits.length < 2) return false;

        return digits[0] === digits[digits.length - 1];
    });

    return useful.sort((a, b) => a - b);
}

/**
 * Dado un arreglo de números, devuelve los que son factoriales
 * (1!, 2!, 3!, ...). Sólo evalúa enteros positivos.
 *
 * Estrategia: calcula factoriales en secuencia hasta superar el máximo
 * del conjunto, luego intersecta con un Set.
 *
 * @param {number[]} numbers
 * @returns {number[]}
 */
function identifyFactorials(numbers) {
    // Solo enteros positivos
    const positiveIntegers = numbers.filter(
        n => Number.isInteger(n) && n > 0
    );

    if (positiveIntegers.length === 0) return [];

    const max         = Math.max(...positiveIntegers);
    const factorialSet = buildFactorialSet(max);

    const result = positiveIntegers.filter(n => factorialSet.has(n));

    // Sin duplicados (por si acaso)
    return [...new Set(result)];
}

/**
 * Construye un Set con todos los valores factoriales desde 1! hasta
 * superar `limit` (o hasta que el factorial deje de ser finito).
 *
 * @param {number} limit
 * @returns {Set<number>}
 */
function buildFactorialSet(limit) {
    const set  = new Set();
    let fact   = 1;
    let i      = 1;

    while (fact <= limit && Number.isFinite(fact)) {
        set.add(fact);
        i++;
        fact *= i;
    }

    return set;
}