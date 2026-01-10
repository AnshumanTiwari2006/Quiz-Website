import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CreateQuiz from "./pages/CreateQuiz";
import ManageQuizzes from "./pages/ManageQuizzes";
import QuizList from "./pages/QuizList";
import QuizEntry from "./pages/QuizEntry";
import QuizPlay from "./pages/QuizPlay";
import QuizResult from "./pages/QuizResult";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { AuthProvider } from "./contexts/AuthContext";

import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import SystemBulletin from "./components/SystemBulletin";

import MasterDashboard from "./pages/MasterDashboard";
import ArenaJoin from "./pages/ArenaJoin";
import ArenaCreate from "./pages/ArenaCreate";
import ArenaLobby from "./pages/ArenaLobby";
import ArenaMatch from "./pages/ArenaMatch";
import ArenaResult from "./pages/ArenaResult";

import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import PageTransition from "./components/PageTransition";

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/quizzes" element={<PageTransition><QuizList /></PageTransition>} />

        {/* General Protected Routes (Login required) */}
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/quiz/:quizId" element={<ProtectedRoute><PageTransition><QuizEntry /></PageTransition></ProtectedRoute>} />
        <Route path="/quiz/:quizId/play" element={<ProtectedRoute><PageTransition><QuizPlay /></PageTransition></ProtectedRoute>} />
        <Route path="/quiz/:quizId/result" element={<ProtectedRoute><PageTransition><QuizResult /></PageTransition></ProtectedRoute>} />

        {/* Teacher Only Protected Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requireTeacher><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/create" element={<ProtectedRoute requireTeacher><PageTransition><CreateQuiz /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/edit/:quizId" element={<ProtectedRoute requireTeacher><PageTransition><CreateQuiz /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/quizzes" element={<ProtectedRoute requireTeacher><PageTransition><ManageQuizzes /></PageTransition></ProtectedRoute>} />

        {/* Admin Only Protected Routes */}
        <Route path="/admin/master-dashboard" element={<ProtectedRoute requireAdmin><PageTransition><MasterDashboard /></PageTransition></ProtectedRoute>} />

        {/* Arena Routes */}
        <Route path="/arena/join" element={<ProtectedRoute><PageTransition><ArenaJoin /></PageTransition></ProtectedRoute>} />
        <Route path="/arena/create" element={<ProtectedRoute><PageTransition><ArenaCreate /></PageTransition></ProtectedRoute>} />
        <Route path="/arena/:code/lobby" element={<ProtectedRoute><PageTransition><ArenaLobby /></PageTransition></ProtectedRoute>} />
        <Route path="/arena/:code/match" element={<ProtectedRoute><PageTransition><ArenaMatch /></PageTransition></ProtectedRoute>} />
        <Route path="/arena/:code/result" element={<ProtectedRoute><PageTransition><ArenaResult /></PageTransition></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SystemBulletin />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
