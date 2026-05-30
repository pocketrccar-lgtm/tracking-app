import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { vendors: true, products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500">Group vendors + products by category.</p>
      </div>
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            No categories yet. Seeded by the import script.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="font-medium text-slate-900">{c.name}</div>
                {c.description && (
                  <p className="mt-1 text-xs text-slate-500">{c.description}</p>
                )}
                <div className="mt-3 flex gap-3 text-xs text-slate-500">
                  <span>{c._count.vendors} vendors</span>
                  <span>{c._count.products} products</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
