export function generateOrderId() {
  const timestamp = Date.now()
    .toString()
    .slice(-8);

  const randomValue = Math.floor(
    1000 + Math.random() * 9000
  );

  return `GC${timestamp}${randomValue}`;
}