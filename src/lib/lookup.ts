import strings from "@/assets/strings.json";

export function separator(inputValue: string) {
  const inputValues = inputValue
    .replaceAll("/", ",") // Replace / with a comma
    .replaceAll(".", ",") // Replace . with a comma
    .replaceAll(": ", ",") // Replace ": " with a comma
    .replaceAll(" or ", ",") // Replace " or " with a comma
    .replaceAll(" and ", ",") // Replace " and " with a comma
    .replaceAll(" from ", "") // Remove " from "
    .replace(/[^\w\s,()]/g, "") // Remove special characters like ®
    .split(/,(?![^\(]*\))/) // Split by commas not inside parentheses
    .flatMap((value) => {
      // Handle cases with parentheses by splitting them
      const parts = value
        .replace(/(as\s)/gi, ",") // Replace "as" with a comma to split the phrase
        .split(/[\(\)]/) // Split by parentheses
        .map((v) => v.trim().toLowerCase()); // Trim and convert to lowercase
      return parts;
    })
    .flatMap((value) => value.split(",").map((v) => v.trim())) // Split by comma and trim each part
    .flatMap((value) => value.split(":").map((v) => v.trim())) // Split by : and trim each part
    .filter((value) => value.length > 0) // Remove empty strings
    .map((value) => value.replace(/^\d+\s*\w+\s*/, "")); // Remove prefix units but keep the ingredient

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
