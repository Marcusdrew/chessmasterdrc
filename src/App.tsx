import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SensationsProvider } from "@/contexts/SensationsContext";
import Menu from "./pages/Menu";
import PlayConfig from "./pages/PlayConfig";
import Game from "./pages/Game";
import RevolutionaryGame from "./pages/RevolutionaryGame";
import Techniques from "./pages/Techniques";
import Apprendre from "./pages/Apprendre";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SensationsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/play" element={<PlayConfig />} />
            <Route path="/game" element={<Game />} />
            <Route path="/revolutionary-game" element={<RevolutionaryGame />} />
            <Route path="/techniques" element={<Techniques />} />
            <Route path="/apprendre" element={<Apprendre />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SensationsProvider>
  </QueryClientProvider>
);

export default App;
