import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const finalLocale = locale || 'en';
  
  // Load base messages
  const baseMessages = (await import(`../messages/${finalLocale}.json`)).default;
  
  // Load auction messages (fallback to en if not found, though we created both)
  let auctionMessages = {};
  try {
    auctionMessages = (await import(`../messages/auctions/${finalLocale}.json`)).default;
  } catch (e) {
    auctionMessages = (await import(`../messages/auctions/en.json`)).default;
  }

  return {
    locale: finalLocale,
    messages: {
      ...baseMessages,
      ...auctionMessages
    },
  };
});
