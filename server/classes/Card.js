import { log } from 'console';

import cloudant from '../lib/cloudant.js'

import Results from './Results.js';
import { delay } from '../lib/utils.js';
import { formats } from '../lib/constants.js';

// This is used only for mass game adds run from a dev machine.
let cardSaveMap = {};

export default class Card {

  static async loadAll() {
      const view = 'allCardsById';

      const {result} = await cloudant.postView({
        view,
        includeDocs: true
      });

      return result.rows.map(row => row.doc);
    }


  static async loadWinRates({
    view = 'allCardsByOverallWinRate',
    ignorePercentRange = [40, 60],
    minGames = 100
  }) {

      const {result: lowResult} = await cloudant.postView({
        view,
        startKey: 0,
        endKey: ignorePercentRange[0]/100,
        includeDocs: true
      });

      const lowRowsInBounds = lowResult.rows.filter(row => row.value >= minGames)

      const {result: highResult} = await cloudant.postView({
        view,
        startKey: ignorePercentRange[1]/100,
        endKey: 1,
        includeDocs: true
      });

      // TODO put in some kind of filter for a small number of players, or perhaps simply remove the outliers and if it still qualifies keep it otherwise remove the row.
      const highRowsInBounds = highResult.rows.filter(row => row.value >= minGames)

      return [...lowRowsInBounds, ...highRowsInBounds];
    }

  static async loadById(id) {
    const _id = Card.standardizeIdLength(id);
    const result = await cloudant.getDocument(`card:${_id}`)
      .then(data => (data.result))
      .catch(error => {
        // TODO handle this error
        if (error.status === 404 || error.code === 404) return;
        log(`Got an error processing card ${id}: "error"`);
      });
      
    if (result) return new Card(result);
    return new Card({_id: `card:${_id}`, id});
  }

  static async addGame(gameDetails, options = {}) {
    const { saveAsMap } = options;
    const { id } = gameDetails;

    const card = saveAsMap && cardSaveMap[id]
      ? cardSaveMap[id]        
      : await Card.loadById(id);

    card.addGame(gameDetails, options)

    if (saveAsMap) cardSaveMap[id] = card;
    else await card.save()
      .catch(async error => {
        if (error.status === 409 || error.code === 409) {
          await delay(250);
          await Card.addGame(gameDetails);
        }
        else throw error;
      });
  }

  static getCardMap() {
    return cardSaveMap;
  }

  static clearCardMap() {
    cardSaveMap = {};
  }

  static standardizeIdLength(cardId) {
    const [set, card] = cardId.split('_');

    const standardSetNumber = set.length === 3
      ? set
      : set.length === 2
        ? `0${set}`
        : `00${set}`

    const standardCardNumber = card.length === 3
    ? card
    : card.length === 2
      ? `0${card}`
      : `00${card}`

    return `${standardSetNumber}_${standardCardNumber}`;
  }

  static standardizeId(cardId) {
    // TODO create a map from https://docs.google.com/spreadsheets/d/1M3gcLvaILipfyEqoMazaIqqEeNhEtIYKNs-xKqefKUc/edit#gid=0 to standardize promo IDs.

    // TODO standardize errata IDs
    const regex = RegExp('(?<set>[0-9]{1,3})_(?<card>[0-9]{1,3})');

    const { set, card } = regex.exec(cardId).groups;

    // TODO handle error cases where we might not have a good regex match. 

    // 50-69: PC errata for sets 0-19, exactly 50 offset.
    const nonErrataSet = set > 49 && set < 70
      ? set - 50
      : set;

    return `${nonErrataSet}_${card}`
  }

  constructor(data) {
    if (!data._id && !data.id) throw new error("Cards require an ID");
    
    this.document = data;

    this._results = this.document.results || {};

    for (const format of formats) {
      if (!this._results[format]) this._results[format] = {};

      this._results[format].won = new Results(this._results[format].won);
      this._results[format].lost = new Results(this._results[format].lost);
    }

    // TODO Load Card name
    
  } // End constructor

  get results() {
    return this._results;
  }

  formatResults(format) {
    if (!this.results[format]) {
      log(`Unknown Format "${format}"`);
      this._results[format] = {
        won: new Results(),
        lost: new Results()
      }
    }

    return this.results[format];
  }

  addGame(gameDetails) {
    const { 
      player, 
      format, 
      bid,
      wentFirst, 
      won, 
      winReason, 
      loseReason,
      startingFellowship,
      inDeck,
      played,
      seen} = gameDetails;

    // TODO validate that the details look right. 
    const formatResults = this.formatResults(format);
    const appropriateResults = won ? formatResults.won : formatResults.lost;
    log(appropriateResults)

    appropriateResults.increaseCount(wentFirst);

    // TODO fully refactor format to be a key step in results and not a separate count. 

    for (const resultKey of ['player', 'bid', 'winReason', 'loseReason', 'startingFellowship', 'inDeck', 'played', 'seen', 'format']) {
      const fieldKey = resultKey === startingFellowship
        ? `${startingFellowship}`
        : gameDetails[resultKey]
      appropriateResults.increaseFieldCount(resultKey, fieldKey);
    }
  }

  async save() {
    const doc = {...this.document, results: this.results}

    log(`saving ${this.document._id}`);
    
    await cloudant.postDocument(doc);
  }
}