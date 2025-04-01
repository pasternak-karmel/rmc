"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";

type Appointment = {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  virtual: boolean;
  avatar: string;
  initials: string;
};

export function UpcomingAppointments({
  appointments,
}: {
  appointments: Appointment[];
}) {
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={appointment.avatar} alt={appointment.patient} />
              <AvatarFallback>{appointment.initials}</AvatarFallback>
            </Avatar>

            <div>
              <Link
                href={`/patients/${appointment.patientId}`}
                className="font-medium hover:underline"
              >
                {appointment.patient}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{appointment.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{appointment.time}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {appointment.virtual && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"
              >
                <Video className="h-3 w-3" />
                <span>Virtuel</span>
              </Badge>
            )}
            <Badge variant="secondary">{appointment.type}</Badge>
          </div>
        </div>
      ))}

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/rendez-vous">Voir tous les rendez-vous</Link>
        </Button>
      </div>
    </div>
  );
}
