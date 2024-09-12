import { describe, expect, it } from "vitest";

import { event, Event, eventType, eventTypesArr } from "./index"; // Adjust the import path as needed

describe("eventType", () => {
  it("should validate valid event types", () => {
    eventTypesArr.forEach((type) => {
      expect(() => eventType.parse(type)).not.toThrow();
    });
  });

  it("should throw on invalid event type", () => {
    expect(() => eventType.parse("invalid_event_type")).toThrow();
  });
});

describe("event", () => {
  it("should validate a valid verifications.usage.record event", () => {
    const validEvent: Event = {
      type: "verifications.usage.record",
      timestamp: "2023-04-01T12:00:00Z",
      data: {
        eventId: "123456",
        interval: {
          start: 1680345600000,
          end: 1680432000000,
        },
        keySpaceId: "space123",
        records: [
          {
            ownerId: "owner1",
            verifications: 100,
          },
          {
            ownerId: "owner2",
            verifications: 200,
          },
        ],
      },
    };

    expect(() => event.parse(validEvent)).not.toThrow();
  });

  it("should throw on invalid event type", () => {
    const invalidEvent = {
      type: "invalid_type",
      timestamp: "2023-04-01T12:00:00Z",
      data: {
        eventId: "123456",
        interval: {
          start: 1680345600000,
          end: 1680432000000,
        },
        keySpaceId: "space123",
        records: [],
      },
    };

    expect(() => event.parse(invalidEvent)).toThrow();
  });

  it("should throw on invalid timestamp", () => {
    const invalidEvent: Omit<Event, "timestamp"> & { timestamp: string } = {
      type: "verifications.usage.record",
      timestamp: "invalid-date",
      data: {
        eventId: "123456",
        interval: {
          start: 1680345600000,
          end: 1680432000000,
        },
        keySpaceId: "space123",
        records: [],
      },
    };

    expect(() => event.parse(invalidEvent)).toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidEvent = {
      type: "verifications.usage.record",
      timestamp: "2023-04-01T12:00:00Z",
      // Missing 'data' field
    };

    expect(() => event.parse(invalidEvent)).toThrow();
  });

  it("should throw on invalid data structure", () => {
    const invalidEvent = {
      type: "verifications.usage.record",
      timestamp: "2023-04-01T12:00:00Z",
      data: {
        eventId: "123456",
        interval: {
          start: "1680345600000", // Should be number
          end: 1680432000000,
        },
        keySpaceId: "space123",
        records: [
          {
            ownerId: "owner1",
            verifications: "hundred", // Should be number
          },
        ],
      },
    };

    expect(() => event.parse(invalidEvent)).toThrow();
  });
});

describe("Event type", () => {
  it("should allow valid Event object", () => {
    const validEvent: Event = {
      type: "verifications.usage.record",
      timestamp: "2023-04-01T12:00:00Z",
      data: {
        eventId: "123456",
        interval: {
          start: 1680345600000,
          end: 1680432000000,
        },
        keySpaceId: "space123",
        records: [
          {
            ownerId: "owner1",
            verifications: 100,
          },
        ],
      },
    };

    // This is a type check, not a runtime check
    // If this compiles, it means the type is correct
    const eventCheck: Event = validEvent;
    expect(eventCheck).toEqual(validEvent);
  });
});
