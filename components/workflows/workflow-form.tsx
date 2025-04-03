"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateWorkflow, Workflow } from "@/hooks/patient/use-workflow";
import { createWorkflowSchema } from "@/schemas/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

  const workflowSchema = createWorkflowSchema;

  type WorkflowValues = z.infer<typeof workflowSchema>;

  interface WorkflowFormProps {
    workflow?: Workflow;
    isEdit?: boolean;
  }

export default function WorkflowForm({
  workflow,
  isEdit = false,
}: WorkflowFormProps) {
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow({
    redirectTo: "/workflows",
  });

  const isSubmitting = isCreating;

  const form = useForm<WorkflowValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: workflow,
  });

  async function onSubmit(data: WorkflowValues) {
    if (isEdit && workflow) {
    //   updatePatient(data);
    } else {
      createWorkflow(data);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/workflows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? "Modifier le Workflow" : "Nouveau Workflow"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informations du Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre du Workflow" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/workflows">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Mise à jour..." : "Enregistrement..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? "Mettre à jour" : "Enregistrer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
