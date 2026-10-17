import type { Metadata } from "next";import "./globals.css";
export const metadata:Metadata={title:"BusLink · Navi Mumbai bus pilot",description:"Track Navi Mumbai pilot buses through voluntary rider reports, saved routes and stop patterns.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
