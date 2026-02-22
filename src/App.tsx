import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayingCard } from './components/PlayingCard';
import { Card, GameState, Suit, GameStatus } from './types';
import { createDeck, canPlayCard, shuffle } from './utils/gameLogic';
import { Heart, Diamond, Club, Spade, RotateCcw, Trophy, User, Cpu, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    currentSuit: 'none',
  });

  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [message, setMessage] = useState<string>("Welcome to Crazy Eights!");

  // Initialize game
  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Find a non-wild card for the start of the discard pile
    let firstCardIndex = fullDeck.findIndex(c => !c.isWild);
    if (firstCardIndex === -1) firstCardIndex = 0;
    const firstCard = fullDeck.splice(firstCardIndex, 1)[0];

    setState({
      deck: fullDeck,
      discardPile: [firstCard],
      playerHand,
      aiHand,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      currentSuit: firstCard.suit,
    });
    setPendingWildCard(null);
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWin = (hand: Card[], turn: 'player' | 'ai') => {
    if (hand.length === 0) {
      setState(prev => ({
        ...prev,
        status: 'game-over',
        winner: turn,
      }));
      if (turn === 'player') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      return true;
    }
    return false;
  };

  const handleDrawCard = () => {
    if (state.status !== 'playing' || state.currentTurn !== 'player') return;

    if (state.deck.length === 0) {
      if (state.discardPile.length > 1) {
        // Reshuffle discard pile into deck
        const topCard = state.discardPile[state.discardPile.length - 1];
        const newDeck = shuffle(state.discardPile.slice(0, -1));
        setState(prev => ({
          ...prev,
          deck: newDeck,
          discardPile: [topCard],
        }));
        setMessage("Deck reshuffled! Draw a card.");
      } else {
        setMessage("No cards left to draw! Turn skipped.");
        setTimeout(() => nextTurn('ai'), 1000);
      }
      return;
    }

    const newDeck = [...state.deck];
    const drawnCard = newDeck.pop()!;
    
    setState(prev => ({
      ...prev,
      deck: newDeck,
      playerHand: [...prev.playerHand, drawnCard],
    }));

    setMessage("You drew a card.");
    
    // Check if the drawn card can be played immediately
    const topCard = state.discardPile[state.discardPile.length - 1];
    if (!canPlayCard(drawnCard, topCard, state.currentSuit)) {
      setTimeout(() => nextTurn('ai'), 1000);
    }
  };

  const playCard = (card: Card, isPlayer: boolean) => {
    const topCard = state.discardPile[state.discardPile.length - 1];
    
    if (!canPlayCard(card, topCard, state.currentSuit)) {
      if (isPlayer) setMessage("Cannot play that card!");
      return;
    }

    if (card.isWild) {
      if (isPlayer) {
        setPendingWildCard(card);
        setState(prev => ({ ...prev, status: 'suit-selection' }));
      } else {
        // AI plays wild card
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        executePlay(card, randomSuit, false);
      }
    } else {
      executePlay(card, card.suit, isPlayer);
    }
  };

  const executePlay = (card: Card, newSuit: Suit, isPlayer: boolean) => {
    setState(prev => {
      const hand = isPlayer ? prev.playerHand : prev.aiHand;
      const newHand = hand.filter(c => c.id !== card.id);
      
      const newState = {
        ...prev,
        discardPile: [...prev.discardPile, card],
        [isPlayer ? 'playerHand' : 'aiHand']: newHand,
        currentSuit: newSuit,
        status: 'playing' as GameStatus,
      };

      if (checkWin(newHand, isPlayer ? 'player' : 'ai')) {
        return newState;
      }

      return newState;
    });

    setPendingWildCard(null);
    if (state.status !== 'game-over') {
      nextTurn(isPlayer ? 'ai' : 'player');
    }
  };

  const nextTurn = (next: 'player' | 'ai') => {
    setState(prev => ({ ...prev, currentTurn: next }));
    if (next === 'ai') {
      setMessage("AI is thinking...");
    } else {
      setMessage("Your turn!");
    }
  };

  // AI Logic
  useEffect(() => {
    if (state.currentTurn === 'ai' && state.status === 'playing') {
      const timer = setTimeout(() => {
        const topCard = state.discardPile[state.discardPile.length - 1];
        const playableCards = state.aiHand.filter(c => canPlayCard(c, topCard, state.currentSuit));

        if (playableCards.length > 0) {
          // AI strategy: play non-wild cards first
          const normalCards = playableCards.filter(c => !c.isWild);
          const cardToPlay = normalCards.length > 0 
            ? normalCards[Math.floor(Math.random() * normalCards.length)]
            : playableCards[0];
          
          playCard(cardToPlay, false);
        } else {
          // AI needs to draw
          if (state.deck.length > 0) {
            const newDeck = [...state.deck];
            const drawnCard = newDeck.pop()!;
            setState(prev => ({
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
            }));
            setMessage("AI drew a card.");
            
            // Check if AI can play the drawn card
            if (canPlayCard(drawnCard, topCard, state.currentSuit)) {
              setTimeout(() => playCard(drawnCard, false), 1000);
            } else {
              nextTurn('player');
            }
          } else {
            setMessage("AI has no cards to draw and skips turn.");
            nextTurn('player');
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.currentTurn, state.status, state.aiHand, state.discardPile, state.currentSuit, state.deck]);

  const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
    switch (suit) {
      case 'hearts': return <Heart className={`fill-red-500 text-red-500 ${className}`} />;
      case 'diamonds': return <Diamond className={`fill-red-500 text-red-500 ${className}`} />;
      case 'clubs': return <Club className={`fill-gray-800 text-gray-800 ${className}`} />;
      case 'spades': return <Spade className={`fill-gray-800 text-gray-800 ${className}`} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 bg-[#064e3b] overflow-hidden font-sans">
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10">
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span className="font-display font-bold text-sm uppercase tracking-wider">AI Opponent</span>
          <div className="flex gap-1">
            {Array.from({ length: state.aiHand.length }).map((_, i) => (
              <div key={i} className="w-2 h-3 bg-white/40 rounded-sm" />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tighter text-white drop-shadow-lg">
            CRAZY <span className="text-emerald-400">EIGHTS</span>
          </h1>
          <p className="text-xs text-white/60 font-medium uppercase tracking-[0.2em]">{message}</p>
        </div>

        <button 
          onClick={initGame}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Game Board */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative">
        {/* AI Hand Area */}
        <div className="absolute top-0 w-full flex justify-center -translate-y-12">
          <div className="flex -space-x-12 sm:-space-x-16">
            <AnimatePresence>
              {state.aiHand.map((card, index) => (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  isFaceDown 
                  className="scale-75 sm:scale-90"
                  disabled
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Table */}
        <div className="flex items-center gap-8 sm:gap-16 z-0">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div 
              onClick={handleDrawCard}
              className={`relative cursor-pointer transition-transform hover:scale-105 active:scale-95 ${state.currentTurn !== 'player' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-xl bg-blue-900 border-4 border-white card-shadow flex items-center justify-center overflow-hidden">
                <div className="text-white/20 font-bold text-6xl">?</div>
                {state.deck.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                    {state.deck.length}
                  </div>
                )}
              </div>
              {/* Stack effect */}
              <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl bg-blue-950 border-4 border-white/50 -z-10" />
              <div className="absolute -bottom-2 -right-2 w-full h-full rounded-xl bg-blue-950 border-4 border-white/30 -z-20" />
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {state.discardPile.length > 0 && (
                <PlayingCard 
                  key={state.discardPile[state.discardPile.length - 1].id}
                  card={state.discardPile[state.discardPile.length - 1]} 
                  disabled
                />
              )}
            </AnimatePresence>
            
            {/* Current Suit Indicator */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Match:</span>
              <SuitIcon suit={state.currentSuit} className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Player Hand Area */}
        <div className="absolute bottom-0 w-full flex justify-center translate-y-12">
          <div className="flex -space-x-12 sm:-space-x-16 pb-12">
            <AnimatePresence>
              {state.playerHand.map((card, index) => (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  onClick={() => playCard(card, true)}
                  disabled={state.currentTurn !== 'player' || state.status !== 'playing'}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10">
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <User className="w-5 h-5 text-blue-400" />
          <span className="font-display font-bold text-sm uppercase tracking-wider">You</span>
          <span className="text-emerald-400 font-bold">{state.playerHand.length} Cards</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
            <Info className="w-4 h-4" />
            <span>8s & Jokers are Wild</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {state.status === 'suit-selection' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
            >
              <h2 className="text-3xl font-display font-bold mb-2">Wild Card!</h2>
              <p className="text-zinc-400 mb-8">Choose the next suit to match</p>
              
              <div className="grid grid-cols-2 gap-4">
                {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit) => (
                  <button
                    key={suit}
                    onClick={() => pendingWildCard && executePlay(pendingWildCard, suit, true)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <SuitIcon suit={suit} className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {state.status === 'game-over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex p-6 rounded-full bg-emerald-500/20 mb-6 border border-emerald-500/30">
                <Trophy className={`w-20 h-20 ${state.winner === 'player' ? 'text-yellow-400' : 'text-zinc-500'}`} />
              </div>
              <h2 className="text-6xl font-display font-bold mb-4 tracking-tighter">
                {state.winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-xl text-white/60 mb-12 max-w-md mx-auto">
                {state.winner === 'player' 
                  ? "Incredible strategy! You've cleared your hand and won the game." 
                  : "The AI outplayed you this time. Ready for a rematch?"}
              </p>
              <button
                onClick={initGame}
                className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xl rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
              >
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
