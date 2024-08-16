import strings from "@/assets/strings.json";

export function lookupAdditive(inputValue: string) {
  const inputValues = inputValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

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
