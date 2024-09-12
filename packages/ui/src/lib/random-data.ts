import { Appointment } from "../types/appointment";
import { Resource } from "../types/resource";
import { faker } from "@faker-js/faker";
import { addDays, addHours, differenceInCalendarDays } from "date-fns";

// Generate a specified number of resources
const generateResources = (num: number): Resource[] => {
  enum type {
    room = "room",
    person = "person",
    equipment = "equipment",
    service = "service",
    other = "other",
  }
  return Array.from({ length: num }, () => {
    return {
      id: faker.string.uuid(),
      name: faker.internet.displayName(),
      type: type.person,
      details: {
        description: faker.lorem.sentence(),
        image: faker.image.avatarGitHub(),
      },
    };
  });
};

/**
 * Generates a list of fake appointments with ensured start before end dates.
 *
 * @param num - Number of appointments to generate
 * @param resources - Array of resources each appointment can be associated with
 * @returns Array of Appointment objects
 */
const generateAppointments = (num: number, resources: any[]): Appointment[] => {
  return Array.from({ length: num }, (_, i) => {
    const resource = faker.helpers.arrayElement(resources); // Randomly pick one resource
    const start = faker.date.soon({
      days: faker.number.int({ min: 1, max: 14 }),
      refDate: new Date(),
    }); // Start date within the next two weeks
    let end = new Date(start.getTime()); // Ensure end is at least the same as start

    // Randomly decide to add between 1 hour to 48 hours to the start time for the end time
    const hoursToAdd = faker.number.int({ min: 1, max: 48 });
    end = addHours(end, hoursToAdd);

    // Ensure the appointment does not accidentally exceed two weeks from now
    if (differenceInCalendarDays(end, new Date()) > 14) {
      end = addDays(new Date(), 14); // Cap at two weeks from today
    }

    return {
      id: faker.string.uuid(),
      title: faker.company.catchPhrase(),
      start: start,
      end: end,
      resourceId: resource.id,
      order: i,
      details: {
        notes: faker.lorem.sentence(),
        service: faker.commerce.department(),
        image: faker.image.url(),
      },
    };
  });
};
export { generateResources, generateAppointments };
