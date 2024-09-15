import { Appointment } from "../types/appointment";

export class AppointmentService {
  private appointments: Appointment[];

  constructor(initialAppointments: Appointment[]) {
    this.appointments = initialAppointments;
  }

  createAppointment(appointment: Appointment) {
    debugger;
    this.appointments.push(appointment);
    return this.appointments;
  }

  updateAppointment(updatedAppointment: Appointment) {
    const index = this.appointments.findIndex(
      (a) => a.id === updatedAppointment.id,
    );
    if (index !== -1) {
      this.appointments[index] = {
        ...this.appointments[index],
        ...updatedAppointment,
      };
    }
    return this.appointments;
  }

  deleteAppointment(id: string) {
    this.appointments = this.appointments.filter((a) => a.id !== id);
    return this.appointments;
  }

  getAppointments() {
    return [...this.appointments];
  }
}
