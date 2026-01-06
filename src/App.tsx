import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Leaderboard } from "./pages/Leaderboard";
import { Quiz } from "./pages/Quiz";
import { Profile } from "./pages/Profile";
import { PvPLobby } from "./pages/PvPLobby";
import { BattleScreen } from "./pages/BattleScreen";
import { Friends } from "./pages/Friends";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/quiz/:subject" element={<Quiz />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/pvp" element={<PvPLobby />} />
                  <Route path="/battle/:battleId" element={<BattleScreen />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <SpeedInsights />
          </TooltipProvider>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
