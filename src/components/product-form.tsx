"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Vendor = { id: string; name: string };
type Category = { id: string; name: string };

type Product = {
  id?: string;
  vendorId?: string;
  name?: string;
  brand?: string | null;
  scale?: string | null;
  driftCapable?: boolean;
  ledLights?: boolean;
  bodyShell?: string | null;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
  moq?: number | null;
  inStock?: boolean;
  notes?: string | null;
  categoryId?: string | null;
};

type Props = {
  product?: Product;
  vendors: Vendor[];
  categories: Category[];
  defaultVendorId?: string;
  action: (fd: FormData) => void;
  submitLabel: string;
};

export function ProductForm({
  product,
  vendors,
  categories,
  defaultVendorId,
  action,
  submitLabel,
}: Props) {
  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={product?.name ?? ""}
              placeholder="e.g. RC Drift 4WD GTR"
            />
          </div>
          <div>
            <Label htmlFor="vendorId">Vendor *</Label>
            <select
              id="vendorId"
              name="vendorId"
              required
              defaultValue={product?.vendorId ?? defaultVendorId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              defaultValue={product?.brand ?? ""}
              placeholder="LIX MODEL / MJX / Lumo"
            />
          </div>
          <div>
            <Label htmlFor="scale">Scale</Label>
            <select
              id="scale"
              name="scale"
              defaultValue={product?.scale ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              <option value="">—</option>
              <option value="1:10">1:10</option>
              <option value="1:14">1:14</option>
              <option value="1:18">1:18</option>
              <option value="1:24">1:24</option>
              <option value="1:43">1:43</option>
              <option value="1:64">1:64</option>
            </select>
          </div>
          <div>
            <Label htmlFor="bodyShell">Body shell</Label>
            <Input
              id="bodyShell"
              name="bodyShell"
              defaultValue={product?.bodyShell ?? ""}
              placeholder="GTR / Supra / BMW / Lambo"
            />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="driftCapable"
                defaultChecked={product?.driftCapable ?? false}
                className="h-4 w-4"
              />
              Drift capable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="ledLights"
                defaultChecked={product?.ledLights ?? false}
                className="h-4 w-4"
              />
              LED lights
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="inStock"
                defaultChecked={product?.inStock ?? true}
                className="h-4 w-4"
              />
              In stock
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="wholesalePrice">Wholesale ₹</Label>
            <Input
              id="wholesalePrice"
              name="wholesalePrice"
              type="number"
              step="0.01"
              defaultValue={product?.wholesalePrice ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="retailPrice">Retail ₹</Label>
            <Input
              id="retailPrice"
              name="retailPrice"
              type="number"
              step="0.01"
              defaultValue={product?.retailPrice ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="moq">MOQ</Label>
            <Input
              id="moq"
              name="moq"
              type="number"
              defaultValue={product?.moq ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={product?.notes ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
