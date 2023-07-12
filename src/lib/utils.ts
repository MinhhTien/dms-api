export const addDays = (date: Date, days: number) => {
  const result = new Date(date.valueOf());
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date: Date, days: number) => {
  const result = new Date(date.valueOf());
  result.setDate(result.getDate() - days);
  return result;
};

