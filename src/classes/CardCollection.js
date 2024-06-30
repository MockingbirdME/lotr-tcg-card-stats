
const emptyCardMetrics = {
  total: {
    wins: 0,
    losses: 0
  },
  numberInDeck:{
    1: {
      total: {
      wins: 0,
      losses: 0
      }
    },
    2: {
      total: {
      wins: 0,
      losses: 0
      }
    },
    3: {
      total: {
      wins: 0,
      losses: 0
      }
    },
    4: {
      total: {
      wins: 0,
      losses: 0
      }
    }
  }
};

const getEmptyFormatJson = () => ( { totals: {
  games: 0,
  ring: {
    uniqueCardCount: 0
  },
  ringBearer: {
    uniqueCardCount: 0
  },
  sites: {
    uniqueCardCount: 0
  },
  drawDeck: {
    deckCount: 0,
    cardCount: 0,
    uniqueCardCount: 0
  }
} } );

const newStats = {
  wins: 0,
  losses: 0
};

export default class CardCollection {
  constructor() {
    this._collection = {
      formats: {},
      cards: {}
    };
  }

  get all() {
    return this._collection;
  }

  get stringify() {
    return JSON.stringify(this._collection, null, 2);
  }

  getCardStats(cardId) {
    return this._collection.cards[cardId] || { metadata: {}, blocks: {} };
  }

  saveCardStats(cardId, stats) {
    this._collection.cards[cardId] = stats;
  }

  getFormatStats(format) {
    return this._collection.formats[format] || getEmptyFormatJson();
  }

  saveFormatStats(format, stats) {
    this._collection.formats[format] = stats;
  }

  logCardStats() {
    console.log(JSON.stringify(this._collection, null, 2));
  }

  addCard(cardId, cardMetrics, format, won) {
    const stats = this.getCardStats(cardId);

    const { category, numberInDeck } = cardMetrics;

    // TODO Add fields for going first vs second
    // TODO Add fields for win/loss reason to track why a game ended
    // TODO Add fields for highest site reached and highest site played to track where games end
    // TODO Add fields for bid to track bid stats
    // TODO add fields to track times played and times seen in a game
    if (!stats.metadata.category) stats.metadata.category = category;

    const firstOccurrenceInFormat = !stats.blocks[format];
    if (firstOccurrenceInFormat) stats.blocks[format] = { overall: { ...newStats }, numberInDeck: {} };

    const formatStats = stats.blocks[format];

    if (numberInDeck && !formatStats.numberInDeck[numberInDeck]) formatStats.numberInDeck[numberInDeck] = { ...newStats };

    if (won) {
      formatStats.overall.wins++;
      if (numberInDeck) formatStats.numberInDeck[numberInDeck].wins++;
    } else {
      formatStats.overall.losses++;
      if (numberInDeck) formatStats.numberInDeck[numberInDeck].losses++;
    }

    this.addCardStatsToFormatCounts(format, category, numberInDeck, firstOccurrenceInFormat);

    this.saveCardStats(cardId, stats);
  }

  addCardStatsToFormatCounts(format, category, numberInDeck = 1, firstOccurrenceInFormat) {
    const stats = this.getFormatStats(format);

    if (category === "ring") stats.totals.games += 0.5;
    if (firstOccurrenceInFormat) stats.totals[category].uniqueCardCount++;
    if (category === "drawDeck") {
      stats.totals[category].cardCount += numberInDeck;
      stats.totals[category].deckCount++;
    }

    this.saveFormatStats(format, stats);
  }

}