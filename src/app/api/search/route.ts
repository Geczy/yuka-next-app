import prisma from "@/lib/db";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
	const searchParams = req.nextUrl.searchParams;
	const query = searchParams.get("query")?.trim();
	const foodOnly = searchParams.get("foodOnly");

	if (typeof query !== "string" || typeof foodOnly !== "string") {
		return Response.json(
			{ error: "Invalid query parameters" },
			{ status: 400 },
		);
	}

	const foodOnlyBool = foodOnly === "true";

	try {
		const result = foodOnlyBool
			? await prisma.realmfoodproduct.findMany({
					where: {
						name: {
							contains: query,
							mode: "insensitive",
						},
						grade: {
							gte: 75,
						},
					},
					orderBy: {
						grade: "desc",
					},
				})
			: await prisma.realmcosmeticsproduct.findMany({
					where: {
						name: {
							contains: query,
							mode: "insensitive",
						},
						grade: {
							gte: 75,
						},
					},
					orderBy: {
						grade: "desc",
					},
				});
		return Response.json(result, { status: 200 });
	} catch (error) {
		console.error("Error fetching data:", error);
		return Response.json({ error: "Error fetching data" }, { status: 500 });
	}
}
