export function getYAxisWidth(value: string) {
  return value.toString().length * 8.5 + 8.5;
}

export function findLargestValue(data) {
  return data.reduce((max, obj) => {
    return obj.value > max ? obj.value : max;
  }, data[0].value);
}
