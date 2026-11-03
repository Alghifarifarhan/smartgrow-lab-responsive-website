import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Smart Grow Lab",
  description: "Smart Grow Laboratory - Integrated research and innovation hub",
  icons: {
    icon: "/assets/img/logo_white.png",
  },
};

const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('site_theme');
    if (raw) {
      var t = JSON.parse(raw);
      var r = document.documentElement;
      if (t.primary) r.style.setProperty('--primary', t.primary);
      if (t.darkBg) r.style.setProperty('--bg-dark', t.darkBg);
      if (t.lightBg) r.style.setProperty('--bg-light', t.lightBg);
      if (t.textDark) r.style.setProperty('--text-dark', t.textDark);
      if (t.textMedium) r.style.setProperty('--text-medium', t.textMedium);
      if (t.textLight) r.style.setProperty('--text-light', t.textLight);
    }
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
