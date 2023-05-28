import { log } from 'console';

import cloudant from '../lib/cloudant.js'
import Card from './Card.js';
import Deck from './Deck.js';
import {delay} from '../lib/utils.js';

export default class Game {
  
  static async loadById(id) {
    const result = await cloudant.getDocument(`game:${id}`)
      .then(data => (data.result))
      .catch(error => {
        // TODO handle this error
        if (error.status === 404 || error.code === 404) return;
        log(`Got an error processing game ${id}: "error"`);
      });
 
    if (result) return new Game(result);
    return new Game({_id: `game:${id}`});
  }

  static async checkForId(id) {
    const result = await cloudant.getDocument(`game:${id}`)
      .then(data => (data.result))
      .catch(error => {
        // TODO handle this error
        if (error.status === 404 || error.code === 404) return;
        log(`Got an error processing game ${id}: "error"`);
      });

    return Boolean(result);
  }

  static async recordGame(gameDetails, options) {
    const { win_recording_id: winRecordingId, lose_recording_id: loseRecordingId } = gameDetails.GameReplayInfo;

    const id = `${winRecordingId}-${loseRecordingId}`;

    const gameExists = await Game.checkForId(id);

    if (gameExists) throw new Error('Game already exists, cannot be recorded again');

    const game = new Game({_id: `game:${id}`});

    await game.recordGame(gameDetails, options);
    await game.save();
  }

  constructor(data) {
    if (!data._id && !data.id) throw new error("Cards require an ID");
    if (!data._id) data._id = data.id;
    delete data.id;

    this.document = data;
    
  } // End constructor

  async recordGame(gameDetails, options = {}) {
    const { Decks: rawDecksInfo, GameReplayInfo: gameInfo } = gameDetails;
    const { card: cardOptions } = options;

    // TODO figure out what we're doing about format

    const {
      format_name: format,
      winner,
      win_reason: winReason,
      lose_reason: loseReason } = gameInfo;

    const decks = Object.keys(rawDecksInfo).map(player => {
      const deck = rawDecksInfo[player]
      const {
        AdventureDeck: adventureDeck,
        DrawDeck: drawDeck,
        Ring: ring,
        RingBearer: ringBearer,
        StartingFellowship } = deck;

      const deckID = Deck.generateDeckId(adventureDeck, drawDeck, ring, ringBearer);

      // TODO figure out the actual starting fellowship from the array (there's some garbage after the starting companions and the ring/bearer are listed first).
      const actualStartingFellowship = StartingFellowship;

      const details = {
        id: deckID,
        player,
        format,
        bid: gameDetails.Bids[player],
        wentFirst: gameDetails.WentFirst === player,
        won: winner === player,
        winReason,
        loseReason,
        adventureDeck,
        drawDeck: {},
        startingFellowship: actualStartingFellowship
      }

      for (const card of drawDeck) {
        // TODO check for non-standard card and update data to standardize
        if (!details.drawDeck[card]) details.drawDeck[card] = { inDeck: 0, played: 0, seen: 0 }
        details.drawDeck[card].inDeck++
      }

      return details;
    }) // End for (const player in Decks)) 

    // TODO update both decks with cards played and seen counts

    // TODO process each deck against the class to update and save the DB item for it
    for await (const deck of decks) {
      log(`adding deck ${deck.id}`)
      await Deck.addGame(deck);
      log(`done adding deck ${deck.id}`)

      // TODO process each card against the class to update and save the DB item for it
      log(`before card for loop for game ${this.document._id}`)
      for await (const cardId of Object.keys(deck.drawDeck)) {
        const card = deck.drawDeck[cardId];
        const startingFellowship = deck.startingFellowship.includes(cardId);

        const cardGameData = {
          id: Card.standardizeId(cardId),
          player: deck.player,
          format: deck.format,
          bid: deck.bid,
          wentFirst: deck.wentFirst,
          won: deck.won,
          winReason: deck.winReason,
          loseReason: deck.loseReason,
          startingFellowship,
          ...card
        }

        // Delay between card adds because I'm cheap so db has a 10 write/second limit
        if (!cardOptions.saveAsMap) await delay(100);
        
        log(`adding card ${cardGameData.id} for deck ${deck.id}`)
        await Card.addGame(cardGameData, cardOptions);        
        log(`done adding card ${cardGameData.id} for deck ${deck.id}`)
      }

      log(`after card for loop for game ${this.document._id}`)
    }
    log(`returning for game ${this.document._id}`)
  }

  async save() {
    const doc = {...this.document}
    log(`saving ${this.document._id}`)
    await cloudant.postDocument(doc);
  }
}