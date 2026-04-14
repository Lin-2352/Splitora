import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Splitora! Financial Dashboard",
  description: "Track your spending, manage funds, and discover ways to save.",
  icons: {
    icon: "/wallet-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script
          dangerouslySetInnerHTML={{
             __html: `
              try {
                if (localStorage.theme === 'light' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${plusJakartaSans.variable} font-sans antialiased selection:bg-app-purple selection:text-white relative bg-slate-950 light:bg-slate-50 text-slate-300 light:text-slate-600`}>
        {/* Ambient Global Glows */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          style={{ mixBlendMode: 'var(--glow-blend)' as any }}
        >
          <div 
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-app-cyan blur-[140px] rounded-full"
            style={{ opacity: 'var(--glow-opacity)' }}
          ></div>
          <div 
            className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-app-purple blur-[140px] rounded-full"
            style={{ opacity: 'var(--glow-opacity)' }}
          ></div>
        </div>
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
