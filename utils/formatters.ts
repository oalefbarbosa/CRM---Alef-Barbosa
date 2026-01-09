
export const formatCurrency = (value: number): string => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatNumber = (value: number): string => 
  new Intl.NumberFormat('pt-BR').format(value || 0);

export const formatPercent = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
        return '0.00%';
    }
    return `${(value || 0).toFixed(2)}%`;
}

export const formatDate = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const formatDateSimple = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatDateForPickerButton = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00'); // Ensure correct parsing
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

/**
 * Converts a Date object to a 'YYYY-MM-DD' string in the local timezone.
 * Avoids timezone issues that occur with date.toISOString().
 * @param date The date to format.
 * @returns The formatted date string or an empty string if the date is invalid.
 */
export const toYYYYMMDD = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};