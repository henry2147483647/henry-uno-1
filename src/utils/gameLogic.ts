import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];

  // Standard 52 cards
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        isWild: rank === '8', // Traditional Crazy Eights rule: 8 is wild
        color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
      });
    });
  });

  // Add 2 Jokers (as requested "万能大小王")
  deck.push({
    id: 'joker-black',
    suit: 'none',
    rank: 'JOKER',
    isWild: true,
    color: 'black',
  });
  deck.push({
    id: 'joker-red',
    suit: 'none',
    rank: 'JOKER',
    isWild: true,
    color: 'red',
  });

  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const canPlayCard = (card: Card, topCard: Card, currentSuit: Suit): boolean => {
  if (card.isWild) return true;
  if (card.suit === currentSuit) return true;
  if (card.rank === topCard.rank && card.rank !== 'JOKER') return true;
  return false;
};
