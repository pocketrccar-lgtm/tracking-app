import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createCategory, deleteCategory } from "@/actions/categories";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { vendors: true, products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Categories</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Group vendors + products by category.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Drift RC" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="color">Color</Label>
                <select
                  id="color"
                  name="color"
                  defaultValue="slate"
                  className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {["slate", "emerald", "blue", "amber", "purple", "red", "indigo"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-neutral-400">
            No categories yet. Add one above or run <code>npm run db:seed</code>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-neutral-100">{c.name}</div>
                  {c.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{c.description}</p>
                  )}
                  <div className="mt-3 flex gap-3 text-xs text-slate-500 dark:text-neutral-400">
                    <span>{c._count.vendors} vendors</span>
                    <span>{c._count.products} products</span>
                  </div>
                </div>
                <form action={deleteCategory.bind(null, c.id)}>
                  <Button type="submit" variant="ghost" size="icon">
                    <Trash2 className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 hover:text-red-500" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
