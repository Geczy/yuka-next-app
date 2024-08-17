import prisma from "@/lib/db";
import type { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const query = body.query?.trim();
  const foodOnly = body.foodOnly;
  const minGrade = Number.parseInt(body.minGrade || "80");
  const maxGrade = Number.parseInt(body.maxGrade || "100");
  const page = Number.parseInt(body.page || "1");
  const orderBy = body.orderBy || "grade";
  const limit = Number.parseInt(body.limit || "10");

  if (
    typeof query !== "string" ||
    typeof foodOnly !== "boolean" ||
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

  if (orderBy !== "grade" && orderBy !== "proteins") {
    return Response.json(
      { error: "Invalid orderBy parameter" },
      { status: 400 },
    );
  }

  const foodOnlyBool = foodOnly === true;
  const offset = (page - 1) * limit;

  try {
    let result;

    if (orderBy === "proteins") {
      result = await prisma.realmfoodproduct.aggregateRaw({
        pipeline: [
          {
            $match: {
              $and: [
                {
                  $or: [
                    { name: { $regex: query, $options: "i" } },
                    { brand: { $regex: query, $options: "i" } },
                  ],
                },
                { grade: { $gte: minGrade, $lte: maxGrade } },
              ],
            },
          },
          {
            $addFields: {
              id: {
                $toString: "$_id",
              },
              proteinsPerServing: {
                $multiply: ["$proteins", { $divide: ["$servingSize", 100] }],
              },
            },
          },
          {
            $sort: { proteinsPerServing: -1 },
          },
          {
            $skip: offset,
          },
          {
            $limit: limit + 1,
          },
        ],
      });
    } else {
      result = foodOnlyBool
        ? await prisma.realmfoodproduct.findMany({
            where: {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  brand: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
              grade: {
                gte: minGrade,
                lte: maxGrade,
              },
            },
            orderBy: {
              [orderBy]: "desc",
            },
            skip: offset,
            take: limit + 1,
          })
        : await prisma.realmcosmeticsproduct.findMany({
            where: {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  brand: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
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
    }

    if (!result || !Array.isArray(result)) {
      return Response.json({ error: "No results found" }, { status: 404 });
    }

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
