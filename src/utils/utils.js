import { customAlphabet } from 'nanoid';
import { ROOM_CODE_LENGTH, ROOM_CODE_SYMBOLS } from '../const/game';

// Shuffles and array 'randomly', based on the knuth algorithm
// Modifies the actual array

const shuffle = (arr) => {
  let currIdx = arr.length;
  let randomIdx;

  while (currIdx != 0) {
    randomIdx = Math.floor(Math.random() * currIdx);
    currIdx--;

    const temp = arr[currIdx];
    arr[currIdx] = arr[randomIdx];
    arr[randomIdx] = temp;
  }
  return arr;
};

const nanoId = customAlphabet(ROOM_CODE_SYMBOLS, ROOM_CODE_LENGTH);

export { shuffle, nanoId };
