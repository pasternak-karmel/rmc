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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const medicalRecordSchema = z.object({
  type: z.string({
    required_error: "Veuillez sélectionner un type d'événement",
  }),
  title: z.string().min(2, {
    message: "Le titre doit contenir au moins 2 caractères",
  }),
  description: z.string().min(5, {
    message: "La description doit contenir au moins 5 caractères",
  }),
  date: z.string({
    required_error: "Veuillez sélectionner une date",
  }),
});

type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;

interface AddMedicalRecordProps {
  patientId: string;
  onRecordAdded?: () => void;
}

export function AddMedicalRecord({
  patientId,
  onRecordAdded,
}: AddMedicalRecordProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      type: "",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(data: MedicalRecordFormValues) {
    setIsSubmitting(true);

    try {
      console.log("New medical record:", { patientId, ...data });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Événement médical ajouté avec succès");
      form.reset();
      setOpen(false);

      if (onRecordAdded) {
        onRecordAdded();
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'événement médical");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un événement médical</DialogTitle>
          <DialogDescription>
            Enregistrez une consultation, un examen ou tout autre événement
            médical pour ce patient.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d&apos;événement</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="lab">Analyses</SelectItem>
                      <SelectItem value="medication">Traitement</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="alert">Alerte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'événement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
