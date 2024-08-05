import prisma from "@/lib/db";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query")?.trim();
  const foodOnly = searchParams.get("foodOnly");
  const minGrade = Number.parseInt(searchParams.get("minGrade") || "80");
  const maxGrade = Number.parseInt(searchParams.get("maxGrade") || "100");
  const page = Number.parseInt(searchParams.get("page") || "1");
  const limit = Number.parseInt(searchParams.get("limit") || "10");

  if (
    typeof query !== "string" ||
    typeof foodOnly !== "string" ||
    Number.isNaN(minGrade) ||
    Number.isNaN(maxGrade) ||
    Number.isNaN(page) ||
    Number.isNaN(limit)
  ) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const foodOnlyBool = foodOnly === "true";
  const offset = (page - 1) * limit;

  try {
    const result = foodOnlyBool
      ? await prisma.realmfoodproduct.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
            grade: {
              gte: minGrade,
              lte: maxGrade,
            },
          },
          orderBy: {
            grade: "desc",
          },
          skip: offset,
          take: limit + 1,
        })
      : await prisma.realmcosmeticsproduct.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
            grade: {
              gte: minGrade,
              lte: maxGrade,
            },
          },
          orderBy: {
            grade: "desc",
          },
          skip: offset,
          take: limit + 1,
        });

    const hasMore = result.length > limit;
    if (hasMore) {
      result.pop();
    }

    const additiveCodes = new Set<string>();
    for (const product of result) {
      if ("additives" in product) {
        for (const code of product.additives) {
          additiveCodes.add(code);
        }
      }
    }

    const ingredientCodes = new Set<string>();
    for (const product of result) {
      if ("ingredients" in product) {
        for (const code of product.ingredients) {
          ingredientCodes.add(code);
        }
      }
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        id_: {
          in: Array.from(ingredientCodes),
          mode: "insensitive",
        },
      },
    });

    const additives = await prisma.additive.findMany({
      where: {
        code: {
          in: Array.from(additiveCodes),
          mode: "insensitive",
        },
      },
    });

    return Response.json(
      { result, additives, ingredients, hasMore },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "Error fetching data" }, { status: 500 });
  }
}
