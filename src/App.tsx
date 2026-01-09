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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/quizzes" element={<QuizList />} />

            {/* General Protected Routes (Login required) */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizEntry /></ProtectedRoute>} />
            <Route path="/quiz/:quizId/play" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
            <Route path="/quiz/:quizId/result" element={<ProtectedRoute><QuizResult /></ProtectedRoute>} />

            {/* Teacher Only Protected Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requireTeacher><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/create" element={<ProtectedRoute requireTeacher><CreateQuiz /></ProtectedRoute>} />
            <Route path="/admin/edit/:quizId" element={<ProtectedRoute requireTeacher><CreateQuiz /></ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute requireTeacher><ManageQuizzes /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
