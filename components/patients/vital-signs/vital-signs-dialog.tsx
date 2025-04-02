"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateVitalSign,
  useUpdateVitalSign,
} from "@/hooks/patient/use-vital-signs";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

interface VitalSignsDialogProps {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record?: any;
}

const vitalSignSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  value: z.coerce.number().min(0, "La valeur doit être positive"),
  unit: z.string().min(1, "L'unité est requise"),
});

const formSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date invalide",
  }),
  measurements: z
    .array(vitalSignSchema)
    .min(1, "Au moins une mesure est requise"),
  notes: z.string().optional(),
});

export function VitalSignsDialog({
  patientId,
  open,
  onOpenChange,
  record,
}: VitalSignsDialogProps) {
  const isEditing = !!record;
  const createVitalSign = useCreateVitalSign(patientId);
  const updateVitalSign = useUpdateVitalSign(patientId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: record
        ? format(new Date(record.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      measurements: record
        ? typeof record.measurements === "string"
          ? JSON.parse(record.measurements)
          : record.measurements
        : [{ type: "", value: "", unit: "" }],
      notes: record?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "measurements",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateVitalSign.mutate(
        {
          id: record.id,
          data: values,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createVitalSign.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const commonVitalSigns = [
    { type: "Pression artérielle systolique", unit: "mmHg" },
    { type: "Pression artérielle diastolique", unit: "mmHg" },
    { type: "Fréquence cardiaque", unit: "bpm" },
    { type: "Température", unit: "°C" },
    { type: "Saturation en oxygène", unit: "%" },
    { type: "Fréquence respiratoire", unit: "resp/min" },
    { type: "Poids", unit: "kg" },
    { type: "Taille", unit: "cm" },
    { type: "IMC", unit: "kg/m²" },
    { type: "Glycémie", unit: "mg/dL" },
  ];

  const addCommonVitalSign = (type: string, unit: string) => {
    append({ type, value: 0, unit });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Modifier les constantes vitales"
              : "Ajouter des constantes vitales"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les constantes vitales ci-dessous."
              : "Ajoutez de nouvelles constantes vitales au dossier du patient."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Mesures</h3>
                <div className="flex flex-wrap gap-1">
                  {commonVitalSigns.map((vs) => (
                    <Button
                      key={vs.type}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addCommonVitalSign(vs.type, vs.unit)}
                    >
                      +{vs.type}
                    </Button>
                  ))}
                </div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-2">
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`measurements.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Type" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`measurements.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Valeur"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`measurements.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Unité" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ type: "", value: 0, unit: "" })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter une mesure
              </Button>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires"
                      className="min-h-[80px]"
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
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  createVitalSign.isPending || updateVitalSign.isPending
                }
              >
                {createVitalSign.isPending || updateVitalSign.isPending
                  ? "Enregistrement..."
                  : isEditing
                  ? "Mettre à jour"
                  : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
