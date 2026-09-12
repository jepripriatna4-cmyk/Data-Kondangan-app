/**
 * Indonesian Rupiah and Date Formatting Helpers
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

/**
 * Formats a raw number or string to formatted Rupiah preview:
 * "100000" -> "Rp 100.000"
 */
export function formatRupiahInputValue(raw: string | number): string {
  if (raw === '' || raw === null || raw === undefined) return '';
  const cleanStr = String(raw).replace(/\D/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  return 'Rp ' + num.toLocaleString('id-ID');
}

/**
 * Parses user input back into raw integer number:
 * "Rp 100.000" -> 100000
 */
export function parseRupiahInput(raw: string): number {
  if (!raw) return 0;
  const cleanStr = raw.replace(/\D/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}
