export function formatPrice(price: number): string {
  // Format as "X.XXX DT" with 3 decimal places
  // Assuming price is stored as normal number (e.g. 4299.5 for 4 299.500 DT)
  const parts = price.toFixed(3).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${integerPart}.${parts[1]} DT`;
}
