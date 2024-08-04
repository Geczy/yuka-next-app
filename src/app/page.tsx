"use client";

import prisma from '@/lib/db';
import type { realmcosmeticsproduct, realmfoodproduct } from '@prisma/client';
import Image from 'next/image';
import { type FC, type FormEvent, useEffect, useMemo, useState } from "react";
import React from "react";
import useSWR from "swr";
import strings from "../assets/strings.json";
import { Button } from "./components/button";
import {
	Field,
	FieldGroup,
	Fieldset,
	Label,
	Legend,
} from "./components/fieldset";
import { Input } from "./components/input";
import { Listbox, ListboxLabel, ListboxOption } from "./components/listbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./components/table";
import { Text } from "./components/text";


const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
		return params.get("foodOnly") === "true";
	}
	return true;
};


const SearchPage: FC = () => {
	const [query, setQuery] = useState(getInitialQuery);
	const [foodOnly, setFoodOnly] = useState(getInitialFoodOnly);
  const { data, error, isLoading } = useSWR<realmfoodproduct[] | realmcosmeticsproduct[]>(
    `/api/search?query=${query}&foodOnly=${foodOnly}`,
    fetcher
  );

	const updateStateFromURL = () => {
		const params = new URLSearchParams(window.location.search);
		setQuery(params.get("query") || "");
		setFoodOnly(params.get("foodOnly") === "true");
	};

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (query) {
			params.set("query", query);
		} else {
			params.delete("query");
		}
		params.set("foodOnly", foodOnly.toString());
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}?${params}`,
		);
	}, [query, foodOnly]);

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

		window.history.pushState({}, "", `${window.location.pathname}?${params}`);

		setQuery(newQuery);
	};

	const toggleFoodOnly = () => {
		const newFoodOnly = !foodOnly;
		const params = new URLSearchParams(window.location.search);

		params.set("query", query);
		params.set("foodOnly", newFoodOnly.toString());

		window.history.pushState({}, "", `${window.location.pathname}?${params}`);

		setFoodOnly(newFoodOnly);
	};

	return (
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
						</FieldGroup>
					</Fieldset>
					<Button className="mt-4" type="submit">
						Search
					</Button>
				</form>
				{isLoading && <div>Loading...</div>}
				{error && <div className="text-red-500">Error fetching data</div>}
				<div className="flex-1">
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader />
								<TableHeader>Name</TableHeader>
								<TableHeader>Brand</TableHeader>
								<TableHeader>Grade</TableHeader>
								<TableHeader>Additives</TableHeader>
								<TableHeader>Shop</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{data?.map((hit) => {
								return <TableRow key={`term-${hit.id}`}>
									<TableCell>
										<Image
											src={`https://mgates.me/yuka/${hit.id}.jpg`}
											alt={hit.name}
											width={100}
											height={100}
										/>
									</TableCell>
									<TableCell>{hit.name}</TableCell>
									<TableCell>{hit.brand}</TableCell>
									<TableCell>{hit.grade}</TableCell>
									<TableCell>
										{("additives" in hit) && hit.additives &&
										Object.keys(hit.additives).length > 0
											? Object.keys(hit.additives)
													.map((key) => {
														const addd = strings.resources.string.find(
															(item) => item._name === `${key}_name`,
														);

														return addd ? addd.__text : key;
													})
													.join(", ")
											: ""}
										{("ingredientsList" in hit) && Array.isArray(hit?.ingredientsList) &&
										hit.ingredientsList.length > 0
											? hit.ingredientsList
													.map((key) => {
														return key.text;
													})
													.join(", ")
											: ""}
									</TableCell>
									<TableCell className="flex flex-row flex-wrap gap-2">
										<Button
											color="light"
											target="_blank"
											href={`https://www.heb.com/search?q=${hit.brand} ${hit.name}`}
										>
											HEB
										</Button>
										<Button
											color="light"
											target="_blank"
											href={`https://www.amazon.com/s?k=${hit.brand} ${hit.name}`}
										>
											Amazon
										</Button>
										<Button
											color="light"
											target="_blank"
											href={`https://www.google.com/search?q=${hit.brand} ${hit.name}`}
										>
											Google
										</Button>
									</TableCell>
								</TableRow>;
							})}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
};

export default SearchPage;
