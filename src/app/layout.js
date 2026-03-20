// app/layout.js
import { Inter } from "next/font/google"; // Cambiamos Geist por Inter
import "./globals.css";

// Configuramos Inter como fuente principal
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Grosores típicos
  display: "swap",
  variable: "--font-inter", // Variable CSS opcional
});

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}