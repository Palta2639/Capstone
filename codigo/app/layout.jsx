import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar1 from "../components/Navbar1";
import Footer from "../components/Footer"; // Revisa que la ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Anglo Electric",
  description: "Plataforma de e-commerce e instalaciones de energía solar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar1 />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}