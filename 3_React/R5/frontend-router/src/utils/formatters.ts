export function calculateAge(isoDate: string): number | null {
  if (!isoDate) {
    return null;
  }

  const birthDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function formatDateDDMMYY(isoDate?: string | null): string {
  if (!isoDate) {
    return '-';
  }

  const cleanDate = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate.split(' ')[0];
  const dateObj = new Date(`${cleanDate}T00:00:00`);

  if (Number.isNaN(dateObj.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(dateObj);
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

