/**
 * آدرس پایهٔ بک‌اند Nest (بدون اسلش انتهایی).
 * با متغیر محیطی `NEXT_PUBLIC_API_URL` قابل بازنویسی است.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://cp-api.tashrifat-golestan.ir/'
).replace(/\/+$/, '');
