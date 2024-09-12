import exp from "constants";
import { v4 as uuidv4 } from "uuid";

export * from "./menu";
export * from "./resource";
export * from "./appointment";

export interface Message {
  id: number | string;
  avatar: string;
  name: string;
  message: string;
}

export interface User {
  id: string;
  avatar: string;
  name: string;
  messages: Message[];
  lastActive: Date;
}

export type LoggedInUser = Omit<User, "messages">;

export const createMessage = (
  avatar: string,
  name: string,
  message: string,
  timestamp: Date = new Date(),
): Message => ({
  id: uuidv4(),
  avatar,
  name,
  message,
});

export const createUser = (
  avatar: string,
  name: string,
  messages: Message[] = [],
  lastActive: Date = new Date(),
): User => ({
  id: uuidv4(),
  avatar,
  name,
  messages,
  lastActive,
});

export const userData: User[] = [
  createUser("/User1.png", "Jane Doe", [
    createMessage(
      "/User1.png",
      "Jane Doe",
      "Hey, Jakob",
      new Date("2023-07-01T09:00:00"),
    ),
    createMessage(
      "/LoggedInUser.jpg",
      "Jakob Hoeg",
      "Hey!",
      new Date("2023-07-01T09:01:00"),
    ),
    createMessage(
      "/User1.png",
      "Jane Doe",
      "How are you?",
      new Date("2023-07-01T09:02:00"),
    ),
    createMessage(
      "/LoggedInUser.jpg",
      "Jakob Hoeg",
      "I am good, you?",
      new Date("2023-07-01T09:03:00"),
    ),
    createMessage(
      "/User1.png",
      "Jane Doe",
      "I am good too!",
      new Date("2023-07-01T09:04:00"),
    ),
    createMessage(
      "/LoggedInUser.jpg",
      "Jakob Hoeg",
      "That is good to hear!",
      new Date("2023-07-01T09:05:00"),
    ),
    createMessage(
      "/User1.png",
      "Jane Doe",
      "How has your day been so far?",
      new Date("2023-07-01T09:06:00"),
    ),
    createMessage(
      "/LoggedInUser.jpg",
      "Jakob Hoeg",
      "It has been good. I went for a run this morning and then had a nice breakfast. How about you?",
      new Date("2023-07-01T09:07:00"),
    ),
    createMessage(
      "/User1.png",
      "Jane Doe",
      "I had a relaxing day. Just catching up on some reading.",
      new Date("2023-07-01T09:08:00"),
    ),
  ]),
  createUser("/User2.png", "John Doe"),
  createUser("/User3.png", "Elizabeth Smith"),
  createUser("/User4.png", "John Smith"),
];

export const loggedInUserData: LoggedInUser = {
  id: uuidv4(),
  avatar: "/LoggedInUser.jpg",
  name: "Jakob Hoeg",
  lastActive: new Date(),
};

export const getLastMessage = (user: User): Message | null | undefined => {
  return user.messages.length > 0
    ? user.messages[user.messages.length - 1]
    : null;
};

export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};
