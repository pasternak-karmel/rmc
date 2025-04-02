/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  useCreateLabResult,
  useUpdateLabResult,
} from "@/hooks/patient/use-lab-results";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

interface LabResultsDialogProps {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: any;
}

const labTestResultSchema = z.object({
  name: z.string().min(1, "Le nom du test est requis"),
  value: z.coerce.number(),
  unit: z.string().min(1, "L'unité est requise"),
  referenceMin: z.coerce.number().optional(),
  referenceMax: z.coerce.number().optional(),
  isAbnormal: z.boolean().default(false),
});

const formSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date invalide",
  }),
  results: z
    .array(labTestResultSchema)
    .min(1, "Au moins un résultat est requis"),
  labName: z.string().optional(),
  notes: z.string().optional(),
});

export function LabResultsDialog({
  patientId,
  open,
  onOpenChange,
  record,
}: LabResultsDialogProps) {
  const isEditing = !!record;
  const createLabResult = useCreateLabResult(patientId);
  const updateLabResult = useUpdateLabResult(patientId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: record
        ? format(new Date(record.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      results: record
        ? typeof record.results === "string"
          ? JSON.parse(record.results)
          : record.results
        : [
            {
              name: "",
              value: "",
              unit: "",
              referenceMin: "",
              referenceMax: "",
              isAbnormal: false,
            },
          ],
      labName: record?.labName || "",
      notes: record?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "results",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const processedValues = {
      ...values,
      results: values.results.map((result) => {
        let isAbnormal = result.isAbnormal;

        if (
          result.referenceMin !== undefined &&
          result.referenceMax !== undefined
        ) {
          isAbnormal =
            result.value < result.referenceMin ||
            result.value > result.referenceMax;
        }

        return {
          ...result,
          isAbnormal,
        };
      }),
    };

    if (isEditing) {
      updateLabResult.mutate(
        {
          id: record.id,
          data: processedValues,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createLabResult.mutate(processedValues, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const commonLabTests = [
    { name: "Hémoglobine", unit: "g/dL", referenceMin: 12, referenceMax: 16 },
    {
      name: "Globules blancs",
      unit: "10^9/L",
      referenceMin: 4,
      referenceMax: 10,
    },
    {
      name: "Plaquettes",
      unit: "10^9/L",
      referenceMin: 150,
      referenceMax: 400,
    },
    { name: "Créatinine", unit: "mg/dL", referenceMin: 0.6, referenceMax: 1.2 },
    { name: "Glucose", unit: "mg/dL", referenceMin: 70, referenceMax: 100 },
    {
      name: "Cholestérol total",
      unit: "mg/dL",
      referenceMin: 0,
      referenceMax: 200,
    },
    { name: "HDL", unit: "mg/dL", referenceMin: 40, referenceMax: 60 },
    { name: "LDL", unit: "mg/dL", referenceMin: 0, referenceMax: 100 },
    {
      name: "Triglycérides",
      unit: "mg/dL",
      referenceMin: 0,
      referenceMax: 150,
    },
    { name: "ALAT", unit: "U/L", referenceMin: 0, referenceMax: 40 },
    { name: "ASAT", unit: "U/L", referenceMin: 0, referenceMax: 40 },
  ];

  const addCommonLabTest = (test: any) => {
    append({
      name: test.name,
      value: 0,
      unit: test.unit,
      referenceMin: test.referenceMin,
      referenceMax: test.referenceMax,
      isAbnormal: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Modifier les résultats d'analyse"
              : "Ajouter des résultats d'analyse"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les résultats d'analyse ci-dessous."
              : "Ajoutez de nouveaux résultats d'analyse au dossier du patient."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                name="labName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laboratoire</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du laboratoire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Résultats</h3>
                <div className="flex flex-wrap gap-1">
                  {commonLabTests.map((test) => (
                    <Button
                      key={test.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addCommonLabTest(test)}
                    >
                      +{test.name}
                    </Button>
                  ))}
                </div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`results.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du test</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du test" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`results.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valeur</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="Valeur"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-24">
                        <FormField
                          control={form.control}
                          name={`results.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unité</FormLabel>
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
                        className="mb-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name={`results.${index}.referenceMin`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Valeur min</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Min"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`results.${index}.referenceMax`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Valeur max</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Max"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`results.${index}.isAbnormal`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-end space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Résultat anormal</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  append({
                    name: "",
                    value: 0,
                    unit: "",
                    referenceMin: 0,
                    referenceMax: 0,
                    isAbnormal: false,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter un résultat
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
                  createLabResult.isPending || updateLabResult.isPending
                }
              >
                {createLabResult.isPending || updateLabResult.isPending
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
