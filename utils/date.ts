export function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function toUtcDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const formatDateRange = (date: Date) => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

export const addDays = (d: Date, deltaDays: number) => {
  const next = new Date(d);
  next.setDate(d.getDate() + deltaDays);
  return next;
};

export const getNext7Days = (startDate: Date) => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};



