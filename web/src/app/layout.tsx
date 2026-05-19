import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientBackground } from "@/components/ambient-background";
import { SideNav } from "@/components/side-nav";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingOverlay } from "@/components/onboarding-overlay";
import { preferencesFileExists } from "@/lib/preferences";
import { UnsavedChangesProvider } from "@/components/unsaved-changes";

export const metadata: Metadata = {
  title: "Careerbot",
  description: "Glassy dashboard over the Careerbot local markdown",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const showOnboarding = !(await preferencesFileExists());

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen text-zinc-900 dark:text-zinc-50 md:h-screen md:overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AmbientBackground />
          <UnsavedChangesProvider>
            <div className="flex min-h-screen flex-col md:h-screen md:min-h-0 md:flex-row">
              <SideNav />
              <main className="min-w-0 flex-1 md:flex md:flex-col md:overflow-hidden">
                {children}
              </main>
            </div>
          </UnsavedChangesProvider>
          <Toaster position="top-center" />
          <OnboardingOverlay initiallyOpen={showOnboarding} />
        </ThemeProvider>
      </body>
    </html>
  );
}
