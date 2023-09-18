export const transform = (value) => {
  let formattedPhone = value;

  if (formattedPhone.startsWith("0")) {
    // TODO: Change local prefix
    formattedPhone = `+46${formattedPhone.substring(1)}`;
  }

  return formattedPhone.replace(" ", "").replace("-", "");
};
