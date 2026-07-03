"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, ExternalLink } from "lucide-react";

type Project = {
  id: string;
  name: string;
  siteUrl: string;
};

export default function WidgetSettingsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.data?.projects ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Widget Settings</h1>
        <p className="mt-2 text-[#6B7280]">Select a project to customize its chat widget appearance.</p>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-sm text-[#6B7280]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Settings2 className="h-10 w-10 text-[#D1D5DB]" />
              <p className="text-sm text-[#6B7280]">No projects yet. Create a project first.</p>
              <Button
                className="bg-[#7C3AED] text-white hover:bg-[#5B21B6]"
                onClick={() => router.push("/projects/new")}
              >
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-[#111827]">{project.name}</h3>
                  <p className="mt-1 truncate text-sm text-[#6B7280]">{project.siteUrl || "No URL set"}</p>
                  <Button
                    className="mt-4 w-full bg-[#7C3AED] text-white hover:bg-[#5B21B6]"
                    onClick={() => router.push(`/projects/${project.id}/widget`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Widget Settings
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
