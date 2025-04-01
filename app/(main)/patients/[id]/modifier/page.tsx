"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/hooks/patient/use-patient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ id: string }>;

export default function EditPatientPage(props: { params: Params }) {
  const params = use(props.params);
  const { data: patient, isLoading, error } = usePatient(params.id);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href={`/patients/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier le patient
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">
            {error.message ||
              "Une erreur est survenue lors du chargement des données du patient"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href={`/patients/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier le patient
          </h1>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <div className="flex justify-end gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return <PatientForm patient={patient} isEdit={true} />;
}
