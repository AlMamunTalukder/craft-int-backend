export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 1) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};
