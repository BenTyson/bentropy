"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function Submit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button size="sm" variant="outline" type="submit" disabled={disabled || pending}>
      <RefreshCw className={`w-3 h-3 mr-1 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Syncing" : "Refresh"}
    </Button>
  );
}

export function RefreshButton({
  action,
  disabled,
}: {
  action: () => Promise<unknown>;
  disabled?: boolean;
}) {
  return (
    <form action={action as unknown as (formData: FormData) => void}>
      <Submit disabled={disabled} />
    </form>
  );
}
