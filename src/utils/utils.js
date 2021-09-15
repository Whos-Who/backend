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

export { shuffle };
