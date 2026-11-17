import { connection } from "next/server";
import { getAllReviewStats } from "@/server/reviews";

/** { [productSlug]: [averageRating, reviewCount] } for product cards. Public, cached data. */
export async function GET() {
  await connection();
  try {
    const stats = await getAllReviewStats();
    return Response.json(stats, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("[reviews] stats failed:", error);
    return Response.json({}, { headers: { "Cache-Control": "no-store" } });
  }
}
