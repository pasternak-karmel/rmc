"use client";

import { LabResultsList } from "./lab-results/lab-results-list";

interface PatientLabsProps {
  patientId: string;
}

export function PatientLabs({ patientId }: PatientLabsProps) {
  return <LabResultsList patientId={patientId} />;
}
