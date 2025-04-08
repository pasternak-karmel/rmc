"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePatient } from "@/hooks/patient/use-patient";
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AppointmentAutomationProps {
  patientId: string;
}

export function AppointmentAutomation({
  patientId,
}: AppointmentAutomationProps) {
  const { data: patient } = usePatient(patientId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    duration: "30",
    type: "consultation",
    location: "Cabinet médical",
    notes: "",
    sendConfirmation: true,
    sendReminder: true,
  });

  const handleCreateAppointment = async () => {
    try {
      if (!appointmentData.date || !appointmentData.time) {
        toast.error("La date et l'heure sont requises");
        return;
      }
      const dateTime = new Date(
        `${appointmentData.date}T${appointmentData.time}`
      );

      if (dateTime <= new Date()) {
        toast.error("La date du rendez-vous doit être dans le futur");
        return;
      }

      toast.loading("Création du rendez-vous en cours...");

      const response = await fetch(`/api/patients/${patientId}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          doctorId: "current-user",
          title: `Rendez-vous: ${appointmentData.type}`,
          description: appointmentData.notes,
          date: dateTime.toISOString(),
          duration: Number.parseInt(appointmentData.duration),
          location: appointmentData.location,
          type: appointmentData.type,
          sendConfirmation: appointmentData.sendConfirmation,
          sendReminder: appointmentData.sendReminder,
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error creating appointment:", errorData);
        throw new Error("Failed to create appointment");
      }

      toast.success("Rendez-vous créé avec succès");
      setIsDialogOpen(false);

      setAppointmentData({
        date: "",
        time: "",
        duration: "30",
        type: "consultation",
        location: "Cabinet médical",
        notes: "",
        sendConfirmation: true,
        sendReminder: true,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Erreur lors de la création du rendez-vous");
    }
  };

  if (!patient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gestion des rendez-vous</CardTitle>
        <CardDescription>
          Planifiez et gérez les rendez-vous pour {patient.firstname}{" "}
          {patient.lastname}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span>Prochain rendez-vous:</span>
          </div>
          <span className="font-medium">
            {patient.medicalInfo.nextvisite
              ? new Date(patient.medicalInfo.nextvisite).toLocaleDateString(
                  "fr-FR"
                )
              : "Aucun"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>Dernier rendez-vous:</span>
          </div>
          <span className="font-medium">
            {patient.medicalInfo.lastvisite
              ? new Date(patient.medicalInfo.lastvisite).toLocaleDateString(
                  "fr-FR"
                )
              : "Aucun"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span>Email:</span>
          </div>
          <span className="font-medium">{patient.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span>Téléphone:</span>
          </div>
          <span className="font-medium">{patient.phone}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Planifier un rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Planifier un rendez-vous</DialogTitle>
              <DialogDescription>
                Créez un nouveau rendez-vous pour {patient.firstname}{" "}
                {patient.lastname}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes)</Label>
                  <Select
                    value={appointmentData.duration}
                    onValueChange={(value) =>
                      setAppointmentData({
                        ...appointmentData,
                        duration: value,
                      })
                    }
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Durée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={appointmentData.type}
                    onValueChange={(value) =>
                      setAppointmentData({ ...appointmentData, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="suivi">Suivi</SelectItem>
                      <SelectItem value="examen">Examen</SelectItem>
                      <SelectItem value="urgence">Urgence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={appointmentData.location}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      location: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={appointmentData.notes}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Informations supplémentaires pour le rendez-vous"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="sendConfirmation"
                    className="flex items-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Envoyer une confirmation</span>
                  </Label>
                  <Switch
                    id="sendConfirmation"
                    checked={appointmentData.sendConfirmation}
                    onCheckedChange={(checked) =>
                      setAppointmentData({
                        ...appointmentData,
                        sendConfirmation: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="sendReminder"
                    className="flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Envoyer un rappel (24h avant)</span>
                  </Label>
                  <Switch
                    id="sendReminder"
                    checked={appointmentData.sendReminder}
                    onCheckedChange={(checked) =>
                      setAppointmentData({
                        ...appointmentData,
                        sendReminder: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateAppointment}>
                <Send className="mr-2 h-4 w-4" />
                Créer le rendez-vous
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
