
export const CURRENCIES = {
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: {
      ko: '대한민국 원',
      en: 'South Korean Won',
    },
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: {
      ko: '미국 달러',
      en: 'US Dollar',
    },
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
