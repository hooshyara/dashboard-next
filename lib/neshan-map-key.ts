/** کلید وب نقشه نشان (NEXT_PUBLIC_*). در پنل، سرویس «نقشه وب» را برای این کلید فعال کنید. */
export function getNeshanMapKey(): string {
  return (
    process.env.NEXT_PUBLIC_NESHAN_MAP_API_KEY ??
    process.env.NEXT_PUBLIC_NESHAN_API_KEY ??
    ''
  );
}
