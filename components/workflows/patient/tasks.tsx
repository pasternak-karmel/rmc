"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoader } from "@/provider/LoaderContext";
import { Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface Data {
  tasks: Task[];
  patient: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
  }
}

type Task = {
  id: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  assignedTo: string;
};

export function PatientTasks( { data }: { data: Data }) {
  const [tasks, setTasks] = useState<Task[]>(data.tasks);

  const { startLoading, stopLoading } = useLoader();

  async function complete(id:string){
    try {
      startLoading();
      const response = await fetch(`/api/tasks/${id}`);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la résolution de l'alerte"
        );
      }
  
      const data = await response.json();
      toast.success("Tache terminée avec succès");

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, completed: true } : task
        )
      );
      stopLoading();
      return data as Task;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Une erreur inconnue s'est produite");
      toast.error(error.message);
      throw error;
    }
  }

  return (
    <div className="space-y-4">
      {tasks?.map((task: Task) => (
        <div
          key={task.id}
          className={`flex items-start justify-between p-4 rounded-lg border ${
            task.completed ? "bg-muted/30" : "bg-white dark:bg-slate-950"
          }`}
        >
          <div className="flex items-start gap-4">
            <Checkbox id={`task-${task.id}`} checked={task.completed} />
            <div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`font-medium ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </label>
                {task.priority === "high" && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
                {task.priority === "medium" && (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-200"
                  >
                    Moyen
                  </Badge>
                )}
                {task.priority === "low" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200"
                  >
                    Faible
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1">
                <Link
                  href={`/patients/${data.patient.id}`}
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={data.patient.avatar}
                      alt={data.patient.name}
                    />
                    <AvatarFallback>{data.patient.initials}</AvatarFallback>
                  </Avatar>
                  <span>{data.patient.name}</span>
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{task.dueDate}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Assigné à: {task.assignedTo}
                </div>
              </div>
            </div>
          </div>

          {!task.completed ? (
            <Button onClick={() => complete(task.id)} variant="ghost" size="sm">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Marquer comme terminée</span>
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Terminée
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
