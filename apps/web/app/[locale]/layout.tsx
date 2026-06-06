import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { NotificationListener } from '@/components/notification-listener';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title'),
      template: `%s | GBay`,
    },
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'de-DE': '/de',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'de_DE',
      url: baseUrl,
      siteName: 'GBay',
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages();
  
  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster />
          <NotificationListener />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
