"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeletePatient } from "@/hooks/patient/use-patient";
import { Loader2, Trash } from "lucide-react";
import { useState } from "react";

interface DeletePatientDialogProps {
  patientId: string;
  onClose: () => void;
}

export function DeletePatientDialog({
  patientId,
  onClose,
}: DeletePatientDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deletePatient, isPending } = useDeletePatient({
    redirectTo: "/patients",
  });

  const handleDelete = () => {
    deletePatient(patientId);
    setOpen(false);
    onClose();
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le patient</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est
            irréversible et supprimera toutes les données associées à ce
            patient.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
