
import fs from 'fs';
import path from 'path';

const formatUniqueCounts = {
  "Fellowship Block (PC)": { },
  "Movie Block (PC)": { },
  "Expanded (PC)": { }
};

function setKey(key, value, data) {
    const iterableValues = [ "cardCount", "deckCount", "games", "losses", "wins" ];
    if (iterableValues.includes(key) && data[key]) {
      return data[key] += value;
    }
    if ( typeof value === "object" && data[key]) {
      return parseJson(value, data[key], key);
    }
    return value;
}

function parseJson(jsonToParse, data, parentKey) {
  for (const [ key, value ] of Object.entries(jsonToParse)) {
    // If the key is a card add it to each appropriate block's array of unique cards it's not already in
    if (parentKey === "cards") {
      const { category } = value.metadata;
      for (const block of Object.keys(value.blocks)) {
        if (!formatUniqueCounts[block][category]) formatUniqueCounts[block][category] = [];
        if (!formatUniqueCounts[block][category].includes(key)) formatUniqueCounts[block][category].push(key);
      }
    }

    // Set the data for this key;
    data[key] = setKey(key, value, data);
  }

  return data;
}

function applyUniqueCountsToData(data) {
  for (const format of Object.keys(data.formats)) {
    for (const category of Object.keys(data.formats[format].totals)) {
      if (category === "games") continue;
      data.formats[format].totals[category].uniqueCardCount = formatUniqueCounts[format][category].length;
    }
  }
}

function sumDataInPaths(pathArray, outputFile) {
  const data = { formats: {}, cards: {} };
  for (const filepath of pathArray) {
    console.log(`\nprocessing file at path: ${filepath}`);
    const bufferedContents = fs.readFileSync(path.resolve(filepath));
    const contents = JSON.parse(bufferedContents);

    parseJson(contents, data);
  }
  console.log(formatUniqueCounts);

  applyUniqueCountsToData(data);

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
}



const pathArray = [
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-june.json",
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-july.json",
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-aug.json",
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-sept.json",
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-oct.json",
  "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/2023-nov.json"
];

const outputFile = path.resolve("/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.json/2023 v2 metadata rollout - Yuletide/all.json");

sumDataInPaths(pathArray, outputFile);