import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireTeacher?: boolean;
    requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireTeacher = false, requireAdmin = false }: ProtectedRouteProps) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    const isAdminRole = ["admin", "moderator", "viewer"].includes(profile?.role || "");

    if (requireAdmin && !isAdminRole) {
        return <Navigate to="/quizzes" replace />;
    }

    // Admins, Moderators, and Viewers inherit all teacher permissions
    if (isAdminRole) {
        return <>{children}</>;
    }

    if (requireTeacher && profile?.role !== "teacher") {
        // If they are logged in but not a teacher, send them to quizzes
        return <Navigate to="/quizzes" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
