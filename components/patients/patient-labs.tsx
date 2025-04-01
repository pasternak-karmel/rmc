"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface PatientLabsProps {
  patientId: string;
}

export function PatientLabs({ patientId }: PatientLabsProps) {
  console.log(patientId);
  const renalLabs = [
    {
      id: "1",
      date: "05/04/2023",
      creatinine: { value: 180, unit: "μmol/L", trend: "up", alert: true },
      dfg: { value: 25, unit: "ml/min", trend: "down", alert: true },
      uree: { value: 15.2, unit: "mmol/L", trend: "up", alert: false },
      potassium: { value: 5.2, unit: "mmol/L", trend: "up", alert: false },
      sodium: { value: 138, unit: "mmol/L", trend: "stable", alert: false },
      calcium: { value: 2.2, unit: "mmol/L", trend: "stable", alert: false },
      phosphore: { value: 1.5, unit: "mmol/L", trend: "up", alert: false },
      proteinurie: { value: 2.5, unit: "g/24h", trend: "up", alert: true },
    },
    {
      id: "2",
      date: "01/03/2023",
      creatinine: { value: 165, unit: "μmol/L", trend: "up", alert: false },
      dfg: { value: 28, unit: "ml/min", trend: "down", alert: false },
      uree: { value: 14.5, unit: "mmol/L", trend: "up", alert: false },
      potassium: { value: 5.0, unit: "mmol/L", trend: "stable", alert: false },
      sodium: { value: 139, unit: "mmol/L", trend: "stable", alert: false },
      calcium: { value: 2.3, unit: "mmol/L", trend: "stable", alert: false },
      phosphore: { value: 1.4, unit: "mmol/L", trend: "stable", alert: false },
      proteinurie: { value: 2.2, unit: "g/24h", trend: "stable", alert: false },
    },
    {
      id: "3",
      date: "05/01/2023",
      creatinine: { value: 150, unit: "μmol/L", trend: "stable", alert: false },
      dfg: { value: 32, unit: "ml/min", trend: "stable", alert: false },
      uree: { value: 13.8, unit: "mmol/L", trend: "stable", alert: false },
      potassium: { value: 4.8, unit: "mmol/L", trend: "stable", alert: false },
      sodium: { value: 140, unit: "mmol/L", trend: "stable", alert: false },
      calcium: { value: 2.3, unit: "mmol/L", trend: "stable", alert: false },
      phosphore: { value: 1.3, unit: "mmol/L", trend: "stable", alert: false },
      proteinurie: { value: 2.0, unit: "g/24h", trend: "stable", alert: false },
    },
  ];

  const hematologyLabs = [
    {
      id: "1",
      date: "05/04/2023",
      hemoglobine: { value: 10.5, unit: "g/dL", trend: "down", alert: true },
      hematocrite: { value: 32, unit: "%", trend: "down", alert: false },
      globulesBlancs: {
        value: 6.5,
        unit: "G/L",
        trend: "stable",
        alert: false,
      },
      plaquettes: { value: 220, unit: "G/L", trend: "stable", alert: false },
      ferritine: { value: 150, unit: "μg/L", trend: "stable", alert: false },
    },
    {
      id: "2",
      date: "01/03/2023",
      hemoglobine: { value: 11.0, unit: "g/dL", trend: "stable", alert: false },
      hematocrite: { value: 33, unit: "%", trend: "stable", alert: false },
      globulesBlancs: {
        value: 6.2,
        unit: "G/L",
        trend: "stable",
        alert: false,
      },
      plaquettes: { value: 225, unit: "G/L", trend: "stable", alert: false },
      ferritine: { value: 145, unit: "μg/L", trend: "stable", alert: false },
    },
    {
      id: "3",
      date: "05/01/2023",
      hemoglobine: { value: 11.2, unit: "g/dL", trend: "stable", alert: false },
      hematocrite: { value: 34, unit: "%", trend: "stable", alert: false },
      globulesBlancs: {
        value: 6.0,
        unit: "G/L",
        trend: "stable",
        alert: false,
      },
      plaquettes: { value: 230, unit: "G/L", trend: "stable", alert: false },
      ferritine: { value: 140, unit: "μg/L", trend: "stable", alert: false },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Résultats d&apos;analyses</h3>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter des résultats
        </Button>
      </div>

      <Tabs defaultValue="renal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="renal">Fonction rénale</TabsTrigger>
          <TabsTrigger value="hematology">Hématologie</TabsTrigger>
          <TabsTrigger value="other">Autres analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="renal" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Créatinine</TableHead>
                  <TableHead>DFG</TableHead>
                  <TableHead>Urée</TableHead>
                  <TableHead>Potassium</TableHead>
                  <TableHead>Sodium</TableHead>
                  <TableHead>Protéinurie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renalLabs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell>{lab.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.creatinine.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.creatinine.value} {lab.creatinine.unit}
                        </span>
                        {lab.creatinine.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.creatinine.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {lab.creatinine.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        {lab.creatinine.alert && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.dfg.alert ? "font-bold text-destructive" : ""
                          }
                        >
                          {lab.dfg.value} {lab.dfg.unit}
                        </span>
                        {lab.dfg.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {lab.dfg.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.dfg.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        {lab.dfg.alert && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.uree.alert ? "font-bold text-destructive" : ""
                          }
                        >
                          {lab.uree.value} {lab.uree.unit}
                        </span>
                        {lab.uree.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.uree.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {lab.uree.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.potassium.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.potassium.value} {lab.potassium.unit}
                        </span>
                        {lab.potassium.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.potassium.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {lab.potassium.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.sodium.alert ? "font-bold text-destructive" : ""
                          }
                        >
                          {lab.sodium.value} {lab.sodium.unit}
                        </span>
                        {lab.sodium.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.sodium.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.sodium.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.proteinurie.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.proteinurie.value} {lab.proteinurie.unit}
                        </span>
                        {lab.proteinurie.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.proteinurie.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {lab.proteinurie.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        {lab.proteinurie.alert && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="hematology" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hémoglobine</TableHead>
                  <TableHead>Hématocrite</TableHead>
                  <TableHead>Globules blancs</TableHead>
                  <TableHead>Plaquettes</TableHead>
                  <TableHead>Ferritine</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hematologyLabs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell>{lab.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.hemoglobine.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.hemoglobine.value} {lab.hemoglobine.unit}
                        </span>
                        {lab.hemoglobine.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {lab.hemoglobine.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.hemoglobine.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        {lab.hemoglobine.alert && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.hematocrite.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.hematocrite.value} {lab.hematocrite.unit}
                        </span>
                        {lab.hematocrite.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {lab.hematocrite.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.hematocrite.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.globulesBlancs.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.globulesBlancs.value} {lab.globulesBlancs.unit}
                        </span>
                        {lab.globulesBlancs.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.globulesBlancs.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.globulesBlancs.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.plaquettes.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.plaquettes.value} {lab.plaquettes.unit}
                        </span>
                        {lab.plaquettes.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                        {lab.plaquettes.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.plaquettes.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            lab.ferritine.alert
                              ? "font-bold text-destructive"
                              : ""
                          }
                        >
                          {lab.ferritine.value} {lab.ferritine.unit}
                        </span>
                        {lab.ferritine.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {lab.ferritine.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        {lab.ferritine.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <div className="flex items-center justify-center h-40 border rounded-md">
            <p className="text-muted-foreground">
              Aucune autre analyse disponible
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
