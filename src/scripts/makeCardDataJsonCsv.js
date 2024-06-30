
import fs from 'fs';
import path from 'path';

const headers = [ "Card", "Block", "Category/Count", "Games", "Win Rate", "Play Rate", "Weighted Play Rate", "Weighted Inclusion Rate" ];

let formatStats = {};

function getCategoryCountString(category, count) {
  switch (category) {
    case "ring":
      return "The One Ring";
    case "ringBearer":
      return "Ring Bearer";
    case "sites":
      return "Site";
    default:
      return count;
  }
}

function getRates({ gamesPlayed, count, category, block }) {
  const rates = {};

  const formatTotals = formatStats[block].totals;

  const gamesPlayedInFormat = formatTotals.games * 2;

  rates.playRate = (gamesPlayed/gamesPlayedInFormat).toFixed(4);

  if (category === "ring" || category === "ringBearer" || category === "sites") {
    const averagePlayRate = (1 / formatTotals[category].uniqueCardCount).toFixed(4);
    rates.weightedPlayRate = (rates.playRate/averagePlayRate).toFixed(2);
    rates.inclusionRate = rates.playRate;
    rates.weightedInclusionRate = rates.weightedPlayRate;
  }

  if (category === "drawDeck") {
    // The math here could be expressed more simply but I feel it would lead to confusion as to why it is what it is so instead I've opted for a few extra steps with descriptive variable names.
    const averageUniqueCardsInDeck = formatTotals[category].deckCount / gamesPlayedInFormat;

    const averageUniqueInclusionRate = averageUniqueCardsInDeck / formatTotals[category].uniqueCardCount;

    const expectedGamesIncluded = averageUniqueInclusionRate * gamesPlayedInFormat;

    rates.weightedPlayRate = "Unknown";
    rates.weightedInclusionRate = (gamesPlayed / expectedGamesIncluded).toFixed(2);
  }

  return rates;
}

function createLineFor( cardName, block, count, { wins, losses }, metadata ) {
  const gamesPlayed = wins + losses;
  const { category } = metadata;

  const categoryCountString = getCategoryCountString(category, count);

  const winRate = (wins/gamesPlayed).toFixed(4);

  const { playRate, weightedPlayRate, weightedInclusionRate } = getRates({ gamesPlayed, count, category, block });

  return `"${cardName}",${block},${categoryCountString},${gamesPlayed},${winRate},${playRate},${weightedPlayRate},${weightedInclusionRate}`;
}

function processCountsFor(cardName, block, blockStats, metadata) {
  const lines = [];

  if (Object.keys(blockStats.numberInDeck)?.length > 0) {
    for (const [ count, stats ] of Object.entries(blockStats.numberInDeck)) {
      lines.push(createLineFor(cardName, block, count, stats, metadata));
    }
  }

  lines.push(createLineFor(cardName, block, "Any", blockStats.overall, metadata));

  return lines;
}

function processBlocksFor(cardName, cardStats) {
  const lines = [];
  const overallCount = { wins: 0, losses: 0 };

  const { metadata, blocks: blocksStats } = cardStats;

  for (const [ block, blockStats ] of Object.entries(blocksStats)) {

    overallCount.wins+=blockStats.overall.wins;
    overallCount.losses+=blockStats.overall.losses;

    lines.push(processCountsFor(cardName, block, blockStats, metadata));
  }

  lines.push(createLineFor(cardName, "All Blocks (PC)", "Any", overallCount, metadata));

  return lines.flat();
}

function jsonToCsvLines(cardJson) {
  const lines = [];

  for (const [ cardName, cardStats ] of Object.entries(cardJson)) {
    lines.push(processBlocksFor(cardName, cardStats));
  }

  return lines.flat();
}

function jsonToCsv(filepath) {
  const bufferedContents = fs.readFileSync(filepath);
  const contents = JSON.parse(bufferedContents);

  const { cards: cardJson, formats: formatJson } = contents;

  formatStats = formatJson;

  formatStats["All Blocks (PC)"] = {
    totals: {
      games: formatStats["Fellowship Block (PC)"].totals.games + formatStats["Movie Block (PC)"].totals.games + formatStats["Expanded (PC)"].totals.games,
      ring: {
        uniqueCardCount: formatStats["Fellowship Block (PC)"].totals.ring.uniqueCardCount + formatStats["Movie Block (PC)"].totals.ring.uniqueCardCount + formatStats["Expanded (PC)"].totals.ring.uniqueCardCount
      },
      ringBearer: {
        uniqueCardCount: formatStats["Fellowship Block (PC)"].totals.ringBearer.uniqueCardCount + formatStats["Movie Block (PC)"].totals.ringBearer.uniqueCardCount + formatStats["Expanded (PC)"].totals.ringBearer.uniqueCardCount
      },
      sites: {
        uniqueCardCount: formatStats["Fellowship Block (PC)"].totals.sites.uniqueCardCount + formatStats["Movie Block (PC)"].totals.sites.uniqueCardCount + formatStats["Expanded (PC)"].totals.sites.uniqueCardCount
      },
      drawDeck: {
        uniqueCardCount: formatStats["Fellowship Block (PC)"].totals.drawDeck.uniqueCardCount + formatStats["Movie Block (PC)"].totals.drawDeck.uniqueCardCount + formatStats["Expanded (PC)"].totals.drawDeck.uniqueCardCount,
        deckCount: formatStats["Fellowship Block (PC)"].totals.drawDeck.deckCount + formatStats["Movie Block (PC)"].totals.drawDeck.deckCount + formatStats["Expanded (PC)"].totals.drawDeck.deckCount,
        cardCount: formatStats["Fellowship Block (PC)"].totals.drawDeck.cardCount + formatStats["Movie Block (PC)"].totals.drawDeck.cardCount + formatStats["Expanded (PC)"].totals.drawDeck.cardCount
      }
    }
  };

  const lines = jsonToCsvLines(cardJson);

  const csvContent = [ headers.join(","), ...lines ].join("\n");

  console.log(csvContent);

  fs.writeFileSync(filepath.replaceAll(".json", ".csv"), csvContent);
}

const filepath = "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/all.json";

jsonToCsv(path.resolve(filepath));

