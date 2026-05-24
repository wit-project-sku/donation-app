export function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

export function formatWon(amount: number): string {
  return `${formatCurrency(amount)} 원`;
}
