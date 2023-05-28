import { log } from 'console';
import { createHash } from 'crypto';

import cloudant from '../lib/cloudant.js'

import Results from './Results.js';
import { delay } from '../lib/utils.js';

export default class Deck {

  static generateDeckId(adventureDeck, drawDeck, ring, ringBearer) {
    const hash = createHash('sha256');
    hash.update([ringBearer, ring, ...adventureDeck, ...drawDeck.sort()].join());
    return hash.digest('hex');
  }
  
  static async loadById(id) {
    const result = await cloudant.getDocument(`deck:${id}`)
      .then(data => (data.result))
      .catch(error => {
        // TODO handle this error
        if (error.status === 404 || error.code === 404) return;
        log(`Got an error processing deck ${id}: "error"`);
      });
      
    if (result) return new Deck(result);
    return new Deck({_id: `deck:${id}`});
  }

  static async addGame(gameDetails) {
    const { id } = gameDetails;
    const deck = await Deck.loadById(id);
    deck.addGame(gameDetails);
    await deck.save().catch(async error => {
      if (error.status === 409 || error.code === 409) {
        await delay(250);
        await Deck.addGame(gameDetails);
      }
      else throw error;
    });
  }

  constructor(data) {
    if (!data._id && !data.id) throw new error("Cards require an ID");
    if (!data._id) data._id = data.id;
    delete data.id;

    this.document = data;
    
  } // End constructor

  get loseResults() {
    if (!this._loseResults) this._loseResults = new Results(this.document.loseResults)

    return this._loseResults
  }
  
  get winResults() {
    if (!this._winResults) this._winResults = new Results(this.document.winResults)

    return this._winResults
  }

  addGame(gameDetails) {
    const { 
      id, 
      player, 
      format, 
      bid, 
      wentFirst, 
      won, 
      winReason, 
      loseReason, 
      adventureDeck,
      drawDeck,
      startingFellowship } = gameDetails;

    // TODO validate that the details look right. 

    const appropriateResults = won ? this.winResults : this.loseResults;

    appropriateResults.increaseCount(wentFirst);

    for (const resultKey of ['player', 'bid', 'winReason', 'loseReason', 'startingFellowship', 'format']) {
      const fieldKey = resultKey === startingFellowship
        ? gameDetails[resultKey].sort().join(",")
        : gameDetails[resultKey]
      appropriateResults.increaseFieldCount(resultKey, fieldKey);
    }
  }

  async save() {
    const doc = {...this.document, winResults: this.winResults, loseResults: this.loseResults}

    log(`saving ${this.document._id}`)

    await cloudant.postDocument(doc);
  }
}