export function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

export function formatWon(amount: number): string {
  return `${formatCurrency(amount)} 원`;
}

export function formatDonationDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const KIOSK_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Header date label like "2025-09-13(Mon)". */
export function formatKioskDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}(${KIOSK_WEEKDAYS[date.getDay()]})`;
}
