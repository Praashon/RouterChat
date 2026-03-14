"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { ChatArea } from "@/components/chat/ChatArea"
import { WelcomeModal } from "@/components/settings/WelcomeModal"
import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Hydration fix for Zustand and next-themes to prevent mismatch
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!mounted) {
    return <div className="h-screen w-full bg-background fixed inset-0 z-50 pointer-events-none" />
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-zinc-200 dark:selection:bg-zinc-800 font-sans">
      <WelcomeModal />
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] border-border/40 shadow-2xl">
            <Sidebar isMobile />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 bg-background">
        <Header toggleSidebar={isMobile ? () => setMobileMenuOpen(true) : undefined} />
        <ChatArea />
      </div>
    </div>
  )
}
