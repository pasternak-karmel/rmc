"use client";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export const formatDateCustom = (dateString: string) => {
  try {
    return format(parseISO(dateString), "dd MMMM yyyy", { locale: fr });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return dateString;
  }
};
