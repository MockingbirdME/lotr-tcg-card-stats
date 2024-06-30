import { log } from 'console';
import fs from 'fs';
import path from 'path';


import CardCollection from "../classes/CardCollection.js";
import Game from "../classes/Game.js";
import { pcFormats } from '../lib/constants.js';

let count = 0;
const startTime = new Date();

async function processFile(dir, file, collection, countLimit) {
  // log(`\n\nprocessing file ${dir}/${file}`);
  const bufferedContents = fs.readFileSync(`${dir}/${file}`);
  const contents = JSON.parse(bufferedContents);

  if (!pcFormats.includes(contents.GameReplayInfo.format_name)) {
    // log(`skipping file ${dir}/${file}, ${contents.GameReplayInfo.format_name} is not a PC format`);
    return;
  }

  const game = new Game(contents);

  if (!game._fullyLoaded) return;

  game.addToCardCollection(collection);

  // log(`successfully processed file ${dir}/${file}`);

  if (countLimit) {
    count++;
    if (count >= countLimit) {
      log(`count has reached its limit of ${count}, not processing additional files`);
      return true;
    }
  }
} // End async function processFile


// Make an async function that gets executed immediately
async function processFiles(gameDirectory, outputFile, countLimit) {
  log(`directory to process: ${gameDirectory}`);
  const collection = new CardCollection();

  // Get the files as an array
  const files = await fs.promises.readdir(gameDirectory);

  // Loop them all with the new for...of
  for await (const file of files) {
    const endEarly = await processFile(gameDirectory, file, collection, countLimit);
    if (endEarly) break;
    // throw new Error
  } // End for...of

  collection.logCardStats();

  const stringifiedCollection = collection.stringify;

  fs.writeFileSync(outputFile, stringifiedCollection);
}

const gamesDirectory = path.resolve("/Users/devon/Documents/replays/2023 v2 metadata rollout - Yuletide/11");

const outputFile = path.resolve("/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-nov.json");

const countLimit = null;

await processFiles(gamesDirectory, outputFile, countLimit);

const endTime = new Date();
log(`Finished processing games in dir ${gamesDirectory}${countLimit ? `, with a count limit of ${countLimit}`: ""} in ${endTime - startTime}ms`);