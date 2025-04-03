"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/hooks/use-task";
import { createTaskSchema, Task } from "@/schemas/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePatientList } from "@/hooks/patient/use-patient";
import { useEffect, useState } from "react";

const taskSchema = createTaskSchema;

type TaskValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  isEdit?: boolean;
  patientId?: string;
  redirectTo?: string;
}

export default function TaskForm({
  task,
  isEdit = false,
  patientId,
  redirectTo = "/workflows",
}: TaskFormProps) {
  const { mutate: createTask, isPending: isCreating } = useCreateTask({
    redirectTo: redirectTo,
  });

  const { data: patients } = usePatientList();
  const [currentPatient, setCurrentPatient] = useState(patientId || "");

  useEffect(() => {
    if (patientId) {
      setCurrentPatient(patientId);
    }
  }, [patientId]);

  const handlePatientChange = (value: string) => {
    setCurrentPatient(value);
  };

  const isSubmitting = isCreating;
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      patientId: patientId || "",
    },
  });

  async function onSubmit(data: TaskValues) {
    if (isEdit && task) {
      // updateTask(data);
    } else {
      createTask(data);
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
          {isEdit ? "Modifier la Tache" : "Nouvelle Tache"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Créer une tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la tâche</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de la tâche" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Priorité de la tâche</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une priorité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="low">Basse</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Patient</FormLabel>
                      <FormControl>
                        <Select
                          value={currentPatient}
                          onValueChange={(value) => {
                            handlePatientChange(value);
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients?.data.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstname} {patient.lastname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d&apos;échéance</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigné à</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'assigné" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href={redirectTo}>Annuler</Link>
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
