import { FIGURES } from '../engine/types';

export type TutorialStep = {
  title: string;
  body: string;
  /** Figura(s) o elemento destacado en el paso (opcional para futura iconografía). */
  highlight?: string[];
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bienvenido a Mitología',
    body: 'Un juego de estrategia, apuestas y deducción. Tu objetivo: maximizar las combinaciones de tus 3 figuras secretas en un tablero compartido. Las reglas son contraintuitivas, así que pon atención.',
  },
  {
    title: 'Las 5 figuras',
    body: 'Existen 5 figuras mitológicas: Dragón, Hydra, Fénix, Kraken y Minotauro. Hay 6 cartas de cada una (30 cartas en total) y 4 fichas de cada en cada tómbola.',
    highlight: FIGURES,
  },
  {
    title: 'Tu combinación secreta',
    body: 'Al inicio recibes 3 cartas. Tú decides el orden, por ejemplo Dragón → Hydra → Kraken. Esa combinación se mantiene secreta y es lo que sumarás al final.',
  },
  {
    title: 'Tu condición secreta',
    body: 'Además, eliges una condición como "Dragones > Hydras". Si se cumple en el tablero final, tu puntaje se multiplica por 2. Si no, no hay penalización.',
  },
  {
    title: 'Carta revelada',
    body: 'Elegirás una de tus 3 cartas para mostrarla en público durante toda la partida. Los demás verán parte de tu juego — y tú parte del suyo. Úsalo para deducir.',
  },
  {
    title: 'Cada ronda: 4+4 fichas',
    body: 'El sistema saca 4 fichas de la Tómbola A y 4 de la B. Todos las ven. Esas son las fichas que potencialmente entrarán al tablero esta ronda.',
  },
  {
    title: 'La regla CONTRAINTUITIVA de apuestas',
    body: 'Apuestas en secreto a una tómbola (1 a 10 monedas). PERO gana la tómbola con MENOR cantidad total apostada. No quieres seguir al rebaño — quieres adivinar dónde NO van los demás.',
  },
  {
    title: 'Las monedas siempre se pierden',
    body: 'Aunque no ganes, tus monedas apostadas se gastan. Empiezas con 30 monedas y debes durar 5 rondas. Administra bien.',
  },
  {
    title: 'Selección de posición',
    body: 'Al apostar también eliges en qué 4 columnas (y en qué orden) colocarías tus 4 fichas si ganas. Las fichas caen por gravedad como Connect Four y deben tocar al menos una ficha previa (excepto en la ronda 1).',
  },
  {
    title: 'Resolución de la ronda',
    body: 'Gana la tómbola con menor total. Dentro de ella, gana el jugador con mayor apuesta individual. Empates → ronda anulada y monedas devueltas. Las 4 fichas de la tómbola perdedora se eliminan.',
  },
  {
    title: 'Puntaje final',
    body: 'Tras 5 rondas se cuentan todas las apariciones contiguas de tu combinación (directa o inversa) en filas, columnas y diagonales. Cada coincidencia = 1 punto. Una misma línea puede tener varias. Si tu condición se cumple, ×2.',
  },
  {
    title: '¡A jugar!',
    body: 'Recuerda: la información es poder. Lee las cartas reveladas, observa los patrones, anticipa lo que los demás apostarán y sé contraintuitivo.',
  },
];
