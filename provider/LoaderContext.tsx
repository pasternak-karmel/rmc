"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoaderContextProps {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoaderContext = createContext<LoaderContextProps | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return (
    <LoaderContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
};
