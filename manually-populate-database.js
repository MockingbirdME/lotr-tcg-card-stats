import 'dotenv/config.js';

import { log } from 'console';
import fs from 'fs';
import path from 'path';

import Game from './server/classes/Game.js';
import Card from './server/classes/Card.js';
import { delay } from './server/lib/utils.js';
import { pcFormats } from './server/lib/constants.js';

let count = 0;
const startTime = new Date();

async function processFile(dir, file) {
  log(`count: ${count}`);
  // if (count > 3) {
  //   log(`skipping file ${dir}/${file}, count is already at ${count}`);
  //   return;
  // }
  log(`\n\nprocessing file ${dir}/${file}`);
  const bufferedContents = fs.readFileSync(`${dir}/${file}`);
  const contents = JSON.parse(bufferedContents);

  // if (!pcFormats.includes(contents.GameReplayInfo.format_name)) {
  //   log(`skipping file ${dir}/${file}, ${contents.GameReplayInfo.format_name} is not a PC format`);
  //   return;
  // }

  await Game.recordGame(contents, { card: { saveAsMap: true } })
    .catch(error => {
      log(`Got an error processing file name ${file}: "${error}"`);
      log(error);
    });

  log(`finished processing file ${dir}/${file}`);

  count++;

  await delay(150);
} // End async function processFile


// Make an async function that gets executed immediately
async function processFiles(dir) {
  log(`directory to process: ${dir}`);

  // Get the files as an array
  const files = await fs.promises.readdir(dir);
  log('after');
  // Loop them all with the new for...of
  for await (const file of files) {
    await processFile(dir, file);
    // throw new Error
  } // End for...of

  const cardMap = Card.getCardMap();
  log(cardMap);

  for await (const cardId of Object.keys(cardMap)) {
    console.log(`Processing card: ${cardId}`);
    const card = cardMap[cardId];
    await card.save();
    log(`Done processing card: ${cardId}`);
    await delay(101);
  }

  Card.clearCardMap();
  const updatedCardMap = Card.getCardMap();
  log(updatedCardMap);
}

const gamesDirectory = path.resolve(process.env.GAME_DIRECTORY);

await processFiles(gamesDirectory);

const endTime = new Date();
log(endTime - startTime);
