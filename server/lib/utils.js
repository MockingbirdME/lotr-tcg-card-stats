
export function delay(ms) {
  return new Promise((resolve) => {
    console.log('delaying', ms)
    setTimeout(() => resolve(), ms);
  });
}
