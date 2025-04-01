"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Patient } from "@/hooks/patient/use-patient";
import {
  useCreatePatient,
  useUpdatePatient,
} from "@/hooks/patient/use-patient";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const patientFormSchema = z.object({
  firstname: z.string().min(2, {
    message: "Le prénom doit contenir au moins 2 caractères",
  }),
  lastname: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  birthdate: z.string().min(1, {
    message: "La date de naissance est requise",
  }),
  sex: z.string().min(1, {
    message: "Le sexe est requis",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide",
  }),
  phone: z.string().min(1, {
    message: "Le numéro de téléphone est requis",
  }),
  address: z.string().min(1, {
    message: "L'adresse est requise",
  }),
  medicalInfo: z.object({
    stage: z.coerce.number().int().min(1).max(5),
    status: z.string().min(1, {
      message: "Le statut est requis",
    }),
    medecin: z.string().min(1, {
      message: "Le médecin référent est requis",
    }),
    dfg: z.coerce.number().int().min(0),
    proteinurie: z.coerce.number().min(0),
  }),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  patient?: Patient;
  isEdit?: boolean;
}

export function PatientForm({ patient, isEdit = false }: PatientFormProps) {
  const { mutate: createPatient, isPending: isCreating } = useCreatePatient({
    redirectTo: "/patients",
  });

  const { mutate: updatePatient, isPending: isUpdating } = useUpdatePatient(
    patient?.id || "",
    {
      redirectTo: `/patients/${patient?.id}`,
    }
  );

  const isSubmitting = isCreating || isUpdating;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      birthdate: "",
      sex: "",
      email: "",
      phone: "",
      address: "",
      medicalInfo: {
        stage: 1,
        status: "stable",
        medecin: "",
        dfg: 0,
        proteinurie: 0,
      },
      notes: "",
    },
  });

  useEffect(() => {
    if (patient && isEdit) {
      form.reset({
        firstname: patient.firstname,
        lastname: patient.lastname,
        birthdate: patient.birthdate,
        sex: patient.sex,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        medicalInfo: {
          stage: patient.medicalInfo.stade,
          status: patient.medicalInfo.status,
          medecin: patient.medicalInfo.medecin,
          dfg: patient.medicalInfo.dfg,
          proteinurie: patient.medicalInfo.proteinurie,
        },
        notes: "",
      });
    }
  }, [patient, isEdit, form]);

  async function onSubmit(data: PatientFormValues) {
    if (isEdit && patient) {
      updatePatient(data);
    } else {
      createPatient(data);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? "Modifier le patient" : "Nouveau patient"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Informations de base du patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="01 23 45 67 89" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Adresse complète" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations médicales</CardTitle>
              <CardDescription>Données médicales du patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="medicalInfo.stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stade MRC</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value))
                        }
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Stade 1</SelectItem>
                          <SelectItem value="2">Stade 2</SelectItem>
                          <SelectItem value="3">Stade 3</SelectItem>
                          <SelectItem value="4">Stade 4</SelectItem>
                          <SelectItem value="5">Stade 5</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Stade de la maladie rénale chronique
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalInfo.status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="improving">
                            En amélioration
                          </SelectItem>
                          <SelectItem value="worsening">
                            En détérioration
                          </SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalInfo.dfg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DFG (ml/min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Débit de filtration glomérulaire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalInfo.proteinurie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protéinurie (g/24h)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalInfo.medecin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médecin référent</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/patients">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Mise à jour..." : "Enregistrement..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? "Mettre à jour" : "Enregistrer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
