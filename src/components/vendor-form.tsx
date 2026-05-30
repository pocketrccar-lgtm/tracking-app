"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  VENDOR_TYPES,
  VENDOR_TIERS,
  VENDOR_STATUSES,
  DRIFT_STATUSES,
  VENDOR_TYPE_LABELS,
  VENDOR_TIER_LABELS,
  VENDOR_STATUS_LABELS,
  DRIFT_STATUS_LABELS,
} from "@/lib/enums";
import { X, Plus } from "lucide-react";

type Vendor = {
  id?: string;
  name?: string;
  type?: string;
  tier?: string;
  status?: string;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  gst?: string | null;
  cin?: string | null;
  driftStatus?: string;
  bchRelevance?: number;
  founderName?: string | null;
  founderLinkedin?: string | null;
  founderTitle?: string | null;
  websiteUrl?: string | null;
  igHandle?: string | null;
  notes?: string | null;
  sourceMd?: string | null;
  sourceUrl?: string | null;
  phones?: { phone: string; label?: string | null }[];
  emails?: { email: string; label?: string | null }[];
};

type Props = {
  vendor?: Vendor;
  action: (fd: FormData) => void;
  submitLabel: string;
};

export function VendorForm({ vendor, action, submitLabel }: Props) {
  const [phones, setPhones] = useState<{ phone: string; label?: string | null }[]>(
    vendor?.phones?.length
      ? vendor.phones.map((p) => ({ phone: p.phone, label: p.label }))
      : [{ phone: "", label: "main" }],
  );
  const [emails, setEmails] = useState<{ email: string }[]>(
    vendor?.emails?.length
      ? vendor.emails.map((e) => ({ email: e.email }))
      : [{ email: "" }],
  );

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
              defaultValue={vendor?.name ?? ""}
              placeholder="e.g. Ratnaakar Impex"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={vendor?.type ?? "WHOLESALER"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              {VENDOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VENDOR_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="tier">Tier</Label>
            <select
              id="tier"
              name="tier"
              defaultValue={vendor?.tier ?? "T3_VERIFY_DRIFT"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              {VENDOR_TIERS.map((t) => (
                <option key={t} value={t}>
                  {VENDOR_TIER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={vendor?.status ?? "COLD"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              {VENDOR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VENDOR_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="driftStatus">Drift status</Label>
            <select
              id="driftStatus"
              name="driftStatus"
              defaultValue={vendor?.driftStatus ?? "UNKNOWN"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              {DRIFT_STATUSES.map((d) => (
                <option key={d} value={d}>
                  {DRIFT_STATUS_LABELS[d]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="bchRelevance">BCH relevance (0-10)</Label>
            <Input
              id="bchRelevance"
              name="bchRelevance"
              type="number"
              min="0"
              max="10"
              defaultValue={vendor?.bchRelevance ?? 5}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Location & Legal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              defaultValue={vendor?.state ?? ""}
              placeholder="Maharashtra"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={vendor?.city ?? ""}
              placeholder="Mumbai"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={vendor?.address ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="gst">GST</Label>
            <Input
              id="gst"
              name="gst"
              defaultValue={vendor?.gst ?? ""}
              placeholder="27AAPFT7226A"
            />
          </div>
          <div>
            <Label htmlFor="cin">CIN</Label>
            <Input
              id="cin"
              name="cin"
              defaultValue={vendor?.cin ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Phones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {phones.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                name="phone"
                defaultValue={p.phone}
                placeholder="+91-XXXXX-XXXXX"
                className="font-mono flex-1"
              />
              <select
                name="phoneLabel"
                defaultValue={p.label ?? "main"}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="main">main</option>
                <option value="whatsapp">whatsapp</option>
                <option value="wholesale">wholesale</option>
                <option value="retail">retail</option>
                <option value="founder">founder</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPhones((arr) => arr.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setPhones((arr) => [...arr, { phone: "", label: "main" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add phone
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emails.map((e, i) => (
            <div key={i} className="flex gap-2">
              <Input
                name="email"
                type="email"
                defaultValue={e.email}
                placeholder="contact@vendor.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEmails((arr) => arr.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setEmails((arr) => [...arr, { email: "" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Web</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              defaultValue={vendor?.websiteUrl ?? ""}
              placeholder="https://vendor.com"
            />
          </div>
          <div>
            <Label htmlFor="igHandle">IG handle</Label>
            <Input
              id="igHandle"
              name="igHandle"
              defaultValue={vendor?.igHandle ?? ""}
              placeholder="@vendor"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Founder</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="founderName">Name</Label>
            <Input
              id="founderName"
              name="founderName"
              defaultValue={vendor?.founderName ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="founderTitle">Title</Label>
            <Input
              id="founderTitle"
              name="founderTitle"
              defaultValue={vendor?.founderTitle ?? ""}
              placeholder="CEO / Director"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="founderLinkedin">LinkedIn</Label>
            <Input
              id="founderLinkedin"
              name="founderLinkedin"
              defaultValue={vendor?.founderLinkedin ?? ""}
              placeholder="linkedin.com/in/..."
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
            rows={5}
            defaultValue={vendor?.notes ?? ""}
            placeholder="Why this vendor matters, specific ask, verdict…"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
