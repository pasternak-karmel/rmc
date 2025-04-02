"use client";

import { VitalSignsList } from "./vital-signs/vital-signs-list";

interface PatientVitalsProps {
  patientId: string;
}

export function PatientVitals({ patientId }: PatientVitalsProps) {
  return <VitalSignsList patientId={patientId} />;
}
