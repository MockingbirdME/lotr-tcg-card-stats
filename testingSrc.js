const array = [
"100_1",
"100_1",
"101_10",
"101_10",
"101_10",
"101_10",
"101_10",
"101_51",
"101_51",
"101_51",
"15_038",
"15_038",
"15_204",
"15_204",
"15_204",
"15_204",
"15_204",
"15_205",
"15_205",
"15_206",
"15_206",
"15_206",
"15_206",
"15_206"
];

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}
const filtered = array.filter(onlyUnique);

console.log(JSON.stringify(filtered));
console.log(filtered.length);

[ "100_1","101_10","101_51","15_038" ];