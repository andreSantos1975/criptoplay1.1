import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import Navbar from "@/components/Navbar/Navbar";
import { AIChatWidget } from '@/components/ui/AIChatWidget';
import { ToastProvider } from "@/components/ui/use-toast.tsx"; // Importar o provedor de toast
import { Toaster } from "@/components/ui/toaster";     // Importar o componente Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CriptoPlay",
  description: "Aprenda, simule e gerencie suas finanças em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ToastProvider> {/* Envolver com ToastProvider */}
                <Navbar />
                {children}
                <AIChatWidget />
                <Toaster /> {/* Adicionar o componente Toaster aqui */}
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
