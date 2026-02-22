
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'none';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'JOKER';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isWild: boolean;
  color: 'red' | 'black';
}

export type GameStatus = 'waiting' | 'playing' | 'suit-selection' | 'game-over';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHand: Card[];
  aiHand: Card[];
  currentTurn: 'player' | 'ai';
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  currentSuit: Suit; // The suit to match (changes when wild card is played)
}
