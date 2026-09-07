export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'unknown date';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown date';
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};
