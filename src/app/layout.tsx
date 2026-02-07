"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import Navbar from "@/components/Navbar/Navbar";
// import { AIChatWidget } from '@/components/ui/AIChatWidget';
import { ToastProvider } from "@/components/ui/use-toast"; // Importar o provedor de toast
import { Toaster } from "@/components/ui/toaster";     // Importar o componente Toaster
import { usePathname } from "next/navigation"; // Importar usePathname

const inter = Inter({ subsets: ["latin"] });

// Metadata agora precisa ser exportada como uma constante e não pode ser diretamente usada com "use client"
// Para contornar, podemos remover o "type" do import se a Metadata não for estritamente necessária no lado do cliente
// ou definir a Metadata em um arquivo separado ou diretamente no page.tsx
// export const metadata: Metadata = {
//   title: "CriptoPlay",
//   description: "Aprenda, simule e gerencie suas finanças em um só lugar.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNavbar = pathname !== '/resgatar-bonus';

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
                {showNavbar && <Navbar />} {/* Renderização condicional */}
                {children}
                {/* <AIChatWidget /> */}
                <Toaster /> {/* Adicionar o componente Toaster aqui */}
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
