import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
} from "react";
import { AppointmentService } from "../lib/appointment-utils";
import { ResourceService } from "../lib/resource-utils";
import { Appointment } from "../types/appointment";
import { Resource } from "../types/resource";

interface DataContextType {
  appointments: Appointment[];
  resources: Resource[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (id: string) => void;
  addResource: (resource: Resource) => void;
  updateResource: (resource: Resource) => void;
  removeResource: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const PlannerDataContextProvider: FC<{
  children: ReactNode;
  initialAppointments: Appointment[];
  initialResources: Resource[];
}> = ({ children, initialAppointments, initialResources }) => {
  const appointmentService = useState(
    new AppointmentService(initialAppointments),
  )[0];
  const resourceService = useState(new ResourceService(initialResources))[0];

  // Create a state that will re-render the context when updated
  const [trigger, setTrigger] = useState(false);

  const handleUpdate = () => setTrigger(!trigger); // simple state toggle to trigger re-render

  const contextValue: DataContextType = {
    appointments: appointmentService.getAppointments(),
    resources: resourceService.getResources(),
    addAppointment: (appointment) => {
      appointmentService.createAppointment(appointment);
      handleUpdate();
    },
    updateAppointment: (appointment) => {
      appointmentService.updateAppointment(appointment);
      handleUpdate();
    },
    removeAppointment: (id) => {
      appointmentService.deleteAppointment(id);
      handleUpdate();
    },
    addResource: (resource) => {
      resourceService.addResource(resource);
      handleUpdate();
    },
    updateResource: (resource) => {
      resourceService.updateResource(resource);
      handleUpdate();
    },
    removeResource: (id) => {
      resourceService.removeResource(id);
      handleUpdate();
    },
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a PlannerDataContextProvider");
  }
  return context;
};
