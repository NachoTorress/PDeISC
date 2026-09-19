export function calculateAgeFromDate(isoDate) {
  const birthDate = new Date(`${isoDate}T00:00:00`);
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

export function isValidBirthDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) {
    return false;
  }

  const birthDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const age = calculateAgeFromDate(isoDate);
  return age >= 0 && age <= 120 && birthDate <= new Date();
}

