import 'dotenv/config.js';
import Game from "./server/classes/Game.js";
import { getCardName } from './server/lib/card_map.js';

function rateStats(stats, average) {

  console.log(stats);

  console.log(average);

  const { winRate, deckCount } = stats;

  if (deckCount < (0.1 * average)) return "Unplayed";

  if (winRate >= 0.4 && winRate < 0.6 && deckCount >= (.5 * average) && deckCount < (1.5 * average)) return "Average";

  if (winRate >= 0.4 && winRate < 0.6 && deckCount < (.5 * average)) return "Low Play Rate with Average Strength";

  if (winRate >= 0.4 && winRate < 0.6 && deckCount >= (1.5 * average)) return "High Play Rate with Average Strength";

  if (winRate >= 0.3 && winRate < 0.4) return "Redeemable";

  if (winRate < 0.3) return "Trash";

  if (winRate >= 0.6 && deckCount < (0.5 * average)) return "Sleeper or Niche Power Picks";

  if (winRate >= 0.6 && deckCount < (1.25 * average)) return "Standard Power Picks";

  if (winRate >= 0.6 && deckCount >= (1.25 * average)) return "Meta Dominating Power Picks";

  return "outlier";

}

const numeric_cards = {};
function getCommonId(cardId) {
  // const strippedId = cardId.replace("*", "");
  if (cardId.includes("_") && !numeric_cards[cardId]) {
    const updatedName = getCardName(cardId);
    console.log('HERE', cardId, cardId, updatedName);
    if (cardId !== updatedName) return updatedName;
    else {
      numeric_cards[cardId] = true;
      return cardId;
    }
  }
  else return cardId;
}

const games = {
  fellowship: await Game.loadAll({ format: "FellowshipBlock(PC)", since: 0 }),
  movie: await Game.loadAll({ format: "MovieBlock(PC)", since: 0 }),
  expanded: await Game.loadAll({ format: "Expanded(PC)", since: 0 })
};

console.log(games);

const cardStats = {
  cards: {},
  fellowshipCards: {
    uniqueDrawDeckCards: 0,
    totalDrawDeckCards: 0,
    totalDrawDeckCardAppearances: 0,
    sites: 9 * games.fellowship.length,
    rating: {}
  },
  fellowshipGames: games.fellowship.length,
  movieCards: {
    uniqueDrawDeckCards: 0,
    totalDrawDeckCards: 0,
    totalDrawDeckCardAppearances: 0,
    sites: 9 * games.movie.length,
    rating: {}
  },
  movieGames: games.movie.length,
  expandedCards: {
    uniqueDrawDeckCards: 0,
    totalDrawDeckCards: 0,
    totalDrawDeckCardAppearances: 0,
    sites: 9 * games.expanded.length,
    rating: {}
  },
  expandedGames: games.expanded.length
};

const pcFormats = [ "fellowship", "movie", "expanded" ];

for (const format of pcFormats) {
  for (const game of games[`${format}`]) {

    for (const deck of game.decks) {
      const win = deck.won;

      // TODO add types for ring, ring bearer, and starting fellowship as well.

      // TODO add a card name lookup for each card.

      for (const cardId of deck.adventureDeck) {
        const commonId = getCommonId(cardId);

        if (!cardStats.cards[commonId]) cardStats.cards[commonId] = {
          type: "site",
          format: {}
        };

        if (!cardStats.cards[commonId].format[format]) {
          cardStats.cards[commonId].format[format] = {
            deckCount: 0,
            wins: 0,
            losses: 0
          };
        }

        cardStats.cards[commonId].format[format].deckCount++;

        if (win) cardStats.cards[commonId].format[format].wins++;
        else cardStats.cards[commonId].format[format].losses++;
      } // End adventure Deck loop

      for (const cardId in deck.drawDeck) {
        const commonId = getCommonId(cardId);
        if (!cardStats.cards[commonId]) {
          cardStats.cards[commonId] = {
            type: "drawDeck",
            format: {}
          };
        }

        if (!cardStats.cards[commonId].format[format]) {
          cardStats.cards[commonId].format[format] = {
            deckCount: 0,
            cardCount: 0,
            wins: 0,
            losses: 0
          };

          console.log(cardStats.cards[commonId]);
          cardStats[`${format}Cards`].uniqueDrawDeckCards++;
        }

        cardStats.cards[commonId].format[format].deckCount++;
        cardStats.cards[commonId].format[format].cardCount+= deck.drawDeck[cardId].inDeck;

        if (win) cardStats.cards[commonId].format[format].wins++;
        else cardStats.cards[commonId].format[format].losses++;

        cardStats[`${format}Cards`].totalDrawDeckCardAppearances++;
        cardStats[`${format}Cards`].totalDrawDeckCards+= deck.drawDeck[cardId].inDeck;
      } // End draw deck loop


    } // End deck loop
  } // End game loop
} // End format loop

const csvHeaders = [ "ID", "Type", "Fellowship Win Rate", "Fellowship Games Played", "Fellowship Rating", "Movie Win Rate", "Movie Games Played", "Movie Rating", "Expanded Win Rate", "Expanded Games Played", "Expanded Rating" ];

const csvRows = [];

for (const [ id, card ] of Object.entries(cardStats.cards)) {
  for (const format of pcFormats) {
    if (card.format[format]) {
      card.format[format].winRate = card.format[format].wins / card.format[format].deckCount;

      card.format[format].rating = rateStats(card.format[format], cardStats[`${format}Cards`].totalDrawDeckCardAppearances / cardStats[`${format}Cards`].uniqueDrawDeckCards);

      if (!cardStats[`${format}Cards`].rating[card.format[format].rating]) cardStats[`${format}Cards`].rating[card.format[format].rating] = 0;

      cardStats[`${format}Cards`].rating[card.format[format].rating]++;
    }
  }



  csvRows.push(
    `${id.replace(",", ":").replace("•", "")}, ${card.type},${card.format.fellowship?.winRate || ""},${card.format.fellowship?.deckCount || ""},${card.format.fellowship?.rating || "N/A"},${card.format.movie?.winRate || ""},${card.format.movie?.deckCount || ""},${card.format.movie?.rating || "N/A"},${card.format.expanded?.winRate || ""},${card.format.expanded?.deckCount || ""},${card.format.expanded?.rating || "N/A"}`);

  cardStats.cards[id] = card;
}

console.log(JSON.stringify(cardStats, null, 2));


const csvHeaderRow = csvHeaders.join(',');
const csv = `${csvHeaderRow}\n${csvRows.join('\n')}`;

console.log(csv);

console.log( numeric_cards);