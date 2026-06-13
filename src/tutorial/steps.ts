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
    body: 'Bienvenido a Mitología, una dinámica en la que nunca tendrás la información completa. Es un juego de estrategia y deducción donde no gana quien más arriesga, sino quien mejor anticipa los movimientos de los demás y adapta su estrategia a un entorno que cambia constantemente. ¡Vamos a conocer las reglas!',
  },
  {
    title: 'Las figuras',
    body: 'Existen 5 figuras mitológicas: Dragón, Hydra, Fénix, Kraken y Minotauro.\n\nPor cada figura hay 6 cartas, para un total de 30 cartas. Al inicio elegirás 3 cartas aleatoriamente para definir tu combinación de juego.',
    highlight: FIGURES,
  },
  {
    title: 'Tu combinación',
    body: 'Decide el orden de tu combinación de cartas. Por ejemplo: Dragón > Hydra > Kraken.\n\nTu objetivo será lograr que ese patrón aparezca la mayor cantidad de veces en el tablero. Sumas 1 punto cada vez que tu combinación aparezca de forma horizontal, vertical o diagonal. También cuenta si aparece en orden invertido.\n\nAdemás de tu combinación, elegirás una de tus 3 cartas para mostrarla al resto de los jugadores. Los demás verán parte de tu juego y tú verás parte del suyo. Esa información parcial te servirá para tomar decisiones estratégicas.',
  },
  {
    title: 'Condición secreta',
    body: 'El sistema te asignará una condición secreta única. Ningún otro jugador tendrá la misma condición en esta partida.\n\nTu condición es un objetivo adicional que se evalúa al final del juego.\n\nLas condiciones comparan cuántas figuras de cada tipo hay en el tablero final. Si al terminar la partida el lado izquierdo de tu condición tiene más figuras que el lado derecho, tu condición se cumple y tu puntaje se multiplica x2.\n\nEjemplo:\nDragón > Hydra\nEsta condición se cumple si al final hay más Dragones que Hydras en el tablero.\n\nTambién existen condiciones combinadas, por ejemplo:\n(Dragón + Hydra) > (Minotauro + Fénix)\nEsta condición se cumple si la suma de Dragones e Hydras es mayor que la suma de Minotauros y Fénix.\n\nTu condición no será pública. Solo tú y el moderador podrán verla.',
  },
  {
    title: 'Mecánica de juego: monedas',
    body: 'Cada jugador cuenta con 30 monedas para usar durante las 5 rondas. Adminístralas bien.\n\nEl máximo de monedas que puedes usar por ronda se mantiene en 10 en esta demo por la contradicción pendiente entre el documento técnico base y el texto actualizado.\n\nLas monedas sirven para votar por una de las dos tómbolas disponibles en cada ronda. En caso de empate, las monedas de esa ronda se regresan y la ronda se repite.',
  },
  {
    title: 'Mecánica de juego: tómbolas',
    body: 'Habrá 2 tómbolas. Cada una contiene 4 fichas de cada figura, es decir, 20 fichas por tómbola.\n\nEl juego se juega a 5 rondas. En cada ronda se tomarán aleatoriamente 4 fichas de la tómbola A y 4 fichas de la tómbola B.\n\nLas fichas de una tómbola serán colocadas en el tablero y las fichas de la otra tómbola serán eliminadas del juego.\n\nLa tómbola ganadora será la que tenga menos votos, interpretado como menor cantidad total de monedas apostadas.',
  },
  {
    title: '¿Cómo se juega cada ronda?',
    body: 'En cada ronda se mostrarán las 4 fichas seleccionadas de la tómbola A y las 4 fichas seleccionadas de la tómbola B.\n\nDeberás elegir la tómbola en la que quieres poner tus monedas. Después, deberás definir cuántas monedas pondrás en esa tómbola.\n\nTambién deberás indicar cómo deseas acomodar las fichas de esa tómbola en caso de ganar la ronda.\n\nSi la tómbola que elegiste es la menos votada y tú eres quien más monedas puso en esa tómbola, ganas la ronda. Las fichas se colocarán en el tablero según el acomodo que indicaste, siempre que sea válido.\n\nEn ninguna ronda se revela quién ganó. Simplemente se colocan las fichas en el tablero.',
  },
  {
    title: 'Las fichas y el tablero',
    body: 'Después de elegir tómbola y definir cuántas monedas pondrás, deberás indicar cómo quieres colocar las 4 fichas en el tablero.\n\nLas fichas caen por gravedad, como en Conecta 4. Esto significa que no puedes colocarlas flotando en cualquier espacio: cada ficha cae hasta llegar al fondo del tablero o hasta apoyarse sobre otra ficha.\n\nEl acomodo debe cumplir tres reglas:\n1. Las 4 fichas deben formar un grupo conectado, como un “gusanito”.\n2. A partir de la segunda ronda, el grupo debe tocar al menos una ficha ya colocada en el tablero.\n3. No puede haber fichas flotantes.\n\nSi ganas la ronda, el tablero usará el acomodo válido que propusiste.',
  },
  {
    title: 'Puntaje final',
    body: 'Tras 5 rondas se cuentan todas las apariciones contiguas de tu combinación en el tablero.\n\nTu combinación puede aparecer en orden directo o invertido, y puede contar en filas, columnas o diagonales.\n\nCada coincidencia equivale a 1 punto. Una misma línea puede darte varios puntos si contiene varias apariciones válidas.\n\nAdicionalmente, si tu condición secreta se cumple, tu puntuación se duplicará.',
  },
  {
    title: 'Diviértete',
    body: '¡A jugar!\n\nRecuerda: la información es poder, pero no tienes toda la información. Analiza las cartas reveladas, observa los patrones, lee los comportamientos de los demás y anticípate a sus decisiones.\n\nActúa estratégicamente para influir, colaborar, gestionar tus recursos, establecer prioridades y tomar decisiones.',
  },
];
