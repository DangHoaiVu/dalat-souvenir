import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { mapCategoryRow, type SupabaseCategoryRow } from "@/lib/map-supabase-product";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

const supabase = createAdminSupabaseClient();

const getCategoriesCached = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("category_id, name, products(count)")
      .neq("name", "Quà tặng kèm")
      .eq("products.is_for_sale", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as (SupabaseCategoryRow & {
      products?: { count: number | string }[];
    })[];

    return rows.map((row) => mapCategoryRow(row));
  },
  ["api-categories"],
  { revalidate: 300, tags: ["categories"] },
);

export async function GET() {
  try {
    const data = await getCategoriesCached();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
