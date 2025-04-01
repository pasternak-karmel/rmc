"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import Link from "next/link";

interface WorkflowTasksProps {
  workflowId: string;
}

export function WorkflowTasks({ workflowId }: WorkflowTasksProps) {
  console.log(workflowId);
  const tasks = [
    {
      id: "1",
      title: "Vérifier les résultats d'analyse",
      patient: {
        id: "2",
        name: "Sophie Laurent",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SL",
      },
      dueDate: "Aujourd'hui",
      priority: "high",
      completed: false,
      assignedTo: "Dr. Martin Lefèvre",
    },
    {
      id: "2",
      title: "Ajuster le traitement antihypertenseur",
      patient: {
        id: "2",
        name: "Sophie Laurent",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SL",
      },
      dueDate: "Aujourd'hui",
      priority: "high",
      completed: false,
      assignedTo: "Dr. Martin Lefèvre",
    },
    {
      id: "3",
      title: "Planifier une consultation avec le néphrologue",
      patient: {
        id: "5",
        name: "Philippe Moreau",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "PM",
      },
      dueDate: "Demain",
      priority: "medium",
      completed: false,
      assignedTo: "Dr. Sophie Moreau",
    },
    {
      id: "4",
      title: "Vérifier le niveau de potassium",
      patient: {
        id: "5",
        name: "Philippe Moreau",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "PM",
      },
      dueDate: "Aujourd'hui",
      priority: "high",
      completed: false,
      assignedTo: "Dr. Martin Lefèvre",
    },
    {
      id: "5",
      title: "Évaluer la fonction rénale",
      patient: {
        id: "7",
        name: "Robert Lefebvre",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "RL",
      },
      dueDate: "Dans 3 jours",
      priority: "medium",
      completed: false,
      assignedTo: "Dr. Martin Lefèvre",
    },
    {
      id: "6",
      title: "Discuter des options de dialyse",
      patient: {
        id: "5",
        name: "Philippe Moreau",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "PM",
      },
      dueDate: "Dans 1 semaine",
      priority: "medium",
      completed: false,
      assignedTo: "Dr. Sophie Moreau",
    },
    {
      id: "7",
      title: "Vérifier l'adhérence au traitement",
      patient: {
        id: "9",
        name: "Jeanne Dubois",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JD",
      },
      dueDate: "Dans 2 jours",
      priority: "low",
      completed: false,
      assignedTo: "Dr. Martin Lefèvre",
    },
  ];

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
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
                  href={`/patients/${task.patient.id}`}
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={task.patient.avatar}
                      alt={task.patient.name}
                    />
                    <AvatarFallback>{task.patient.initials}</AvatarFallback>
                  </Avatar>
                  <span>{task.patient.name}</span>
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

          <Button variant="ghost" size="sm">
            Marquer comme terminée
          </Button>
        </div>
      ))}
    </div>
  );
}
