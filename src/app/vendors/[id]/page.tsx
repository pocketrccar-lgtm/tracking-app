import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TIER_COLORS,
  STATUS_COLORS,
  DRIFT_COLORS,
  TASK_STATUS_COLORS,
  PRIORITY_COLORS,
  VENDOR_TIER_LABELS,
  VENDOR_STATUS_LABELS,
  DRIFT_STATUS_LABELS,
  VENDOR_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
  type VendorTier,
  type VendorStatus,
  type DriftStatus,
  type VendorType,
  type TaskStatus,
  type TaskType,
  type TaskPriority,
} from "@/lib/enums";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  Briefcase,
  AtSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VendorStatusDropdown } from "@/components/vendor-status-dropdown";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vendor = await db.vendor.findUnique({
    where: { id },
    include: {
      phones: true,
      emails: true,
      products: { take: 8, orderBy: { updatedAt: "desc" } },
      tasks: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { assignedTo: true },
      },
      interactions: {
        take: 10,
        orderBy: { occurredAt: "desc" },
        include: { user: true },
      },
      categories: { include: { category: true } },
    },
  });

  if (!vendor) notFound();

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to vendors
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{vendor.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={TIER_COLORS[vendor.tier as VendorTier] ?? ""}
            >
              {VENDOR_TIER_LABELS[vendor.tier as VendorTier] ?? vendor.tier}
            </Badge>
            <Badge variant="outline">
              {VENDOR_TYPE_LABELS[vendor.type as VendorType] ?? vendor.type}
            </Badge>
            <Badge
              variant="outline"
              className={DRIFT_COLORS[vendor.driftStatus as DriftStatus] ?? ""}
            >
              drift: {DRIFT_STATUS_LABELS[vendor.driftStatus as DriftStatus] ?? vendor.driftStatus}
            </Badge>
            <Badge variant="outline">BCH rel: {vendor.bchRelevance}/10</Badge>
          </div>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <VendorStatusDropdown
            vendorId={vendor.id}
            currentStatus={vendor.status}
          />
          <Link
            href={`/vendors/${vendor.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {vendor.phones.length === 0 && vendor.emails.length === 0 && !vendor.websiteUrl && !vendor.igHandle ? (
              <div className="text-slate-500 dark:text-neutral-400">No contact info yet.</div>
            ) : null}
            {vendor.phones.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                <a
                  href={`tel:${p.phone}`}
                  className="font-mono hover:text-red-600"
                >
                  {p.phone}
                </a>
                {p.label && (
                  <Badge variant="outline" className="text-xs">
                    {p.label}
                  </Badge>
                )}
              </div>
            ))}
            {vendor.emails.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                <a
                  href={`mailto:${e.email}`}
                  className="hover:text-red-600"
                >
                  {e.email}
                </a>
              </div>
            ))}
            {vendor.websiteUrl && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                <a
                  href={
                    vendor.websiteUrl.startsWith("http")
                      ? vendor.websiteUrl
                      : `https://${vendor.websiteUrl}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-600 hover:underline truncate"
                >
                  {vendor.websiteUrl}
                </a>
              </div>
            )}
            {vendor.igHandle && (
              <div className="flex items-center gap-2">
                <AtSign className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                <a
                  href={`https://instagram.com/${vendor.igHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-600 hover:underline"
                >
                  @{vendor.igHandle.replace(/^@/, "")}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Location & Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(vendor.city || vendor.state || vendor.address) && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                <div className="min-w-0">
                  <div>
                    {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                  </div>
                  {vendor.address && (
                    <div className="text-xs text-slate-500 dark:text-neutral-400">
                      {vendor.address}
                    </div>
                  )}
                </div>
              </div>
            )}
            {vendor.gst && (
              <div className="text-xs">
                <span className="text-slate-500 dark:text-neutral-400">GST:</span>{" "}
                <span className="font-mono">{vendor.gst}</span>
              </div>
            )}
            {vendor.cin && (
              <div className="text-xs">
                <span className="text-slate-500 dark:text-neutral-400">CIN:</span>{" "}
                <span className="font-mono">{vendor.cin}</span>
              </div>
            )}
            {!vendor.city && !vendor.state && !vendor.gst && !vendor.cin && (
              <div className="text-slate-500 dark:text-neutral-400">Not recorded yet.</div>
            )}
          </CardContent>
        </Card>

        {(vendor.founderName || vendor.founderLinkedin) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Founder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {vendor.founderName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                  <div>
                    <div className="font-medium">{vendor.founderName}</div>
                    {vendor.founderTitle && (
                      <div className="text-xs text-slate-500 dark:text-neutral-400">
                        {vendor.founderTitle}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {vendor.founderLinkedin && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                  <a
                    href={
                      vendor.founderLinkedin.startsWith("http")
                        ? vendor.founderLinkedin
                        : `https://${vendor.founderLinkedin}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-600 hover:underline truncate"
                  >
                    {vendor.founderLinkedin}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {vendor.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 dark:text-neutral-300 whitespace-pre-line">
                {vendor.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Tasks</CardTitle>
            <Link
              href={`/tasks/new?vendorId=${vendor.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              + Add task
            </Link>
          </CardHeader>
          <CardContent>
            {vendor.tasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">No tasks yet.</p>
            ) : (
              <ul className="space-y-2">
                {vendor.tasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="flex items-start justify-between gap-2 rounded-md p-2 -mx-2 hover:bg-slate-50 dark:hover:bg-neutral-800"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">
                          {t.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {TASK_TYPE_LABELS[t.type as TaskType] ?? t.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${PRIORITY_COLORS[t.priority as TaskPriority] ?? ""}`}
                          >
                            {t.priority}
                          </Badge>
                          {t.assignedTo && (
                            <span className="text-xs text-slate-500 dark:text-neutral-400">
                              {t.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          TASK_STATUS_COLORS[t.status as TaskStatus] ?? ""
                        }
                      >
                        {TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent interactions</CardTitle>
          </CardHeader>
          <CardContent>
            {vendor.interactions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                No calls / visits / messages logged.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {vendor.interactions.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-md border border-slate-200 p-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{i.type}</span>
                      <span className="text-slate-500 dark:text-neutral-400">
                        {formatDistanceToNow(i.occurredAt, { addSuffix: true })}
                      </span>
                    </div>
                    {i.outcome && (
                      <Badge variant="outline" className="mt-1">
                        {i.outcome}
                      </Badge>
                    )}
                    {i.notes && (
                      <p className="mt-1 text-xs text-slate-700 dark:text-neutral-300">{i.notes}</p>
                    )}
                    <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                      by {i.user.name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {vendor.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {vendor.products.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <div className="font-medium text-sm">{p.name}</div>
                  {p.brand && (
                    <div className="text-xs text-slate-500 dark:text-neutral-400">{p.brand}</div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    {p.scale && (
                      <Badge variant="outline">{p.scale}</Badge>
                    )}
                    {p.driftCapable && (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                        drift
                      </Badge>
                    )}
                    {p.wholesalePrice && (
                      <span className="font-mono text-slate-700 dark:text-neutral-300">
                        ₹{p.wholesalePrice}
                      </span>
                    )}
                    {p.moq && (
                      <span className="text-slate-500 dark:text-neutral-400">MOQ {p.moq}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(vendor.sourceMd || vendor.sourceUrl) && (
        <p className="text-xs text-slate-400 dark:text-neutral-500">
          Source: {vendor.sourceMd ?? vendor.sourceUrl}
        </p>
      )}
    </div>
  );
}
