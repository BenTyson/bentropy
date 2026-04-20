"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plug, Plus, Trash2 } from "lucide-react";
import {
  createProviderAccount,
  deleteProviderAccount,
  updateProviderAccount,
  type ProviderAccountInput,
  type ProviderAccountUpdateInput,
} from "@/lib/db/actions";
import type { ProviderAccount } from "@/lib/db/types";

type CredentialMini = {
  id: string;
  name: string;
  service: string;
  project_id: string | null;
};

const PROVIDERS = [
  "vercel",
  "supabase",
  "railway",
  "github",
  "stripe",
  "dns",
  "analytics",
] as const;

const NONE = "__none__";

interface FormState {
  provider: string;
  display_name: string;
  external_account_id: string;
  master_credential_id: string;
}

const emptyForm: FormState = {
  provider: "",
  display_name: "",
  external_account_id: "",
  master_credential_id: NONE,
};

function toInput(form: FormState): ProviderAccountInput {
  return {
    provider: form.provider,
    display_name: form.display_name,
    external_account_id: form.external_account_id,
    master_credential_id:
      form.master_credential_id === NONE ? null : form.master_credential_id,
  };
}

export function ProviderAccountsClient({
  initial,
  credentials,
}: {
  initial: ProviderAccount[];
  credentials: CredentialMini[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const filteredCredentials = useMemo(() => {
    const provider = editing ? editing.provider : form.provider;
    if (!provider) return credentials;
    return credentials.filter((c) => c.service === provider);
  }, [editing, form.provider, credentials]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(account: ProviderAccount) {
    setEditing(account);
    setForm({
      provider: account.provider,
      display_name: account.display_name,
      external_account_id: account.external_account_id,
      master_credential_id: account.master_credential_id ?? NONE,
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    if (!form.display_name || !form.external_account_id) {
      setError("Display name and external account id are required.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          const input: ProviderAccountUpdateInput = {
            display_name: form.display_name,
            external_account_id: form.external_account_id,
            master_credential_id: form.master_credential_id === NONE ? null : form.master_credential_id,
          };
          await updateProviderAccount(editing.id, input);
        } else {
          if (!form.provider) {
            setError("Provider is required.");
            return;
          }
          await createProviderAccount(toInput(form));
        }
        setIsDialogOpen(false);
        setForm(emptyForm);
        setEditing(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this provider account? Integrations pointing at it will fall back to the project-scoped credential path.")) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteProviderAccount(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const credentialNameById = new Map(credentials.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Provider Accounts</h1>
          <p className="text-muted-foreground">
            Master credentials for each parent account (Vercel team, Supabase
            org, Railway workspace, ...). Integrations point at one of these.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Provider Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Provider Account" : "Add Provider Account"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field label="Provider">
                {editing ? (
                  <Badge variant="secondary" className="w-fit">{editing.provider}</Badge>
                ) : (
                  <Select
                    value={form.provider}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        provider: value,
                        master_credential_id: NONE,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              <Field label="Display name">
                <Input
                  value={form.display_name}
                  onChange={(e) =>
                    setForm({ ...form, display_name: e.target.value })
                  }
                  placeholder="Ben Personal (Vercel)"
                />
              </Field>

              <Field label="External account id">
                <Input
                  value={form.external_account_id}
                  onChange={(e) =>
                    setForm({ ...form, external_account_id: e.target.value })
                  }
                  placeholder="team_xxx / org slug / workspace id"
                />
              </Field>

              <Field label="Master credential">
                <Select
                  value={form.master_credential_id}
                  onValueChange={(value) =>
                    setForm({ ...form, master_credential_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {filteredCredentials.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.service})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(editing ? editing.provider : form.provider) && filteredCredentials.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No credentials with service=&quot;{editing ? editing.provider : form.provider}&quot;. Add
                    one at /admin/credentials first.
                  </p>
                )}
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {initial.length === 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-muted-foreground" />
              <CardTitle>No provider accounts yet</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Register a master PAT per parent account so sync runs can resolve
              credentials without per-project duplication.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {initial.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {account.display_name}
                      </CardTitle>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {account.provider}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(account)}
                        disabled={pending}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => remove(account.id)}
                        disabled={pending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      external id:
                    </span>{" "}
                    <code className="font-mono">{account.external_account_id}</code>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      master credential:
                    </span>{" "}
                    {account.master_credential_id
                      ? credentialNameById.get(account.master_credential_id) ??
                        "(missing)"
                      : "(none — falls back to project credential)"}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
