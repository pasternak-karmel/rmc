"use client";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Tabs, TabsList } from "@radix-ui/react-tabs";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";

const statusOptions = [
  { value: "scheduled", label: "Planifié" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
  { value: "completed", label: "Terminé" },
  { value: "no_show", label: "Absence" },
];

const typeOptions = [
  { value: "in_person", label: "En personne" },
  { value: "virtual", label: "Virtuel" },
  { value: "phone", label: "Téléphonique" },
];

interface Appointment {
  id: string; // Assuming the appointment has an 'id' field, could be a number or string
  patient: {
    firstname: string;
    lastname: string;
    email: string;
  };
  date: string;
  title: string;
  description: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  type: "in_person" | "virtual" | "phone";
}

type FilterValues = string | Date | null;

export function AppointmentDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.type) params.append("type", filters.type);
        if (filters.search) params.append("search", filters.search);
        if (filters.startDate)
          params.append("startDate", filters.startDate.toISOString());
        if (filters.endDate)
          params.append("endDate", filters.endDate.toISOString());

        if (activeTab === "upcoming") {
          params.append("status", "scheduled,confirmed");
          params.append("startDate", new Date().toISOString());
        } else if (activeTab === "past") {
          params.append("endDate", new Date().toISOString());
        }

        const response = await fetch(`/api/appointments?${params.toString()}`);
        const data = await response.json();
        setAppointments(data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Échec de la récupération des rendez-vous", error);
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [filters, activeTab]);

  const handleFilterChange = <T extends FilterValues>(
    name: string,
    value: T
  ) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      search: "",
      startDate: null,
      endDate: null,
    });
    setActiveTab("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <Skeleton className="h-9 w-32" />
        </div>
        <Tabs defaultValue="all">
          <TabsList>
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md ml-1" />
            <Skeleton className="h-9 w-20 rounded-md ml-1" />
          </TabsList>
          <div className="mt-4 grid gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Filtres</h3>

        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-1/2 md:w-1/3">
            <Input
              placeholder="Rechercher par titre ou description"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div className="w-full sm:w-1/2 md:w-1/3">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/2 md:w-1/3">
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/2 md:w-1/3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "PPP")
                  ) : (
                    <span>Date de début</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  // onChange={(date: Date | null) =>
                  //   handleFilterChange("startDate", date ? date : null)
                  // }
                  value={filters.startDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full sm:w-1/2 md:w-1/3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "PPP")
                  ) : (
                    <span>Date de fin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  // onChange={(date: Date | null) =>
                  //   handleFilterChange("endDate", date)
                  // }
                  value={filters.endDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun rendez-vous trouvé</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {appointment.patient.firstname}{" "}
                        {appointment.patient.lastname}
                      </span>
                      <span className="text-sm text-gray-500">
                        {appointment.patient.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(appointment.date).toLocaleDateString()}{" "}
                    {new Date(appointment.date).toLocaleTimeString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="font-medium">{appointment.title}</div>
                <div className="text-sm text-gray-700">
                  {appointment.description}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <span>Statut: {appointment.status}</span>
                <span>
                  Type:{" "}
                  {
                    typeOptions.find(
                      (option) => option.value === appointment.type
                    )?.label
                  }
                </span>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
