import 'dotenv/config.js';

import Card from "./server/classes/Card.js";

const cards = await Card.loadAllNumericIds();

console.log(JSON.stringify(cards[0], null, 2));
console.log((cards.length));
for (const card of cards) {
  console.log(card._id);

}