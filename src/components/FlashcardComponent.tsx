import { useState } from "react";
import { Card } from "@/components/ui/card";

interface FlashcardProps {
  front: string;
  back: string;
}

const FlashcardComponent = ({ front, back }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-96 transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <Card 
          className={`absolute inset-0 backface-hidden rounded-3xl shadow-strong border-0 gradient-primary flex items-center justify-center p-8 ${
            isFlipped ? "invisible" : ""
          }`}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-4">{front}</p>
            <p className="text-white/80 text-sm">Click to flip</p>
          </div>
        </Card>

        {/* Back */}
        <Card 
          className={`absolute inset-0 backface-hidden rounded-3xl shadow-strong border-0 gradient-accent flex items-center justify-center p-8 rotate-y-180 ${
            !isFlipped ? "invisible" : ""
          }`}
        >
          <div className="text-center">
            <p className="text-2xl text-white">{back}</p>
            <p className="text-white/80 text-sm mt-4">Click to flip back</p>
          </div>
        </Card>
      </div>
      
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardComponent;
