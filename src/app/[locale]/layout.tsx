import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { QueryProvider }  from "@/components/providers/QueryProvider"
import { MSWProvider }    from "@/components/providers/MSWProvider"
import { ErrorBoundary }  from "@/components/providers/ErrorBoundary"
import "../globals.css"

export const metadata: Metadata = {
  title: "Pinnlo — Social Media Management",
  description: "Social media management for Southeast Asia agencies",
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MSWProvider>
            <QueryProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </QueryProvider>
          </MSWProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}