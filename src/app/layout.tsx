import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/navbar";
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wangamoort Admin",
  description: "Admin panel for Wangamoort",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Toaster 
          position="top-right" 
          expand={false} 
          richColors 
          closeButton
          style={{
            zIndex: 9999,
          }}
          toastOptions={{
            style: {
              background: 'white',
              color: 'black',
            },
            className: 'my-toast-class',
          }}
        />
      </body>
    </html>
  );
}