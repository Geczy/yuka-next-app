import prisma from "@/lib/db";
import { lookupAdditive, separator } from "@/lib/lookup";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query")?.trim();

  if (typeof query !== "string" || !query) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  if (!query.length) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const queryArray = separator(query);
    const ingredients = await prisma.ingredient.findMany({
      where: {
        OR: queryArray.map((value) => ({
          inci: {
            equals: value,
            mode: "insensitive",
          },
        })),
      },
      orderBy: {
        dangerousnessLevel: "asc",
      },
      take: 15,
    });
    const additives = await prisma.additive.findMany({
      where: {
        OR: lookupAdditive(query).map((value) => ({
          code: {
            equals: value,
            mode: "insensitive",
          },
        })),
      },
      orderBy: {
        dangerousnessLevel: "asc",
      },
      take: 15,
    });

    return Response.json({ additives, ingredients }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "Error fetching data" }, { status: 500 });
  }
}
