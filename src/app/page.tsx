"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldGroup,
	Fieldset,
	Label,
	Legend,
} from "@/components/ui/fieldset";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
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
import { AlertCircle, ExternalLinkIcon, LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FC, type FormEvent, useEffect, useState } from "react";
import useSWR from "swr";
import strings from "../assets/strings.json";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function decodeDescription(description?: string | null): string {
	if (!description) {
		return "";
	}

	// Replace escape sequences with their corresponding characters
	return description
		.replace(/\\10/g, "\n") // \10 is often used to represent a new line
		.replace(/\\"/g, '"')
		.replace(/\\'/g, "'");
}

const getGradeCategory = (num?: number | null): string => {
	if (num === undefined || num === null) {
		return "Unknown";
	}
	if (num >= 75) {
		return "Excellent";
	}
	if (num >= 50) {
		return "Good";
	}
	if (num >= 25) {
		return "Poor";
	}
	if (num >= 0) {
		return "Bad";
	}
	if (num === -1) {
		return "NoGrade";
	}
	return "Unknown";
};

const getInitialQuery = () => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		return params.get("query") || "";
	}
	return "";
};

const getInitialFoodOnly = () => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		if (params.get("foodOnly") === undefined) {
			return true;
		}

		return params.get("foodOnly") === "true";
	}
	return true;
};

const getInitialMinGrade = () => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		return Number.parseInt(params.get("minGrade") || "80");
	}
	return 80;
};

const getInitialMaxGrade = () => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		return Number.parseInt(params.get("maxGrade") || "100");
	}
	return 100;
};

const risk = {
	1: "risk_high",
	2: "risk_medium",
	3: "risk_limited",
	4: "risk_none",
};

const riskColors: { [key: number]: BadgeProps["color"] } = {
	1: "red",
	2: "orange",
	3: "yellow",
	4: "green",
};

/*
    public static String c(Context context, int i10) {
        if (i10 == 1) {
            return context.getString(R.string.risk_high);
        }
        if (i10 == 2) {
            return context.getString(R.string.risk_medium);
        }
        if (i10 == 3) {
            return context.getString(R.string.risk_low);
        }
        if (i10 != 4) {
            return "";
        }
        return context.getString(R.string.risk_none);
    }
				*/

const ingredientRisks = {
	1: "risk_high",
	2: "risk_medium",
	3: "risk_low",
	4: "risk_none",
};

const ingredientRiskColors: { [key: number]: BadgeProps["color"] } = {
	1: "red",
	2: "orange",
	3: "yellow",
	4: "green",
};

function getIngredientRiskLabel(i10: number, strings: any) {
	const riskKey = ingredientRisks[i10];
	if (!riskKey) {
		return "";
	}
	return (
		strings.resources.string.find((i: any) => i._name === riskKey)?.__text || ""
	);
}

function getDangerousnessLabel(dangerousnessLevel: number, strings: any) {
	const riskKey = risk[dangerousnessLevel];
	if (!riskKey) {
		return "";
	}
	return (
		strings.resources.string.find((i: any) => i._name === riskKey)?.__text || ""
	);
}

// Get the color of the grade using the risk colors const riskColors
const getGradeColor = (grade?: number | null): BadgeProps["color"] => {
	if (grade === null || grade === undefined) {
		return "zinc";
	}
	if (grade >= 75) {
		return "green";
	}
	if (grade >= 50) {
		return "yellow";
	}
	if (grade >= 25) {
		return "orange";
	}
	if (grade >= 0) {
		return "red";
	}

	return "zinc";
};

const categoryDescriptions: { [key: string]: string } = {
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
	const [query, setQuery] = useState();
	const [foodOnly, setFoodOnly] = useState(true);
	const [minGrade, setMinGrade] = useState(80);
	const [maxGrade, setMaxGrade] = useState(100);
	const {
		data: { result, additives, ingredients } = {
			result: [],
			additives: [],
			ingredients: [],
		},
		error,
		isLoading,
	} = useSWR<{
		result: realmfoodproduct[] | realmcosmeticsproduct[];
		additives: additive[];
		ingredients: ingredient[];
	}>(
		`/api/search?query=${query}&foodOnly=${foodOnly}&minGrade=${minGrade}&maxGrade=${maxGrade}`,
		fetcher,
	);

	const updateStateFromURL = () => {
		const params = new URLSearchParams(window.location.search);
		setQuery(params.get("query") || "");
		setFoodOnly(
			params.get("foodOnly") === "undefined"
				? true
				: params.get("foodOnly") === "true",
		);
		setMinGrade(Number.parseInt(params.get("minGrade") || "80"));
		setMaxGrade(Number.parseInt(params.get("maxGrade") || "100"));
	};

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (query) {
			params.set("query", query);
		} else {
			params.delete("query");
		}
		params.set("foodOnly", foodOnly.toString());
		params.set("minGrade", minGrade.toString());
		params.set("maxGrade", maxGrade.toString());
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}?${params}`,
		);
	}, [query, foodOnly, minGrade, maxGrade]);

	useEffect(() => {
		const handlePopState = () => {
			updateStateFromURL();
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	const handleSearch = (e: FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const input = form.elements.namedItem("search") as HTMLInputElement;
		const newQuery = input.value;
		const params = new URLSearchParams(window.location.search);

		params.set("query", newQuery);
		params.set("foodOnly", foodOnly.toString());
		params.set("minGrade", minGrade.toString());
		params.set("maxGrade", maxGrade.toString());

		window.history.pushState({}, "", `${window.location.pathname}?${params}`);

		setQuery(newQuery);
	};

	const toggleFoodOnly = () => {
		const newFoodOnly = !foodOnly;
		const params = new URLSearchParams(window.location.search);

		params.set("query", query);
		params.set("foodOnly", newFoodOnly.toString());
		params.set("minGrade", minGrade.toString());
		params.set("maxGrade", maxGrade.toString());

		window.history.pushState({}, "", `${window.location.pathname}?${params}`);

		setFoodOnly(newFoodOnly);
	};

	return (
		<TooltipProvider delayDuration={200}>
			<div className="p-4 md:p-6 lg:p-8">
				<div className="flex flex-col space-y-8 md:flex-row md:space-y-0 md:space-x-8">
					<form onSubmit={handleSearch} className="md:w-1/3">
						<Fieldset>
							<Legend>Product search</Legend>
							<Text>By default, only showing 75 grades and above.</Text>

							<FieldGroup>
								<Field>
									<Label>Type</Label>
									<Listbox
										className="w-full md:max-w-xs"
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
								<Field>
									<Label>Name</Label>
									<Input
										defaultValue={query}
										className="w-full md:max-w-xs"
										name="search"
										placeholder="Search by product name..."
									/>
								</Field>
								<Field>
									<Label>Min Grade</Label>
									<Input
										type="number"
										min={0}
										max={100}
										defaultValue={minGrade}
										className="w-full md:max-w-xs"
										name="minGrade"
										placeholder="Minimum grade..."
										onChange={(e) =>
											setMinGrade(Number.parseInt(e.target.value))
										}
									/>
								</Field>
								<Field>
									<Label>Max Grade</Label>
									<Input
										type="number"
										min={0}
										max={100}
										defaultValue={maxGrade}
										className="w-full md:max-w-xs"
										name="maxGrade"
										placeholder="Maximum grade..."
										onChange={(e) =>
											setMaxGrade(Number.parseInt(e.target.value))
										}
									/>
								</Field>
							</FieldGroup>
						</Fieldset>
						<Button className="mt-4" type="submit">
							Search
						</Button>
					</form>
					<div className="flex flex-col space-y-6">
						{isLoading && (
							<Alert className="max-h-[80px]">
								<LoaderCircle className="h-4 w-4 animate-spin" />
								<AlertTitle>Loading</AlertTitle>
								<AlertDescription>
									Please wait while we fetch the data...
								</AlertDescription>
							</Alert>
						)}
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
						<div className="flex-1">
							<Table>
								<TableHead>
									<TableRow>
										<TableHeader />
										<TableHeader>Product</TableHeader>
										<TableHeader>Grade</TableHeader>
										<TableHeader>
											{foodOnly ? "Additives" : "Ingredients"}
										</TableHeader>
									</TableRow>
								</TableHead>
								<TableBody>
									{result?.map((hit) => {
										const sortedAdditives: typeof additives =
											"additives" in hit &&
											hit.additives
												.map((key) => {
													const addd2 = additives.find(
														(item) => item.code === key,
													);
													return addd2;
												})
												.filter(Boolean) // Remove any undefined values
												.sort(
													(a, b) =>
														(a?.dangerousnessLevel || 0) -
														(b?.dangerousnessLevel || 0),
												);

										const sortedIngredients: typeof ingredients =
											"ingredients" in hit &&
											hit.ingredients
												.map((key) => {
													const ingr2 = ingredients.find(
														(item) => item.id_ === key,
													);
													return ingr2;
												})
												.filter(Boolean) // Remove any undefined values
												.sort(
													(a, b) =>
														(a?.dangerousnessLevel || 0) -
														(b?.dangerousnessLevel || 0),
												);

										return (
											<TableRow key={`term-${hit.id}`}>
												<TableCell className="space-y-2">
													<div className="relative w-28 h-28 max-w-28">
														<Image
															src={`https://mgates.me/yuka/${hit.id}.jpg`}
															alt={hit.name}
															layout="fill"
															objectFit="contain"
															className="rounded"
														/>
													</div>
													<div className="flex flex-row flex-wrap">
														<Link
															className={cn(
																buttonVariants({
																	variant: "link",
																	size: "sm",
																}),
																"space-x-1",
															)}
															target="_blank"
															href={`https://www.heb.com/search?q=${hit.brand} ${hit.name}`}
														>
															<span>HEB</span>
															<ExternalLinkIcon className="h-3 w-3" />
														</Link>
														<Link
															className={cn(
																buttonVariants({
																	variant: "link",
																	size: "sm",
																}),
																"space-x-1",
															)}
															target="_blank"
															href={`https://www.walmart.com/search?q=${hit.brand} ${hit.name}`}
														>
															<span>Walmart</span>
															<ExternalLinkIcon className="h-3 w-3" />
														</Link>
														<Link
															className={cn(
																buttonVariants({
																	variant: "link",
																	size: "sm",
																}),
																"space-x-1",
															)}
															target="_blank"
															href={`https://www.amazon.com/s?k=${hit.brand} ${hit.name}`}
														>
															<span>Amazon</span>
															<ExternalLinkIcon className="h-3 w-3" />
														</Link>
														<Link
															className={cn(
																buttonVariants({
																	variant: "link",
																	size: "sm",
																}),
																"space-x-1",
															)}
															target="_blank"
															href={`https://www.google.com/search?q=${hit.brand} ${hit.name}`}
														>
															<span>Google</span>
															<ExternalLinkIcon className="h-3 w-3" />
														</Link>
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
												<TableCell className="flex flex-row flex-wrap items-center">
													{Array.isArray(sortedAdditives) &&
														sortedAdditives?.map((addd2) => {
															const addd = strings.resources.string.find(
																(item) => item._name === addd2?.nameKey,
															);
															const matchedDescription =
																strings.resources.string.find(
																	(i) => i._name === addd2?.shortDescriptionKey,
																);
															const matchedCategory =
																strings.resources.string.find(
																	(i) => i._name === addd2?.category,
																);
															const dangerousnessLevel =
																addd2?.dangerousnessLevel || 0;
															const riskStr = getDangerousnessLabel(
																dangerousnessLevel,
																strings,
															);
															const matchedCategoryDesc =
																getCategoryDescription(addd2?.category || "");

															return addd ? (
																<Tooltip key={addd2?.id}>
																	<TooltipTrigger>
																		<Badge
																			className="cursor-pointer my-1 mr-1"
																			color={
																				riskColors[dangerousnessLevel] || "zinc"
																			}
																		>
																			{decodeDescription(addd.__text)}
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent className="max-w-sm space-y-4">
																		<div>
																			<Heading level={1}>
																				{decodeDescription(addd.__text)}
																			</Heading>
																			<p className="space-x-2 flex-row flex items-center">
																				<Badge
																					style={{ height: 12, width: 12 }}
																					color={
																						riskColors[dangerousnessLevel] ||
																						"zinc"
																					}
																				>
																					{" "}
																				</Badge>
																				<span>{riskStr}</span>
																			</p>
																		</div>
																		<div className="flex flex-col p-3 rounded bg-slate-100">
																			<span>
																				{decodeDescription(
																					matchedCategory?.__text,
																				)}
																			</span>
																			<small>
																				{matchedCategoryDesc
																					? decodeDescription(
																							strings.resources.string.find(
																								(i) =>
																									i._name ===
																									matchedCategoryDesc.toString(),
																							)?.__text,
																						)
																					: "N/A"}
																			</small>
																		</div>

																		<p className="whitespace-pre-wrap">
																			{decodeDescription(
																				matchedDescription?.__text,
																			)}
																		</p>
																	</TooltipContent>
																</Tooltip>
															) : (
																addd2?.name
															);
														})}
													{Array.isArray(sortedIngredients) &&
														sortedIngredients?.map((ingredient) => {
															const matchedDescription =
																ingredient.description_en;
															const matchedCategory =
																strings.resources.string.find(
																	(i) => i._name === ingredient?.families[0],
																);
															const dangerousnessLevel =
																ingredient?.dangerousnessLevel || 0;
															const riskStr = getIngredientRiskLabel(
																dangerousnessLevel,
																strings,
															);
															const matchedCategoryDesc =
																getCategoryDescription(
																	ingredient?.families[0] || "",
																);

															return ingredient ? (
																<Tooltip key={ingredient?.id}>
																	<TooltipTrigger>
																		<Badge
																			className="cursor-pointer my-1 mr-1"
																			color={
																				ingredientRiskColors[
																					dangerousnessLevel
																				] || "zinc"
																			}
																		>
																			{decodeDescription(ingredient.inci)}
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent className="max-w-sm space-y-4">
																		<div>
																			<Heading level={1}>
																				{decodeDescription(ingredient.inci)}
																			</Heading>
																			<p className="space-x-2 flex-row flex items-center">
																				<Badge
																					style={{ height: 12, width: 12 }}
																					color={
																						ingredientRiskColors[
																							dangerousnessLevel
																						] || "zinc"
																					}
																				>
																					{" "}
																				</Badge>
																				<span>{riskStr}</span>
																			</p>
																		</div>
																		{ingredient.carcinogen ||
																		ingredient.allergen ||
																		ingredient.irritant ||
																		ingredient.endocrineDisruptor ? (
																			<div className="flex flex-row space-x-2">
																				{ingredient.carcinogen && (
																					<div className="p-2 rounded bg-slate-100">
																						Carcinogen
																					</div>
																				)}
																				{ingredient.allergen && (
																					<div className="p-2 rounded bg-slate-100">
																						Allergen
																					</div>
																				)}
																				{ingredient.irritant && (
																					<div className="p-2 rounded bg-slate-100">
																						Irritant
																					</div>
																				)}
																				{ingredient.endocrineDisruptor && (
																					<div className="p-2 rounded bg-slate-100">
																						Endocrine Disruptor
																					</div>
																				)}
																			</div>
																		) : null}
																		{matchedDescription ||
																		ingredient.sources.length > 0 ? (
																			<div className="max-h-[200px] overflow-auto space-y-4">
																				{matchedDescription && (
																					<p className="whitespace-pre-wrap">
																						{decodeDescription(
																							matchedDescription,
																						)}
																					</p>
																				)}

																				{ingredient.sources &&
																					ingredient.sources.length > 0 && (
																						<ul className="flex flex-col space-y-3 list-disc list-inside">
																							{ingredient.sources?.map(
																								(source, i) => (
																									<li
																										key={i}
																										className="text-wrap break-words"
																									>
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
																								),
																							)}
																						</ul>
																					)}
																			</div>
																		) : null}
																	</TooltipContent>
																</Tooltip>
															) : (
																ingredient?.name_en
															);
														})}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
};

export default SearchPage;
