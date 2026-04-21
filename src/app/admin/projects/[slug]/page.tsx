import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Key, Server, GitBranch, FileText, Plug, Plus, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationCard } from "@/components/admin/IntegrationCard";
import { Pill } from "@/components/admin/Pill";
import type { PillTone } from "@/components/admin/Pill";
import { getProjectBySlug } from "@/lib/db/queries";
import type { Integration, ProjectStatus } from "@/lib/db/types";

type LocalIntegration = Extract<Integration, { type: "local" }>;

type LocalDevEntry = {
  id: string;
  name: string;
  port: number;
  startCommand: string | null;
  notes: string | null;
  isActive: boolean | null;
};

export const dynamic = "force-dynamic";

const statusTone: Record<ProjectStatus, PillTone> = {
  active: "active",
  shipped: "shipped",
  concept: "concept",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rollup = await getProjectBySlug(slug);
  if (!rollup) notFound();

  const { project, credentials, repositories, localServices, notes, integrations } = rollup;

  const localIntegrations = integrations.filter(
    (i): i is LocalIntegration => i.type === "local",
  );
  const syncedIntegrations = integrations.filter((i) => i.type !== "local");

  const localDevEntries: LocalDevEntry[] = [
    ...localServices.map((svc) => ({
      id: svc.id,
      name: svc.name,
      port: svc.port,
      startCommand: svc.start_command,
      notes: svc.notes,
      isActive: svc.is_active,
    })),
    ...localIntegrations.map((i) => ({
      id: i.id,
      name: i.display_name ?? "Dev server",
      port: i.config.port,
      startCommand: i.config.start_command ?? null,
      notes: null,
      isActive: null,
    })),
  ].sort((a, b) => a.port - b.port);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Projects
      </Link>

      {/* Card 1: Hero */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <p className="text-muted-foreground">{project.tagline}</p>
            </div>
            <Pill tone={statusTone[project.status]}>{project.status}</Pill>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(project.primary_domain || project.demo_url || project.repo_url) && (
            <div className="flex flex-wrap gap-4">
              {project.primary_domain && (
                <a
                  href={`https://${project.primary_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {project.primary_domain}
                </a>
              )}
              {project.demo_url && !project.primary_domain && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Demo
                </a>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Github className="w-3.5 h-3.5" />
                  {project.repo_url.replace("https://github.com/", "")}
                </a>
              )}
            </div>
          )}
          {project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tech_stack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Created {new Date(project.created_at).toLocaleDateString()} · Updated{" "}
            {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Integrations</CardTitle>
            </div>
            <Link href={`/admin/projects/${project.slug}/integrations/new`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add integration
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {syncedIntegrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No integrations yet. Add one to start tracking live status.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {syncedIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  projectSlug={project.slug}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <CardTitle>Credentials</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credentials linked to this project.</p>
          ) : (
            <div className="divide-y">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{cred.name}</div>
                    <div className="text-xs text-muted-foreground">{cred.service}</div>
                    {cred.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5">{cred.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-[var(--font-admin-mono)] text-muted-foreground">••••••••</span>
                    {cred.expires_at && (
                      <Badge variant="outline" className="text-xs">
                        exp {new Date(cred.expires_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 4: Repositories */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <CardTitle>Repositories</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {repositories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repositories linked to this project.</p>
          ) : (
            <div className="divide-y">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{repo.name}</div>
                    {repo.category && (
                      <div className="text-xs text-muted-foreground">{repo.category}</div>
                    )}
                    {repo.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5">{repo.notes}</div>
                    )}
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline shrink-0"
                  >
                    <Github className="w-3 h-3" />
                    {repo.url.replace("https://github.com/", "")}
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 5: Local Dev */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Local Dev</CardTitle>
            </div>
            <Link href={`/admin/projects/${project.slug}/integrations/new`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add service
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {localDevEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No local services configured.</p>
          ) : (
            <div className="divide-y">
              {localDevEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{entry.name}</div>
                    {entry.startCommand && (
                      <div className="text-xs font-[var(--font-admin-mono)] text-muted-foreground mt-0.5">
                        {entry.startCommand}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5">{entry.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`http://localhost:${entry.port}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-[var(--font-admin-mono)] [font-variant-numeric:tabular-nums] text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    >
                      :{entry.port}
                    </a>
                    {entry.isActive !== null && (
                      <Pill tone={entry.isActive ? "active" : "concept"}>
                        {entry.isActive ? "running" : "stopped"}
                      </Pill>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 6: Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <CardTitle>Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes for this project yet.</p>
          ) : (
            <div className="divide-y">
              {notes.map((note) => (
                <div key={note.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm">{note.title}</div>
                    {note.pinned && (
                      <Pill>pinned</Pill>
                    )}
                  </div>
                  {note.content && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
