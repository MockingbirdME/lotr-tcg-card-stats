import { getCardName } from '../lib/card_map.js';

// const emptyCardMetrics = {
//   total: {
//     wins: 0,
//     losses: 0
//   },
//   numberInDeck:{
//     1: {
//       total: {
//       wins: 0,
//       losses: 0
//       },
//       numberPlayed: {
//         0: {
//           wins: 0,
//           losses: 0
//         },
//         1: {
//           wins: 0,
//           losses: 0
//         },
//         2: {
//           wins: 0,
//           losses: 0
//         },
//         3: {
//           wins: 0,
//           losses: 0
//         },
//         4: {
//           wins: 0,
//           losses: 0
//         },
//         fiveOrMore: {
//           wins: 0,
//           losses: 0
//         }
//       }
//     },
//     2: {
//       total: {
//       wins: 0,
//       losses: 0
//       },
//       numberPlayed: {
//         0: {
//           wins: 0,
//           losses: 0
//         },
//         1: {
//           wins: 0,
//           losses: 0
//         },
//         2: {
//           wins: 0,
//           losses: 0
//         },
//         3: {
//           wins: 0,
//           losses: 0
//         },
//         4: {
//           wins: 0,
//           losses: 0
//         },
//         fiveOrMore: {
//           wins: 0,
//           losses: 0
//         }
//       }
//     },
//     3: {
//       total: {
//       wins: 0,
//       losses: 0
//       },
//       numberPlayed: {
//         0: {
//           wins: 0,
//           losses: 0
//         },
//         1: {
//           wins: 0,
//           losses: 0
//         },
//         2: {
//           wins: 0,
//           losses: 0
//         },
//         3: {
//           wins: 0,
//           losses: 0
//         },
//         4: {
//           wins: 0,
//           losses: 0
//         },
//         fiveOrMore: {
//           wins: 0,
//           losses: 0
//         }
//       }
//     },
//     4: {
//       total: {
//       wins: 0,
//       losses: 0
//       },
//       numberPlayed: {
//         0: {
//           wins: 0,
//           losses: 0
//         },
//         1: {
//           wins: 0,
//           losses: 0
//         },
//         2: {
//           wins: 0,
//           losses: 0
//         },
//         3: {
//           wins: 0,
//           losses: 0
//         },
//         4: {
//           wins: 0,
//           losses: 0
//         },
//         fiveOrMore: {
//           wins: 0,
//           losses: 0
//         }
//       }
//     }
//   }
// };

export default class Game {

  static processCardsForDeckGamePlayed(cards, allCards, playedCards, seenCards) {
    const cardCounts = {};
    for (const cardId of cards) {
      // TODO check with Ketura if played and seen cards will get the same card populated multiple times if it was played multiple times.
      // NOTE: There seems to be something wrong with the played list compared to the all cards list where cards are listed in all cards twiceish and played only looks from the second half of the list; need to chat with Ketura to get a feel for how this is supposed to work.
      // const cardReference = Object.keys(allCards).find(key => allCards[key] === card);
      // delete allCards[cardReference];

      // const playedNTimes = playedCards.filter(reference => `${reference}` === cardReference).length;
      // console.log(`${card} - ${cardReference} Played times: ${playedNTimes}`);
      // if (playedNTimes > 1) console.log('PLAYED MULTIPLE TIMES!!!!!!');
      // const seenNTimes = seenCards.filter(reference => `${reference}` === cardReference).length;

      // TODO sanitize card IDs
      const cardName = getCardName(cardId);


      if (!cardCounts[cardName]) {
        cardCounts[cardName] = {
          numberInDeck: 0
          // playedCount: 0,
          // seenCount: 0
        };
      }

      cardCounts[cardName].numberInDeck++;
      // cardCounts[card].playedCount = cardCounts[card].playedCount + playedNTimes;
      // cardCounts[card].seenCount = cardCounts[card].seenCount + seenNTimes;
    }

    // for (const [key, value] of Object.entries(cardCounts)) {
    //   // TODO consider getting full card names and storing the ID in the body for easier readability.

    //   const cardName = ""; // Get the actual name

    //   if (!processedCards[key]) {
    //     processedCards[key] = {
    //       name: cardName,
    //       metrics: emptyCardMetrics
    //     };
    //   }

    //   processedCards[key].total[]
    // }

    return cardCounts;
  }

  static parseDeck(deckData, { winner, lose_reason: loseReason, win_reason: winReason, highestSiteReached, highestSitePlayed, wentFirst, bid, allCards, playedCards, seenCards }) {
    const { sites, drawDeck, ring, ringBearer, startingFellowship } = deckData;

    const processedCardList = Game.processCardsForDeckGamePlayed(drawDeck, allCards, playedCards, seenCards);

    return {
      won: winner,
      ring: getCardName(ring),
      ringBearer: getCardName(ringBearer),
      bid,
      wentFirst,
      loseReason,
      winReason,
      highestSiteReached,
      highestSitePlayed,
      sites: sites.map(siteId => getCardName(siteId)),
      cards: processedCardList
    };
  }

  static parseDecks(decksData, { lose_reason, loser, loser_site, win_reason, winner, winner_site, bids, wentFirst, allCards, playedCards, seenCards }) {
    const highestSitePlayed = winner_site > loser_site ? winner_site : loser_site;

    const winningDeck = Game.parseDeck(decksData[winner], { winner: true, lose_reason, win_reason, highestSiteReached: winner_site, highestSitePlayed, wentFirst: winner === wentFirst, bid: bids[winner], allCards, playedCards, seenCards });

    const losingDeck = Game.parseDeck(decksData[loser], { winner: false, lose_reason, win_reason, highestSiteReached: loser_site, highestSitePlayed, wentFirst: loser === wentFirst, bid: bids[loser], allCards, playedCards, seenCards });

    return { winningDeck, losingDeck };
  }

  constructor(gameDetails, options = {}) {
    // Top level keys changed cases in April 2024, we grab whichever is available
    const allCards = gameDetails.allCards || gameDetails.AllCards;
    const bids = gameDetails.bids || gameDetails.Bids;
    const canceled = gameDetails.canceled || gameDetails.Canceled;
    const conceded = gameDetails.conceded || gameDetails.Conceded;
    const decksData = gameDetails.decks || gameDetails.Decks;
    const gameReplayInfo = gameDetails.gameReplayInfo || gameDetails.GameReplayInfo;
    const gameStarted = gameDetails.gameStarted || gameDetails.GameStarted;
    const metadataVersion = gameDetails.metadataVersion || gameDetails.MetadataVersion;
    const playedCards = gameDetails.playedCards || gameDetails.PlayedCards;
    const seenCards = gameDetails.seenCards || gameDetails.SeenCards;
    const wentFirst = gameDetails.wentFirst || gameDetails.WentFirst;

    const decks = { };

    for (const [ player, deck ] of Object.entries(decksData)) {
      decks[player] = {
        sites: deck.adventureDeck || deck.AdventureDeck,
        drawDeck: deck.drawDeck || deck.DrawDeck,
        ring: deck.ring || deck.Ring,
        ringBearer: deck.ringBearer || deck.RingBearer,
        startingFellowship: deck.startingFellowship || deck.StartingFellowship
      };
    }

    const { format_name, lose_reason, loser, lose_recording_id, loser_site, win_reason, win_recording_id, winner, winner_site } = gameReplayInfo;

    this._fullyLoaded = false;

    this._id = `${win_recording_id}-${lose_recording_id}`;

    if (!gameStarted) {
      console.log(`Match "${this._id}" never started, skipping processing`);
      return;
    }

    if ( metadataVersion !== 2 ) {
      console.log(`Match "${this._id}" has unprocessable metadata version ${metadataVersion}, skipping processing`);
      return;
    }

    if (options.formats && !options.formats.includes(format_name)) {
      console.log(`Match "${this._id}" is ${format_name} which is not on the options format list, skipping processing`);
      return;
    }

    // this._originalDetails = gameDetails;

    this._format = format_name;

    const { winningDeck, losingDeck } = Game.parseDecks(decks, { lose_reason, loser, loser_site, win_reason, winner, winner_site, bids, wentFirst, allCards, playedCards, seenCards });

    this._winningDeck = winningDeck;

    this._losingDeck = losingDeck;


    this._fullyLoaded = true;
  } // End constructor

  addToCardCollection(collection) {
    const { ring: winningRing, ringBearer: winningRingBearer } = this._winningDeck;
    const { ring: losingRing, ringBearer: losingRingBearer } = this._losingDeck;

    collection.addCard(winningRing, { category: "ring" }, this._format, true);
    collection.addCard(winningRingBearer, { category: "ringBearer" }, this._format, true);
    collection.addCard(losingRing, { category: "ring" }, this._format, false);
    collection.addCard(losingRingBearer, { category: "ringBearer" }, this._format, false);


    for (const siteId of this._winningDeck.sites) {
      collection.addCard(siteId, { category: "sites" }, this._format, true);
    }

    for (const [ cardId, cardMetrics ] of Object.entries(this._winningDeck.cards)) {
      collection.addCard(cardId, { ...cardMetrics, category: "drawDeck" }, this._format, true);
    }

    for (const siteId of this._losingDeck.sites) {
      collection.addCard(siteId, { category: "sites" }, this._format, false);
    }

    for (const [ cardId, cardMetrics ] of Object.entries(this._losingDeck.cards)) {
      collection.addCard(cardId, { ...cardMetrics, category: "drawDeck" }, this._format, false);
    }
  }

}