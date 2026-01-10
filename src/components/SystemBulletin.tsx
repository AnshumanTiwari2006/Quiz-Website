import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SystemBulletin = () => {
    const [announcement, setAnnouncement] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "system", "announcements"), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                // Show if it's less than 24 hours old or different from last dismissed one
                const dismissedId = localStorage.getItem("dismissedAnnouncementId");
                const currentId = data.timestamp;

                if (dismissedId !== currentId) {
                    setAnnouncement(data);
                    setIsVisible(true);
                }
            }
        });

        return () => unsub();
    }, []);

    const dismissAnnouncement = () => {
        if (announcement) {
            localStorage.setItem("dismissedAnnouncementId", announcement.timestamp);
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && announcement && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary text-white overflow-hidden relative"
                >
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Megaphone className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white text-primary px-2 py-0.5 rounded-md">IMPORTANT NOTICE</span>
                                <p className="text-sm font-bold tracking-tight">{announcement.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={dismissAnnouncement}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SystemBulletin;
