import strings from "@/assets/strings.json";

export function separator(inputValue: string) {
  const inputValues = inputValue
    .replace(/\.$/, "") // Remove the period at the end if it exists
    .split(/,(?![^\(]*\))/) // Split by commas not inside parentheses
    .flatMap((value) => {
      // Handle cases with parentheses by splitting them
      const parts = value
        .replace(/(as\s)/gi, ",") // Replace "as" with a comma to split the phrase
        .split(/[\(\)]/) // Split by parentheses
        .map((v) => v.trim().toLowerCase());
      return parts;
    })
    .flatMap((value) => value.split(",").map((v) => v.trim())) // Split by comma if it exists within the value
    .filter((value) => value.length > 0); // Remove empty strings

  return inputValues;
}

export function lookupAdditive(inputValue: string) {
  const inputValues = separator(inputValue);

  const matchingAdditive = strings.resources.string
    .filter((i) => i.__text && i._name.endsWith("_name"))
    .filter((i) => {
      return inputValues.some(
        (value) =>
          i.__text?.toLowerCase().trim() === value.trim().toLowerCase(),
      );
    });

  const searchAdditives = matchingAdditive?.map((a) =>
    a._name.replace("_name", ""),
  );

  return searchAdditives;
}
