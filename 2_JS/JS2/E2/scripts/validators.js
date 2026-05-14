/**
 * Valida la extensión del archivo
 */
export const validateFileType = (file) => {
    return file && file.name.toLowerCase().endsWith('.txt');
};

/**
 * Lógica central: verifica si el primer y último dígito coinciden
 */
export const isSymmetricNumber = (numStr) => {
    const cleanNum = numStr.trim();
    if (!cleanNum || isNaN(cleanNum)) return false;
    // Comparación del primer carácter con el último
    return cleanNum[0] === cleanNum[cleanNum.length - 1];
};

/**
 * Retorna fecha en formato DD/MM/AA
 */
export const getFormattedDate = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
};