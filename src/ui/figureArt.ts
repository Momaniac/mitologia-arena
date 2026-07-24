import type { Figure } from '../engine/types';

// Fichas del tablero (medallón circular, con transparencia).
import dragonTok from '../assets/tokens/dragon.png';
import hydraTok from '../assets/tokens/hydra.png';
import fenixTok from '../assets/tokens/fenix.png';
import krakenTok from '../assets/tokens/kraken.png';
import minotauroTok from '../assets/tokens/minotauro.png';

// Naipes (misma figura, versión con fondo negro).
import dragonCard from '../assets/cards/dragon.jpg';
import hydraCard from '../assets/cards/hydra.jpg';
import fenixCard from '../assets/cards/fenix.jpg';
import krakenCard from '../assets/cards/kraken.jpg';
import minotauroCard from '../assets/cards/minotauro.jpg';

/** Imagen de ficha (token) por figura. */
export const TOKEN_ART: Record<Figure, string> = {
  dragon: dragonTok,
  hydra: hydraTok,
  fenix: fenixTok,
  kraken: krakenTok,
  minotauro: minotauroTok,
};

/** Imagen de naipe (carta) por figura. */
export const CARD_ART: Record<Figure, string> = {
  dragon: dragonCard,
  hydra: hydraCard,
  fenix: fenixCard,
  kraken: krakenCard,
  minotauro: minotauroCard,
};
