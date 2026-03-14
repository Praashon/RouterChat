"use client"

import { ApiKeyModal } from "@/components/settings/ApiKeyModal"
import { ModelSelector } from "@/components/settings/ModelSelector"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, PanelLeftIcon } from "lucide-react"

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between px-4 backdrop-blur-xl shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-2">
        {toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden h-9 w-9 rounded-xl text-muted-foreground">
            <PanelLeftIcon className="w-4 h-4" />
          </Button>
        )}
        <ModelSelector />
      </div>

      <div className="flex items-center gap-3">
        <ApiKeyModal />
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 shadow-none border-border/40 transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
