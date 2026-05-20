/**
 * آدرس پایهٔ بک‌اند Nest (بدون اسلش انتهایی).
 * با متغیر محیطی `NEXT_PUBLIC_API_URL` قابل بازنویسی است.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001'
).replace(/\/+$/, '');
