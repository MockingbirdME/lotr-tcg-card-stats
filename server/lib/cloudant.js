import { CloudantV1 } from '@ibm-cloud/cloudant';
import { authenticator } from './iam-authenticator.js';

// Set the default database name.
export const db = process.env.CLOUDANT_DATABASE;
if (!db) {
  throw new Error('CLOUDANT_DATABASE environment variable MUST be set.');
}

// Make sure a Cloudant URL is configured.
if (!process.env.CLOUDANT_URL) {
  throw new Error('CLOUDANT_URL environment variable MUST be set.');
}

// Create and export a client.
export const client = CloudantV1.newInstance({ authenticator });

// Make sure the database exists.
await client
  .putDatabase({ db })
  .then(({ result }) => {
    if (result.ok) {
      console.info(`Created database: ${db}`);
    } else {
      throw new Error('Unexpected response from Cloudant when creating database.');
    }
  })
  .catch(error => {
    if (error.code === 412) {
      console.debug(`Verified database exists: ${db}`);
    } else {
      throw error;
    }
  });

// Inject design documents.

// Set views in vanilla javascript.
/* eslint-disable no-var, no-undef */
const views = {
  allCardsByWinRates: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "card") return;

    var formats = [];
    
    if (doc.winResults && doc.winResults.format) {
      var winResultsFormats = Object.keys(doc.winResults.format) || [];
      for (var winResultsIndex = 0; winResultsIndex < winResultsFormats.length; winResultsIndex++) {
        var winFormatsIndex = formats.indexOf(winResultsFormats[winResultsIndex]);
        if (winFormatsIndex === -1) {
          formats.push(winResultsFormats[winResultsIndex])
        }
      }
    }
    
    if (doc.loseResults && doc.loseResults.format) {
      var loseResultsFormats = Object.keys(doc.loseResults.format) || [];
      for (var loseResultsIndex = 0; loseResultsIndex < loseResultsFormats.length; loseResultsIndex++) {
        var loseFormatsIndex = formats.indexOf(loseResultsFormats[loseResultsIndex]);
        if (loseFormatsIndex === -1) {
          formats.push(loseResultsFormats[loseResultsIndex])
        }
      }
     }
  
    var overallWinCount = 0;
    if (doc.winResults && doc.winResults.count) {
      overallWinCount = doc.winResults.count;
    }
    
    var overallLoseCount = 0;
    if (doc.loseResults && doc.loseResults.count) {
      overallLoseCount = doc.loseResults.count;
    }
    
    var overallWinPercent = overallWinCount / (overallWinCount + overallLoseCount)
    
    emit(overallWinPercent, 'overall');
    
    for (var formatIndex = 0; formatIndex < formats.length; formatIndex++) {
      var formatWinCount = 0;
      if (doc.winResults && doc.winResults.format && doc.winResults.format[formats[formatIndex]]) {
        formatWinCount = doc.winResults.format[formats[formatIndex]];
      }
      
      var formatLoseCount = 0;
      if (doc.loseResults &&  doc.loseResults.format && doc.loseResults.format[formats[formatIndex]]) {
        formatLoseCount = doc.loseResults.format[formats[formatIndex]];
      }
      
      var formatWinPercent = formatWinCount / (formatWinCount + formatLoseCount);
    
      emit(formatWinPercent, formats[formatIndex]);
    }
  }`,
  allCardsByOverallWinRate: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "card") return;

    var overallWinCount = 0;
    if (doc.winResults && doc.winResults.count) {
      overallWinCount = doc.winResults.count;
    }
    
    var overallLoseCount = 0;
    if (doc.loseResults && doc.loseResults.count) {
      overallLoseCount = doc.loseResults.count;
    }
    
    var overallWinPercent = overallWinCount / (overallWinCount + overallLoseCount)
    
    emit(overallWinPercent, overallWinCount + overallLoseCount);
  }`,
  allCardsByIdOld: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] === "card") emit(null, 1)
  }`,
  allDecksByWinRate: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "deck") return;
    
    var gamesPlayed = doc.winResults.count + doc.loseResults.count;
    var winPercent = doc.winResults.count / gamesPlayed;
    
    emit(winPercent, gamesPlayed)
  }`,
  allDecksById: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] === "deck") emit(null, 1)
  }`,
  allGamesById: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] === "game") emit(doc.timestamp, 1)
  }`,
  allCardsById: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "game") return

    for (var i = 0; i < doc.decks.length; i++) {
      for (var c = 0; c < Object.keys(doc.decks[i].drawDeck).length; c++) {
        var cardId = Object.keys(doc.decks[i].drawDeck)[c];
        emit(cardId, doc.timestamp)
      }
    }
  }`,
  allCardsByNumericId: `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "card") return;
    if (isNaN(parseInt(split[1]))) return;
    emit(doc.id, 1)
  }`
};

const formats = [
  "Fellowship Block (PC)",
  "Fellowship Block",
  "Movie Block",
  "Movie Block (PC)",
  "Limited - FOTR",
  "Open",
  "Expanded",
  "King Standard",
  "Expanded (PC)"
];

for (const format of formats) {
  const gamesPlayedKey = `allGamesOf${format.replace(/ /g, '')}Format`;
  views[gamesPlayedKey] = `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "game") return;
    if (doc.format !== "${format}") return;
    emit(doc.timestamp, 1);
  }`;

  // TODO add per format deck count view.

}


for (const inDeckCount of [ 1, 2, 3, 4 ]) {
  const gamesPlayedCountKey = `allCardsByGamesPlayedWith${inDeckCount}InDeck`;
  views[gamesPlayedCountKey] = `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "card") return;
    var formatWinCount = 0;
      if (doc.winResults && doc.winResults.inDeck && doc.winResults.inDeck["${inDeckCount}"]) {
        formatWinCount = doc.winResults.inDeck["${inDeckCount}"];
      }
      
      var formatLoseCount = 0;
      if (doc.loseResults &&  doc.loseResults.inDeck && doc.loseResults.inDeck["${inDeckCount}"]) {
        formatLoseCount = doc.loseResults.inDeck["${inDeckCount}"];
      }

      var formatGamesPlayed = (formatWinCount + formatLoseCount);
      var formatWinPercent = formatWinCount / formatGamesPlayed;

      if (formatGamesPlayed) emit(formatGamesPlayed, formatWinPercent);
  }`;

  const gamesPlayedRateKey = `allCardsByWinRateWith${inDeckCount}InDeck`;
  views[gamesPlayedRateKey] = `function(doc) {
    var split = doc._id.split(':');
    if (split[0] !== "card") return;
    var formatWinCount = 0;
      if (doc.winResults && doc.winResults.inDeck && doc.winResults.inDeck["${inDeckCount}"]) {
        formatWinCount = doc.winResults.inDeck["${inDeckCount}"];
      }

      var formatLoseCount = 0;
      if (doc.loseResults &&  doc.loseResults.inDeck && doc.loseResults.inDeck["${inDeckCount}"]) {
        formatLoseCount = doc.loseResults.inDeck["${inDeckCount}"];
      }

      var formatGamesPlayed = (formatWinCount + formatLoseCount);
      var formatWinPercent = formatWinCount / formatGamesPlayed;

      if (formatGamesPlayed) emit(formatWinPercent, formatGamesPlayed);
  }`;
}

/* eslint-enable no-var,no-undef */

// Set up a designDoc object.
const designDoc = {
  views: {}
};

// For each view add them to the design doc in the format Cloudant understands.
for (const key of Object.keys(views)) {
  designDoc.views[key] = { map: views[key] };
}

// Get any existing design docs that match the 'allDocs' one we add programmatically.
const { result: existingDoc } = await client.getDesignDocument({ db, ddoc: 'allDocs', latest: true })
  .catch(error => {
    console.error(error);
    if (error.status === 404 || error.code === 404) {
      return {};
    }
    throw error;
  });

// If there's a difference between the existing views and those we've set, update the doc in Cloudant.
if (JSON.stringify(designDoc.views) !== JSON.stringify(existingDoc?.views)) {
  await client.putDesignDocument({
    db,
    designDocument: { ...designDoc, _rev: existingDoc?._rev },
    ddoc: 'allDocs'
  });
}

// Export a wrapper around cloudant, which uses the configured document.
export default {
  getDocument: (docId) => client.getDocument({ db, docId }),
  postDocument: (document) => client.postDocument({ db, document }),
  postView: (options) => client.postView({ ...options, db, ddoc: 'allDocs' })
  // TODO Add other functions, as they are needed.
};