"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  age: number;
  stage: number;
  lastVisit: string;
  critical: boolean;
  avatar: string;
  initials: string;
};

export function PatientOverview({ patients }: { patients: Patient[] }) {
  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <div
          key={patient.id}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback>{patient.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{patient.name}</p>
                {patient.critical && (
                  <Badge variant="destructive" className="text-xs">
                    Critique
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{patient.age} ans</span>
                <span>•</span>
                <span>Stade {patient.stage}</span>
                <span>•</span>
                <span>Vu: {patient.lastVisit}</span>
              </div>
            </div>
          </div>
          <Link href={`/patients/${patient.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
