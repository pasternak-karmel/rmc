"use client";

import React from 'react';
import { useLoader } from '@/provider/LoaderContext';
import './Loader.css';

const Loader: React.FC = () => {
  const { isLoading } = useLoader();

  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-spinner">
      </div>
    </div>
  );
};

export default Loader;
