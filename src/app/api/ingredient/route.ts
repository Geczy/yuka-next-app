import prisma from "@/lib/db";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query")?.trim();

  if (typeof query !== "string") {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const ingredients = await prisma.ingredient.findMany({
      where: {
        inci: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        dangerousnessLevel: "asc",
      },
      take: 10,
    });
    const additives = await prisma.additive.findMany({
      where: {
        code: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        dangerousnessLevel: "asc",
      },
      take: 10,
    });

    return Response.json({ additives, ingredients }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "Error fetching data" }, { status: 500 });
  }
}
