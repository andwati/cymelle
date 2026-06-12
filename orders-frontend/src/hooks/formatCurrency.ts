export function formatCurrency(amount: number, currency = "KES") {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}