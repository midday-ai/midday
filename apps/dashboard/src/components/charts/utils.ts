export function getYAxisWidth(value: string) {
  return value.toString().length * 7 + 2;
}

export function roundToNearestFactor(numbers: number[]) {
  if (numbers.length < 2) return numbers;

  // Sort the array
  numbers.sort((a, b) => a - b);

  // Calculate gaps
  const gaps = [];
  for (let i = 1; i < numbers.length; i++) {
    gaps.push(numbers[i] - numbers[i - 1]);
  }

  // Determine the rounding factor: using the maximum gap
  const maxGap = Math.max(...gaps);

  // Rounding factor based on maxGap, rounded to the nearest significant figure
  let roundingFactor = Math.pow(10, Math.floor(Math.log10(maxGap)));

  // Adjust rounding factor to align with 250000, 500000, 750000, etc.
  if (roundingFactor < maxGap) {
    roundingFactor = Math.ceil(maxGap / 250000) * 250000;
  }

  // Helper function to round to nearest multiple of factor
  function roundToFactor(number, factor) {
    return Math.round(number / factor) * factor;
  }

  // Round each number to the nearest rounding factor
  const roundedNumbers = numbers.map((num) =>
    roundToFactor(num, roundingFactor)
  );

  return Math.max(...roundedNumbers);
}
