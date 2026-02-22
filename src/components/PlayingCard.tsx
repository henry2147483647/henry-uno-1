import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, Suit } from '../types';
import { Heart, Diamond, Club, Spade, Zap } from 'lucide-react';

interface PlayingCardProps {
  card: CardType;
  onClick?: () => void;
  isFaceDown?: boolean;
  className?: string;
  disabled?: boolean;
}

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={`fill-current ${className}`} />;
    case 'diamonds': return <Diamond className={`fill-current ${className}`} />;
    case 'clubs': return <Club className={`fill-current ${className}`} />;
    case 'spades': return <Spade className={`fill-current ${className}`} />;
    default: return <Zap className={`fill-current ${className}`} />;
  }
};

export const PlayingCard: React.FC<PlayingCardProps> = ({ 
  card, 
  onClick, 
  isFaceDown = false, 
  className = "",
  disabled = false
}) => {
  const isRed = card.color === 'red';

  if (isFaceDown) {
    return (
      <motion.div
        layoutId={card.id}
        className={`relative w-24 h-36 sm:w-32 sm:h-48 rounded-xl border-4 border-white bg-blue-800 card-shadow flex items-center justify-center overflow-hidden ${className}`}
        whileHover={!disabled ? { y: -10 } : {}}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="w-16 h-24 sm:w-20 sm:h-32 border-2 border-white/30 rounded-lg flex items-center justify-center">
          <div className="text-white/20 font-bold text-4xl">T</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      onClick={!disabled ? onClick : undefined}
      className={`relative w-24 h-36 sm:w-32 sm:h-48 rounded-xl bg-white text-black card-shadow flex flex-col p-2 sm:p-3 cursor-pointer select-none border border-gray-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      whileHover={!disabled ? { y: -20, scale: 1.05, zIndex: 50 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`flex flex-col items-center self-start ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <span className="text-lg sm:text-2xl font-bold leading-none">{card.rank === 'JOKER' ? 'JK' : card.rank}</span>
        <SuitIcon suit={card.suit} className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        {card.rank === 'JOKER' ? (
          <Zap className={`w-12 h-12 sm:w-16 sm:h-16 ${isRed ? 'text-red-500' : 'text-gray-800'}`} />
        ) : (
          <SuitIcon suit={card.suit} className={`w-12 h-12 sm:w-16 sm:h-16 ${isRed ? 'text-red-500' : 'text-gray-800'} opacity-20`} />
        )}
      </div>

      <div className={`flex flex-col items-center self-end rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <span className="text-lg sm:text-2xl font-bold leading-none">{card.rank === 'JOKER' ? 'JK' : card.rank}</span>
        <SuitIcon suit={card.suit} className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    </motion.div>
  );
};
