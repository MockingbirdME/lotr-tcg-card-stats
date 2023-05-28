import { log } from 'console';


export default class Results {
  constructor(data = {}) {
    for (const key in data) {
      this[key] = data[key]
    }
    this.count = data.count || 0,
    this.wentFirstCount = data.wentFirstCount || 0,
    this.wentSecondCount = data.wentSecondCount || 0
  } // End constructor

  increaseCount(wentFirst) {
    this.count++;

    if (wentFirst) this.wentFirstCount++
    else this.wentSecondCount++
  }

  increaseFieldCount(field, key) {
    if (!this[field]) this[field] = {};

    // TODO validate field has incremental keys as children.
    if (!this[field][key]) this[field][key] = 0;

    
    this[field][key]++
  }
  
}