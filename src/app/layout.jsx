import { Geist, Geist_Mono } from "next/font/google"
import Navbar from "@/components/landing/Navbar";
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "TrustLayer",
  description: "Decentralized trust layer for unregulated marketplaces",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
       <Navbar />
        {children}
      </body>
    </html>
  )
}