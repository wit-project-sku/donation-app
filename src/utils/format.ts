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
