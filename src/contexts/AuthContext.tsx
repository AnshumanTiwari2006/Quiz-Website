import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
    uid: string;
    email: string | null;
    role: "student" | "teacher" | "admin" | "moderator" | "viewer";
    name: string;
    subjects?: string[];
    classes?: string[];
    schoolClass?: string;
    isLocked?: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch additional profile info from Firestore
                const docRef = doc(db, "users", firebaseUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    // Master Admin Override
                    if (firebaseUser.email === "anshumantiwari2006@outlook.com") {
                        data.role = "admin";
                    }
                    setProfile(data);
                } else if (firebaseUser.email === "anshumantiwari2006@outlook.com") {
                    // Even if record doesn't exist in Firestore, hardcode the admin profile
                    setProfile({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: "admin",
                        name: "Master Admin",
                    });
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
