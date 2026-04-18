import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/db/types";
import { NewIntegrationForm } from "./NewIntegrationForm";

export const dynamic = "force-dynamic";

export default async function NewIntegrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const p = project as Pick<Project, "id" | "slug" | "name">;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={`/admin/projects/${p.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        {p.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect a service to {p.name}. Config fields vary by type.
          </p>
        </CardHeader>
        <CardContent>
          <NewIntegrationForm projectId={p.id} projectSlug={p.slug} />
        </CardContent>
      </Card>
    </div>
  );
}
