import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import GameCanvas from "@/components/GameCanvas";

export default function Crossword() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <GameCanvas />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
