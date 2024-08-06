"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, Fieldset, Label } from "@/components/ui/fieldset";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  additive,
  ingredient,
  realmcosmeticsproduct,
  realmfoodproduct,
} from "@prisma/client";
import { AlertCircle, ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import useSWR from "swr";
import strings from "../assets/strings.json";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const isIngredient = (item: additive | ingredient): item is ingredient =>
  "inci" in item;

const decodeDescription = (description?: string | null): string =>
  description
    ? description
        .replace(/\\10/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
    : "";

const getGradeCategory = (grade?: number | null): string => {
  if (grade == null) return "Unknown";
  if (grade >= 75) return "Excellent";
  if (grade >= 50) return "Good";
  if (grade >= 25) return "Poor";
  return "Bad";
};

const getInitialParams = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return {
      query: params.get("query") || "",
      foodOnly: params.get("foodOnly") !== "false",
      minGrade: Number.parseInt(params.get("minGrade") || "80"),
      maxGrade: Number.parseInt(params.get("maxGrade") || "100"),
    };
  }
  return {
    query: "",
    foodOnly: true,
    minGrade: 80,
    maxGrade: 100,
  };
};

const riskLabels: Record<number, string> = {
  1: "risk_high",
  2: "risk_medium",
  3: "risk_limited",
  4: "risk_none",
};

const riskColors: Record<number, BadgeProps["color"]> = {
  0: "zinc",
  1: "red",
  2: "orange",
  3: "yellow",
  4: "green",
};

const getRiskLabel = (level: number) => {
  const riskKey = riskLabels[level];
  return riskKey
    ? strings.resources.string.find((i) => i._name === riskKey)?.__text || ""
    : "";
};

const getGradeColor = (grade?: number | null): BadgeProps["color"] => {
  if (grade == null) return "zinc";
  if (grade >= 75) return "green";
  if (grade >= 50) return "yellow";
  if (grade >= 25) return "orange";
  return "red";
};

const categoryDescriptions: Record<string, string> = {
  additive_category_texture_agent: "additive_category_texture_agent_desc",
  additive_category_thickening: "additive_category_thickening_desc",
  additive_category_artificial_sweetener: "additive_category_sweeter_desc",
  additive_category_stabiliser_agent: "additive_category_stabilizer_agent_desc",
  additive_category_modified_starch: "additive_category_modified_starch_desc",
  additive_category_flavour_enhancer: "additive_category_flavor_enhancer_desc",
  additive_category_glazing_agent: "additive_category_glazing_agent_desc",
  additive_category_conservation_gas: "additive_category_conservation_gas_desc",
  additive_category_emulsifier: "additive_category_emulsifier_desc",
  additive_category_flavour: "additive_category_artificial_flavor_desc",
  additive_category_antioxidant: "additive_category_antioxydant_desc",
  additive_category_preservative: "additive_category_preservative_desc",
  additive_category_anti_caking_agent: "additive_category_anticaking_desc",
  additive_category_colour: "additive_category_colorant_desc",
  additive_category_enzyme: "additive_category_enzyme_desc",
  additive_category_food_acid: "additive_category_food_acid_desc",
};

const getCategoryDescription = (category: string): string | null =>
  categoryDescriptions[category] || null;

const SearchPage: FC = () => {
  const {
    query: initialQuery,
    foodOnly: initialFoodOnly,
    minGrade: initialMinGrade,
    maxGrade: initialMaxGrade,
  } = getInitialParams();

  const [lookupQuery, setLookupQuery] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [foodOnly, setFoodOnly] = useState(initialFoodOnly);
  const [minGrade, setMinGrade] = useState(initialMinGrade);
  const [maxGrade, setMaxGrade] = useState(initialMaxGrade);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const {
    data: { result, additives, ingredients, hasMore } = {
      result: [],
      additives: [],
      ingredients: [],
      hasMore: false,
    },
    error,
    isLoading,
  } = useSWR<{
    result: realmfoodproduct[] | realmcosmeticsproduct[];
    additives: additive[];
    ingredients: ingredient[];
    hasMore: boolean;
  }>(
    `/api/search?query=${query}&foodOnly=${foodOnly}&minGrade=${minGrade}&maxGrade=${maxGrade}&page=${page}&limit=${limit}`,
    fetcher,
  );

  const {
    data: { additives: lookupAdditives, ingredients: lookupIngredients } = {
      additives: [],
      ingredients: [],
    },
    error: lookupError,
    isLoading: lookupIsLoading,
  } = useSWR<{ additives: additive[]; ingredients: ingredient[] }>(
    `/api/ingredient?query=${lookupQuery}`,
    fetcher,
  );

  const updateStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("query") || "");
    setFoodOnly(params.get("foodOnly") !== "false");
    setMinGrade(Number.parseInt(params.get("minGrade") || "80"));
    setMaxGrade(Number.parseInt(params.get("maxGrade") || "100"));
    setPage(Number.parseInt(params.get("page") || "1"));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("query", query);
    params.set("foodOnly", foodOnly.toString());
    params.set("minGrade", minGrade.toString());
    params.set("maxGrade", maxGrade.toString());
    params.set("page", page.toString());
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  }, [query, foodOnly, minGrade, maxGrade, page]);

  useEffect(() => {
    const handlePopState = () => {
      updateStateFromURL();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const toggleFoodOnly = () => {
    const newFoodOnly = !foodOnly;
    const params = new URLSearchParams(window.location.search);
    params.set("query", query);
    params.set("foodOnly", newFoodOnly.toString());
    params.set("minGrade", minGrade.toString());
    params.set("maxGrade", maxGrade.toString());
    params.set("page", "1");
    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
    setFoodOnly(newFoodOnly);
    setPage(1);
  };

  const goToPage = (newPage: number) => {
    if (newPage < 1) return;
    if (newPage > page && !hasMore) return;
    setPage(newPage);
    const params = new URLSearchParams(window.location.search);
    params.set("query", query);
    params.set("foodOnly", foodOnly.toString());
    params.set("minGrade", minGrade.toString());
    params.set("maxGrade", maxGrade.toString());
    params.set("page", newPage.toString());
    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col space-y-8">
          <SearchForm
            query={query}
            setLookupQuery={setLookupQuery}
            lookupQuery={lookupQuery}
            foodOnly={foodOnly}
            minGrade={minGrade}
            maxGrade={maxGrade}
            setQuery={setQuery}
            toggleFoodOnly={toggleFoodOnly}
            setMinGrade={setMinGrade}
            setMaxGrade={setMaxGrade}
          />
          <div>
            {lookupQuery &&
              [
                ...(Array.isArray(lookupIngredients) ? lookupIngredients : []),
                ...(Array.isArray(lookupAdditives) ? lookupAdditives : []),
              ].map((ingredient) => generateTooltip(ingredient))}
          </div>
          <div className="flex flex-col space-y-6 w-full">
            {error && (
              <Alert className="max-h-[100px]" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  An error occurred while fetching the data. Please try again
                  later.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex-1 space-y-4">
              <PaginationComponent
                page={page}
                hasMore={hasMore}
                goToPage={goToPage}
              />
              <Table className="overflow-x-auto">
                <TableHead>
                  <TableRow>
                    <TableHeader />
                    <TableHeader>Product</TableHeader>
                    <TableHeader>Grade</TableHeader>
                    <TableHeader>
                      {foodOnly ? "Additives" : "Ingredients"}
                    </TableHeader>
                    <TableHeader>Links</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(isLoading || !result) && <LoadingSkeleton />}
                  {result?.map((hit) => {
                    const sortedAdditives =
                      "additives" in hit &&
                      sortAdditivesOrIngredients(hit.additives, additives);
                    const sortedIngredients =
                      "ingredients" in hit &&
                      sortAdditivesOrIngredients(hit.ingredients, ingredients);
                    return (
                      <TableRow key={`term-${hit.id}`}>
                        <TableCell>
                          <div className="relative w-28 h-28 max-w-28">
                            <Image
                              src={`https://mgates.me/yuka/${hit.id}.jpg`}
                              alt={hit.name}
                              layout="fill"
                              objectFit="contain"
                              className="rounded-xl"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row space-x-2">
                            <div className="flex flex-col">
                              <span>{hit.name}</span>
                              <small>{hit.brand}</small>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row space-x-1">
                            <div>
                              <Badge
                                style={{ height: 12, width: 12 }}
                                color={getGradeColor(hit.grade)}
                              >
                                {" "}
                              </Badge>
                            </div>
                            <div className="flex flex-col">
                              <span>{hit.grade}/100</span>
                              <span>{getGradeCategory(hit.grade)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row flex-wrap items-center max-h-[150px] overflow-auto">
                            {Array.isArray(sortedAdditives) &&
                            sortedAdditives.length > 0
                              ? sortedAdditives.map(generateTooltip)
                              : "additives" in hit && (
                                  <Badge color="zinc">No additives</Badge>
                                )}

                            {Array.isArray(sortedIngredients) &&
                            sortedIngredients.length > 0
                              ? sortedIngredients.map(generateTooltip)
                              : !("additives" in hit) && (
                                  <Badge color="zinc">No ingredients</Badge>
                                )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {generateExternalLinks(hit.brand, hit.name)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationComponent
                page={page}
                hasMore={hasMore}
                goToPage={goToPage}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

const SearchForm: FC<{
  query: string;
  lookupQuery: string;
  foodOnly: boolean;
  minGrade: number;
  maxGrade: number;
  toggleFoodOnly: () => void;
  setLookupQuery: (query: string) => void;
  setQuery: (query: string) => void;
  setMinGrade: (grade: number) => void;
  setMaxGrade: (grade: number) => void;
}> = ({
  query,
  lookupQuery,
  setLookupQuery,
  foodOnly,
  minGrade,
  maxGrade,
  setQuery,
  toggleFoodOnly,
  setMinGrade,
  setMaxGrade,
}) => (
  <form className="w-full">
    <Fieldset>
      <FieldGroup>
        <div className="flex flex-row items-center justify-between space-x-4">
          <div className="flex flex-col w-full space-y-4">
            <Field className="w-full">
              <Label>Name</Label>
              <Input
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value);
                }}
                defaultValue={query}
                name="query"
                placeholder="Search by product name..."
              />
            </Field>
            <Field className="w-full">
              <Label>Ingredient lookup</Label>
              <Input
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const matchingAdditive = strings.resources.string
                    .filter((i) => i.__text && i._name.endsWith("_name"))
                    .find((i) =>
                      i.__text
                        ?.toLowerCase()
                        .includes(e.target.value.toLowerCase().trim()),
                    );
                  const searchAdditive =
                    matchingAdditive?._name.replace("_name", "") ||
                    e.target.value;
                  setLookupQuery(searchAdditive);
                }}
                defaultValue={lookupQuery}
                name="lookupQuery"
                placeholder="Search by product name..."
              />
            </Field>
          </div>
          <Field className="w-full">
            <Label>Type</Label>
            <Listbox
              onChange={toggleFoodOnly}
              value={foodOnly ? "food" : "cosmetics"}
              name="status"
              defaultValue="food"
            >
              <ListboxOption value="food">
                <ListboxLabel>Food</ListboxLabel>
              </ListboxOption>
              <ListboxOption value="cosmetics">
                <ListboxLabel>Cosmetics</ListboxLabel>
              </ListboxOption>
            </Listbox>
          </Field>
          <Field className="w-full space-y-3">
            <Label>Min grade {minGrade}</Label>
            <Slider
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMinGrade(Number.parseInt(e.target.value))
              }
              defaultValue={[minGrade]}
              max={100}
              min={0}
              step={1}
            />
          </Field>
          <Field className="w-full space-y-3">
            <Label>Max grade {maxGrade}</Label>
            <Slider
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMaxGrade(Number.parseInt(e.target.value))
              }
              defaultValue={[maxGrade]}
              max={100}
              min={0}
              step={1}
            />
          </Field>
        </div>
      </FieldGroup>
    </Fieldset>
  </form>
);

const PaginationComponent: FC<{
  page: number;
  hasMore: boolean;
  goToPage: (page: number) => void;
}> = ({ page, hasMore, goToPage }) => (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          disabled={page === 1}
          className="cursor-pointer"
          onClick={() => goToPage(page - 1)}
          isActive={page !== 1}
        />
      </PaginationItem>
      <PaginationItem>
        <PaginationNext
          disabled={!hasMore}
          className="cursor-pointer"
          onClick={() => goToPage(page + 1)}
          isActive={hasMore}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
);

const LoadingSkeleton: FC = () => (
  <>
    {[...Array(4)].map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <div className="flex flex-col space-y-3">
            <Skeleton className="w-28 h-28 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

const sortAdditivesOrIngredients = (
  keys: string[],
  items: additive[] | ingredient[],
) =>
  keys
    .map((key) =>
      items.find((item) =>
        !isIngredient(item) ? item.code === key : item.id_ === key,
      ),
    )
    .filter(Boolean)
    .sort(
      (a, b) => (a?.dangerousnessLevel || 0) - (b?.dangerousnessLevel || 0),
    ) as (additive | ingredient)[];

const generateExternalLinks = (brand: string | null, name: string) => {
  const links = [
    {
      href: `https://www.heb.com/search?q=${brand || ""} ${name}`,
      label: "HEB",
    },
    {
      href: `https://www.walmart.com/search?q=${brand || ""} ${name}`,
      label: "Walmart",
    },
    {
      href: `https://www.amazon.com/s?k=${brand || ""} ${name}`,
      label: "Amazon",
    },
    {
      href: `https://www.google.com/search?q=${brand || ""} ${name}`,
      label: "Google",
    },
  ];

  return links.map((link) => (
    <Link
      key={link.href}
      className={cn(buttonVariants({ variant: "link", size: "sm" }))}
      target="_blank"
      href={link.href}
    >
      <span>{link.label}</span>
      <ExternalLinkIcon className="ml-2 h-3 w-3" />
    </Link>
  ));
};

const generateTooltip = (item: additive | ingredient) => {
  const isIngredientItem = isIngredient(item);
  const sources = item?.sources || [];
  const dangerousnessLevel = item?.dangerousnessLevel || 0;
  const riskStr = getRiskLabel(dangerousnessLevel);
  const description = isIngredientItem
    ? item.inci
    : strings.resources.string.find((i) => i._name === item?.nameKey)?.__text;
  const matchedDescription = isIngredientItem
    ? item?.description_en
    : strings.resources.string.find(
        (i) => i._name === item?.shortDescriptionKey,
      )?.__text;

  const IngredientSpecificContent = () =>
    isIngredientItem && (
      <div className="flex flex-row space-x-2">
        {item.carcinogen && (
          <div className="p-2 rounded bg-slate-100">Carcinogen</div>
        )}
        {item.allergen && (
          <div className="p-2 rounded bg-slate-100">Allergen</div>
        )}
        {item.irritant && (
          <div className="p-2 rounded bg-slate-100">Irritant</div>
        )}
        {item.endocrineDisruptor && (
          <div className="p-2 rounded bg-slate-100">Endocrine Disruptor</div>
        )}
      </div>
    );

  const AdditiveSpecificContent = () => {
    if (isIngredientItem) return null;

    const matchedCategory = strings.resources.string.find(
      (i) => i._name === item?.category,
    )?.__text;
    const matchedCategoryDesc = getCategoryDescription(item?.category || "");
    const categoryDesc = strings.resources.string.find(
      (i) => i._name === matchedCategoryDesc?.toString(),
    )?.__text;

    return (
      <div className="flex flex-col p-3 rounded bg-slate-100">
        <span>{decodeDescription(matchedCategory)}</span>
        <small>
          {matchedCategoryDesc ? decodeDescription(categoryDesc) : "N/A"}
        </small>
      </div>
    );
  };

  return description ? (
    <Tooltip key={item?.id}>
      <TooltipTrigger>
        <Badge
          className="cursor-pointer my-1 mr-1"
          color={riskColors[dangerousnessLevel] || "zinc"}
        >
          {decodeDescription(description)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm space-y-4">
        <div>
          <Heading level={1}>{decodeDescription(description)}</Heading>
          <p className="space-x-2 flex-row flex items-center">
            <Badge
              style={{ height: 12, width: 12 }}
              color={riskColors[dangerousnessLevel] || "zinc"}
            >
              {" "}
            </Badge>
            <span>{riskStr}</span>
          </p>
        </div>
        <IngredientSpecificContent />
        <AdditiveSpecificContent />
        <div className="max-h-[200px] overflow-auto space-y-4">
          <p className="whitespace-pre-wrap">
            {decodeDescription(matchedDescription)}
          </p>
          {sources.length > 0 && (
            <ul className="flex flex-col space-y-3 list-disc list-inside">
              {sources.map((source) => (
                <li key={source.label} className="text-wrap break-words">
                  {source.year} {source.label}{" "}
                  {source.url && (
                    <Link
                      className="text-blue-500 hover:underline"
                      target="_blank"
                      href={source.url}
                    >
                      {source.url}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  ) : isIngredientItem ? (
    item.inci
  ) : (
    item.code
  );
};

export default SearchPage;
