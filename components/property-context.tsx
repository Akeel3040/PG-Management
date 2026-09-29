"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PropertyOption {
  id: string;
  name: string;
  code: string;
}

interface PropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  properties: PropertyOption[];
  setProperties: (props: PropertyOption[]) => void;
  isLoading: boolean;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType>({
  selectedPropertyId: null,
  setSelectedPropertyId: () => {},
  properties: [],
  setProperties: () => {},
  isLoading: false,
  refreshProperties: async () => {},
});

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
        const saved = typeof window !== "undefined" ? localStorage.getItem("pg_selected_property") : null;
        if (saved && data.some((p: any) => p.id === saved)) {
          setSelectedPropertyIdState(saved);
        } else if (data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyIdState(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load properties context", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const setSelectedPropertyId = (id: string | null) => {
    if (id) {
      localStorage.setItem("pg_selected_property", id);
    } else {
      localStorage.removeItem("pg_selected_property");
    }
    setSelectedPropertyIdState(id);
  };

  return (
    <PropertyContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        properties,
        setProperties,
        isLoading,
        refreshProperties: loadProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export const useProperty = () => useContext(PropertyContext);
