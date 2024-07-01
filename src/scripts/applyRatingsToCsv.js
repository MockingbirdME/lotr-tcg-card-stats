
import fs from 'fs';
import path from 'path';

import ratings from "../lib/ratings.js";


function map(array, keys) {
  console.log(array);
  const map = {};
  if (keys) {
    for (const [ key, index ] of Object.entries(keys)) {
      map[key] = array[index];
    }
  } else {
    array.forEach((element, index) => {
      map[element] = index;
    });
  }

  return map;

}

function addRatingsToCsv(filepath) {
  console.log(`rating ${filepath}`);

  const [ headersString, ...lines ] = fs.readFileSync(filepath, 'utf8').split("\n");

  // Get our list of headers
  const headers = headersString.split(",");

  // Add each rating style to the list of headers if they're not already there
  for (const ratingStyle of Object.keys(ratings)) {
    if (!headers.includes(ratingStyle)) headers.push(ratingStyle);
  }

  // Generate a headerMap
  const headerMap = map(headers);

  // For Each Line...
  const ratedLines = lines.map(line => {
    // Get the values array
    // TODO figure out the regex tot split this more simply
    const [ name, valuesString ] = line.split('"').filter(value => value);
    const values = [ `"${name}"`, ...valuesString.split(",").filter(value => value) ];

    // Apply each rating style to the line
    for (const [ ratingStyle, applyRating ] of Object.entries(ratings)) {
      values[headerMap[ratingStyle]] = applyRating(values, headerMap);
      console.log(headerMap[ratingStyle], values[headerMap[ratingStyle]]);
    }

    // Return re-stringified version of the line
    return values.join(",");
  });

  const csvContent = [ headers.join(","), ...ratedLines ].join("\n");

  console.log(csvContent);

  fs.writeFileSync(filepath, csvContent);

}

// 2023 v2 metadata rollout - 2024 Yuletide
// const filepath = "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.csv/2023 v2 metadata rollout - Yuletide/all.csv";

// 2023 yuletide to post 2024 WC errata
const filepath = "/Users/devon/Code/personal/lotr-tcg-card-stats/src/cardData.csv/2023 yuletide to post 2024 WC errata/all.csv";

addRatingsToCsv(path.resolve(filepath));