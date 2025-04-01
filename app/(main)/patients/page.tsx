"use client";

import { PatientList } from "@/components/patients/patient-list";
import { PatientSearch } from "@/components/patients/patient-search";
import { Button } from "@/components/ui/button";
import type { PatientQueryParams } from "@/hooks/patient/use-patient";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PatientPage() {
  const [queryParams, setQueryParams] = useState<PatientQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <Link href="/patients/nouveau">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau patient
          </Button>
        </Link>
      </div>

      <PatientSearch
        onSearch={(search) =>
          setQueryParams((prev) => ({ ...prev, search, page: 1 }))
        }
        onFilterChange={(filters) =>
          setQueryParams((prev) => ({ ...prev, ...filters, page: 1 }))
        }
      />

      <PatientList
        queryParams={queryParams}
        onPageChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
        onSortChange={(sortBy, sortOrder) =>
          setQueryParams((prev) => ({ ...prev, sortBy, sortOrder }))
        }
      />
    </div>
  );
}
