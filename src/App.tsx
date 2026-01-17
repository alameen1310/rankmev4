import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { GameStateProvider } from "@/contexts/GameStateContext";
import { AchievementProvider } from "@/components/gamification/AchievementPopup";
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
import { Themes } from "./pages/Themes";
import { Gamification } from "./pages/Gamification";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { PublicProfile } from "./pages/PublicProfile";
import AdminQuestions from "./pages/AdminQuestions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddQuestion from "./pages/admin/AddQuestion";
import ManageQuestions from "./pages/admin/ManageQuestions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import UserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <PremiumProvider>
        <AuthProvider>
          <GameStateProvider>
            <QuizProvider>
              <AchievementProvider>
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
                      <Route path="/themes" element={<Themes />} />
                      <Route path="/gamification" element={<Gamification />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/user/:userId" element={<PublicProfile />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/questions" element={<AdminQuestions />} />
                      <Route path="/admin/add-question" element={<AddQuestion />} />
                      <Route path="/admin/manage" element={<ManageQuestions />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                      <Route path="/admin/analytics" element={<AdminAnalytics />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
                </TooltipProvider>
              </AchievementProvider>
            </QuizProvider>
          </GameStateProvider>
        </AuthProvider>
      </PremiumProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
