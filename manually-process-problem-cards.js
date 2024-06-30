import 'dotenv/config.js';

import { Parser } from '@json2csv/plainjs';

import Card from "./server/classes/Card.js";

// I didn't note this file when I wrote it, it doesn't currently seem to work. That's ok, we'll come back to it.

function getStats(card, format) {
  const formatWins = card.winResults?.format?.[format] || 0;
  const formatLoses = card.loseResults?.format?.[format] || 0;

  const formatGames = formatWins + formatLoses;

  if (formatGames === 0) return;

  return {
    winRate: formatWins / formatGames,
    gamesPlayed: formatGames
  };
}

function getFellowshipStats(card) {
  return getStats(card, "Fellowship Block (PC)");
}

function getMovieStats(card) {
  return getStats(card, "Movie Block (PC)");
}

function getExpandedStats(card) {
  return getStats(card, "Expanded (PC)");
}

function rateStats(stats, average) {

  const { winRate, gamesPlayed } = stats;

  if (gamesPlayed < (0.1 * average)) return "Unplayed";

  if (winRate >= 0.4 && winRate < 0.6 && gamesPlayed >= (.5 * average) && gamesPlayed < (1.5 * average)) return "Average";

  if (winRate >= 0.4 && winRate < 0.6 && gamesPlayed < (.5 * average)) return "Low Play Rate with Average Strength";

  if (winRate >= 0.4 && winRate < 0.6 && gamesPlayed >= (1.5 * average)) return "High Play Rate with Average Strength";

  if (winRate >= 0.3 && winRate < 0.4) return "Redeemable";

  if (winRate < 0.3) return "Trash";

  if (winRate >= 0.6 && gamesPlayed < (0.5 * average)) return "Sleeper or Niche Power Picks";

  if (winRate >= 0.6 && gamesPlayed < (1.25 * average)) return "Standard Power Picks";

  if (winRate >= 0.6 && gamesPlayed >= (1.25 * average)) return "Meta Dominating Power Picks";

  return "outlier";

}

async function categorizeCards() {
  const formats = [ "FellowshipBlock(PC)" ];

  const allCards = await Card.loadAll();

  // console.log(JSON.stringify(allCards, null, 2));

  console.log(allCards.length);

  const cardStats = {
    cards: {},
    fellowshipCards: {
      total: 0
    },
    totalFellowshipGames: 0,
    movieCards: {
      total: 0
    },
    totalMovieGames: 0,
    expandedCards: {
      total: 0
    },
    totalExpandedGames: 0
  };

  for (const card of allCards) {
    const stats = {
      fellowship: getFellowshipStats(card),
      movie: getMovieStats(card),
      expanded: getExpandedStats(card)

      // overall: getOverallStats(card)
    };

    if (!stats.fellowship && !stats.movie && !stats.expanded) continue;

    if (stats.fellowship) {
      cardStats.fellowshipCards.total++;
      cardStats.totalFellowshipGames+= stats.fellowship.gamesPlayed;
    }


    if (stats.movie) {
      cardStats.movieCards.total++;
      cardStats.totalMovieGames+= stats.movie.gamesPlayed;
    }


    if (stats.expanded) {
      cardStats.expandedCards.total++;
      cardStats.totalExpandedGames+= stats.expanded.gamesPlayed;
    }

    cardStats.cards[card.id] = stats;
  }

  const averageFellowshipGames = cardStats.totalFellowshipGames / cardStats.fellowshipCards.total;

  const averageMovieGames = cardStats.totalMovieGames / cardStats.movieCards.total;

  const averageExpandedGames = cardStats.totalExpandedGames / cardStats.expandedCards.total;

  console.log(averageFellowshipGames);

  const csvHeaders = [ "ID", "Fellowship Win Rate", "Fellowship Games Played", "Fellowship Rating", "Movie Win Rate", "Movie Games Played", "Movie Rating", "Expanded Win Rate", "Expanded Games Played", "Expanded Rating" ];

  const csvRows = [];

  for (const [ id, card ] of Object.entries(cardStats.cards)) {
    if (card.fellowship) {
      card.fellowship.rating = rateStats(card.fellowship, averageFellowshipGames);

      if (!cardStats.fellowshipCards[card.fellowship.rating]) cardStats.fellowshipCards[card.fellowship.rating] = 0;

      cardStats.fellowshipCards[card.fellowship.rating]++;
    }

    if (card.movie) {
      card.movie.rating = rateStats(card.movie, averageMovieGames);

      if (!cardStats.movieCards[card.movie.rating]) cardStats.movieCards[card.movie.rating] = 0;

      cardStats.movieCards[card.movie.rating]++;
    }

    if (card.expanded) {
      card.expanded.rating = rateStats(card.expanded, averageExpandedGames);

      if (!cardStats.expandedCards[card.expanded.rating]) cardStats.expandedCards[card.expanded.rating] = 0;

      cardStats.expandedCards[card.expanded.rating]++;
    }

    csvRows.push(
      `${id},${card.fellowship?.winRate || ""},${card.fellowship?.gamesPlayed || ""},${card.fellowship?.rating || "N/A"},${card.movie?.winRate || ""},${card.movie?.gamesPlayed || ""},${card.movie?.rating || "N/A"},${card.expanded?.winRate || ""},${card.expanded?.gamesPlayed || ""},${card.expanded?.rating || "N/A"}`);

    cardStats.cards[id] = card;
  }

  console.log(JSON.stringify(cardStats, null, 2));


  const csvHeaderRow = csvHeaders.join(',');
  const csv = `${csvHeaderRow}\n${csvRows.join('\n')}`;

  console.log(csv);
}

await categorizeCards();

console.log('done');