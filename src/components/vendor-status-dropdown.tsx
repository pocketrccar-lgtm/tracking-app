"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { VENDOR_STATUSES, VENDOR_STATUS_LABELS, STATUS_COLORS, type VendorStatus } from "@/lib/enums";
import { updateVendorStatus } from "@/actions/vendors";
import { toast } from "sonner";

export function VendorStatusDropdown({
  vendorId,
  currentStatus,
}: {
  vendorId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [, startTransition] = useTransition();

  const handle = (next: string) => {
    setStatus(next);
    startTransition(async () => {
      try {
        await updateVendorStatus(vendorId, next);
        toast.success(`Status → ${VENDOR_STATUS_LABELS[next as VendorStatus] ?? next}`);
      } catch (e) {
        toast.error("Failed to update status");
        setStatus(currentStatus);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">
          <Badge variant="outline" className={STATUS_COLORS[status as VendorStatus] ?? ""}>
            {VENDOR_STATUS_LABELS[status as VendorStatus] ?? status}
          </Badge>
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {VENDOR_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handle(s)}>
            <Badge variant="outline" className={STATUS_COLORS[s] ?? ""}>
              {VENDOR_STATUS_LABELS[s]}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
