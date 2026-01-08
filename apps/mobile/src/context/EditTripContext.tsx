import { createContext, useContext, useState, type ReactNode } from "react";
import type { Trip } from "../types/database";

interface EditTripContextType {
  isOpen: boolean;
  tripToEdit: Trip | null;
  openEditDrawer: (trip: Trip) => void;
  closeEditDrawer: () => void;
}

const EditTripContext = createContext<EditTripContextType | null>(null);

export function EditTripProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  const openEditDrawer = (trip: Trip) => {
    setTripToEdit(trip);
    setIsOpen(true);
  };

  const closeEditDrawer = () => {
    setIsOpen(false);
    // Delay clearing trip to allow for close animation
    setTimeout(() => {
      setTripToEdit(null);
    }, 300);
  };

  return (
    <EditTripContext.Provider
      value={{ isOpen, tripToEdit, openEditDrawer, closeEditDrawer }}
    >
      {children}
    </EditTripContext.Provider>
  );
}

export function useEditTrip(): EditTripContextType {
  const context = useContext(EditTripContext);
  if (!context) {
    throw new Error("useEditTrip must be used within an EditTripProvider");
  }
  return context;
}
