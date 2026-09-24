import { cache } from "react";
import { cookies } from "next/headers";
import { rawDb } from "@/lib/db";

/**
 * Verticals = business lines sourced in one app (Pocket RC, EV Scooters, …).
 * Every page works on exactly one vertical, picked with the header switcher and
 * remembered in a cookie. All business data goes through `scopedDb`, which adds
 * the vertical to every query so one vertical can never see another's rows.
 */

import { VERTICAL_COOKIE_NAME, DEFAULT_VERTICAL_ID } from "@/lib/vertical-labels";

export const VERTICAL_COOKIE = VERTICAL_COOKIE_NAME;
export const DEFAULT_VERTICAL = DEFAULT_VERTICAL_ID;

export type VerticalRow = { id: string; name: string; color: string | null; order: number };

/** All verticals, ordered. Deduped per request. */
export const getVerticals = cache(async (): Promise<VerticalRow[]> => {
  return rawDb.vertical.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, color: true, order: true },
  });
});

/** The vertical this request works on — the cookie if it names a real vertical, else the first one. */
export const getVerticalId = cache(async (): Promise<string> => {
  const chosen = (await cookies()).get(VERTICAL_COOKIE)?.value;
  const verticals = await getVerticals();
  if (chosen && verticals.some((v) => v.id === chosen)) return chosen;
  return verticals[0]?.id ?? DEFAULT_VERTICAL;
});

// Models that carry their own `verticalId`.
const OWN_COLUMN = new Set(["vendor", "task", "category", "playbook"]);
// Models scoped through their (required) vendor relation.
const VIA_VENDOR = new Set(["product", "purchaseOrder", "interaction"]);
// Operations that take a `where` — reads, counts, aggregates and by-id writes.
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
]);

type Args = Record<string, unknown> & { where?: Record<string, unknown> };

function buildScopedDb(verticalId: string) {
  return rawDb.$extends({
    name: "vertical-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const a = { ...((args ?? {}) as Args) };
          const m = model.charAt(0).toLowerCase() + model.slice(1);
          if (OWN_COLUMN.has(m)) {
            if (WHERE_OPS.has(operation)) {
              a.where = { ...(a.where ?? {}), verticalId };
            } else if (operation === "create") {
              a.data = { ...(a.data as object), verticalId };
            } else if (operation === "createMany" || operation === "createManyAndReturn") {
              const rows = Array.isArray(a.data) ? a.data : [a.data];
              a.data = rows.map((r) => ({ ...(r as object), verticalId }));
            } else if (operation === "upsert") {
              a.where = { ...(a.where ?? {}), verticalId };
              a.create = { ...(a.create as object), verticalId };
            }
          } else if (VIA_VENDOR.has(m) && WHERE_OPS.has(operation)) {
            const vendorWhere = (a.where?.vendor ?? {}) as Record<string, unknown>;
            a.where = { ...(a.where ?? {}), vendor: { ...vendorWhere, verticalId } };
          }
          // Creates of product / purchaseOrder / interaction are checked by the
          // action (the vendorId they reference must belong to this vertical).
          return query(a as typeof args);
        },
      },
    },
  });
}

export type ScopedDb = ReturnType<typeof buildScopedDb>;

const clients = new Map<string, ScopedDb>();

/** Database client locked to one vertical. */
export function scopedDb(verticalId: string): ScopedDb {
  let c = clients.get(verticalId);
  if (!c) {
    c = buildScopedDb(verticalId);
    clients.set(verticalId, c);
  }
  return c;
}

/**
 * Foreign keys the scoping extension can't police: when a row is created or re-linked
 * with a vendor / category / product id, that id must belong to the same vertical.
 * `db` is already scoped, so a row from another vertical is simply "not found".
 */
export async function assertInVertical(
  db: ScopedDb,
  refs: { vendorId?: string | null; categoryId?: string | null; productId?: string | null },
): Promise<void> {
  const { vendorId, categoryId, productId } = refs;
  if (vendorId && !(await db.vendor.findFirst({ where: { id: vendorId }, select: { id: true } })))
    throw new Error("That vendor belongs to a different category — switch category first.");
  if (categoryId && !(await db.category.findFirst({ where: { id: categoryId }, select: { id: true } })))
    throw new Error("That sub-category belongs to a different category.");
  if (productId && !(await db.product.findFirst({ where: { id: productId }, select: { id: true } })))
    throw new Error("That product belongs to a different category.");
}

/** Scoped client + id for the current request's vertical. */
export async function scope(): Promise<{ db: ScopedDb; verticalId: string }> {
  const verticalId = await getVerticalId();
  return { db: scopedDb(verticalId), verticalId };
}

/** Shorthand: the scoped client for the current request. */
export async function vdb(): Promise<ScopedDb> {
  return scopedDb(await getVerticalId());
}
