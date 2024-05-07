function customHash(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + value.charCodeAt(i);
    hash = hash & hash;
  }

  return Math.abs(hash);
}

export function getColor(value: string, arrayLength: number) {
  const hashValue = customHash(value);
  const index = hashValue % arrayLength;
  return index;
}

//  const myArray = Array.from({ length: 100 }, (_, i) => i);
// const myString = "example_string";
// const index = getIndex(myString, myArray.length);
