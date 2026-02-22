export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}

export function formatNumber(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function formatCurrency(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  if (Math.abs(num) >= 1e12) {
    return `${(num / 1e12).toFixed(2)}조`;
  }
  if (Math.abs(num) >= 1e8) {
    return `${(num / 1e8).toFixed(0)}억`;
  }
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatShortDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
