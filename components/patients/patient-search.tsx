"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface PatientSearchProps {
  onSearch: (search: string) => void;
  onFilterChange: (filters: { stage?: number; status?: string }) => void;
}

export function PatientSearch({
  onSearch,
  onFilterChange,
}: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stage, setStage] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStageChange = (value: string) => {
    setStage(value);
    onFilterChange({
      stage: value ? Number.parseInt(value) : undefined,
      status: status || undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({
      stage: stage ? Number.parseInt(stage) : undefined,
      status: value || undefined,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setStage("");
    setStatus("");
    onSearch("");
    onFilterChange({});
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un patient..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button onClick={handleSearch}>Rechercher</Button>
      </div>
      <div className="flex gap-2">
        <Select value={stage} onValueChange={handleStageChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stade MRC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les stades</SelectItem>
            <SelectItem value="1">Stade 1</SelectItem>
            <SelectItem value="2">Stade 2</SelectItem>
            <SelectItem value="3">Stade 3</SelectItem>
            <SelectItem value="4">Stade 4</SelectItem>
            <SelectItem value="5">Stade 5</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="improving">En amélioration</SelectItem>
            <SelectItem value="worsening">En détérioration</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || stage || status) && (
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
