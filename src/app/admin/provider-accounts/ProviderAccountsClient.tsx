"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createProviderAccount,
  deleteProviderAccount,
  updateProviderAccount,
  type ProviderAccountInput,
  type ProviderAccountUpdateInput,
} from "@/lib/db/actions";
import type { ProviderAccount } from "@/lib/db/types";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { ServiceDot } from "@/components/admin/ServiceDot";
import { Tag } from "@/components/admin/Tag";

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
const COL = "100px minmax(130px,1fr) minmax(150px,1fr) minmax(120px,1fr) 64px";

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
    master_credential_id: form.master_credential_id === NONE ? null : form.master_credential_id,
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

  const credentialNameById = useMemo(
    () => new Map(credentials.map((c) => [c.id, c.name])),
    [credentials],
  );

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
      setError("Display name and external account ID are required.");
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
    if (!confirm("Delete this provider account? Integrations pointing at it will fall back to the project-scoped credential path.")) return;
    startTransition(async () => {
      try {
        await deleteProviderAccount(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-medium text-ink leading-tight" style={{ letterSpacing: "-0.3px" }}>
          Providers
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New provider
        </Btn>
      </div>

      {error && !isDialogOpen && (
        <p className="text-[13px] mb-4" style={{ color: "var(--red)" }}>{error}</p>
      )}

      <Panel pad={false}>
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span>Provider</span>
          <span>Display name</span>
          <span>External account ID</span>
          <span>Master credential</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No provider accounts yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>New provider</Btn>
          </div>
        ) : (
          <ul>
            {initial.map((account, i) => (
              <li key={account.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
                <div
                  className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                  style={{ gridTemplateColumns: COL }}
                >
                  <div className="flex items-center gap-1.5 pr-3">
                    <ServiceDot service={account.provider} />
                    <Tag>{account.provider}</Tag>
                  </div>

                  <span className="text-[13px] text-ink truncate pr-3">{account.display_name}</span>

                  <span
                    className="text-[11px] text-ink-faint truncate pr-3"
                    style={{ fontFamily: "var(--font-admin-mono)" }}
                  >
                    {account.external_account_id}
                  </span>

                  <span className="text-[13px] text-ink-muted truncate pr-3">
                    {account.master_credential_id
                      ? credentialNameById.get(account.master_credential_id) ?? "(missing)"
                      : <span className="text-ink-faint">—</span>}
                  </span>

                  <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                    <IconBtn
                      icon={<Pencil size={13} strokeWidth={1.5} />}
                      onClick={() => openEdit(account)}
                      disabled={pending}
                      title="Edit"
                    />
                    <IconBtn
                      icon={<Trash2 size={13} strokeWidth={1.5} />}
                      danger
                      onClick={() => remove(account.id)}
                      disabled={pending}
                      title="Delete"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit provider account" : "New provider account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field label="Provider">
              {editing ? (
                <div className="flex items-center gap-2 h-9">
                  <ServiceDot service={editing.provider} />
                  <span className="text-[13px] text-ink">{editing.provider}</span>
                </div>
              ) : (
                <Select
                  value={form.provider}
                  onValueChange={(v) => setForm({ ...form, provider: v, master_credential_id: NONE })}
                >
                  <SelectTrigger><SelectValue placeholder="Pick a provider" /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>

            <Field label="Display name">
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Ben Personal (Vercel)"
              />
            </Field>

            <Field label="External account ID">
              <Input
                value={form.external_account_id}
                onChange={(e) => setForm({ ...form, external_account_id: e.target.value })}
                placeholder="team_xxx / org slug / workspace id"
              />
            </Field>

            <Field label="Master credential">
              <Select
                value={form.master_credential_id}
                onValueChange={(v) => setForm({ ...form, master_credential_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
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
                <p className="text-xs text-ink-muted mt-1">
                  No credentials with service=&quot;{editing ? editing.provider : form.provider}&quot;. Add one at /admin/credentials first.
                </p>
              )}
            </Field>

            {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Btn variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Btn>
              <Btn onClick={save} disabled={pending}>
                {pending ? "Saving..." : editing ? "Save changes" : "Add provider"}
              </Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
