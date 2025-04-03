"use client";

import TaskForm from "@/components/tasks/task-form";
import { useLoader } from "@/provider/LoaderContext";
import { useEffect, useState } from "react";

export default function NewTaskPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { startLoading, stopLoading } = useLoader();

  useEffect(() => {
    startLoading();
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("patientId");
    const redirectTo = urlParams.get("redirectTo");
    if (redirectTo) setRedirectTo(redirectTo);
    if (id) {
      setPatientId(id);
    }
    setLoading(false);
    stopLoading();
  }, [startLoading, stopLoading, patientId, redirectTo]);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <TaskForm
      patientId={patientId as string}
      redirectTo={redirectTo || ("/workflows" as string)}
    />
  );
}
