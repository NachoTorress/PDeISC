/**
 * Crea y descarga un archivo de texto plano
 * @param {string} content 
 * @param {string} fileName 
 */
export const downloadTXT = (content, fileName) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Filtra números que inician y terminan con el mismo dígito
 * @param {Array} numbers 
 */
export const processNumbers = (numbers) => {
    const valid = numbers.filter(n => {
        const s = Math.abs(n).toString();
        return s[0] === s[s.length - 1];
    }).sort((a, b) => a - b);

    const total = numbers.length;
    const countValid = valid.length;
    const countInvalid = total - countValid;
    const percentage = total > 0 ? ((countValid / total) * 100).toFixed(2) : 0;

    return {
        valid,
        stats: {
            total,
            countValid,
            countInvalid,
            percentage: `${percentage}%`
        }
    };
};