import { p } from "framer-motion/client";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { date } from "zod";

export const searchParamsCache = createSearchParamsCache({
  from: parseAsString,
  to: parseAsString,
  currency: parseAsString.withDefault("USD"),
  page: parseAsString.withDefault("1"),
  pageSize: parseAsString.withDefault("10"),
  category: parseAsString.withDefault(""),
  date: parseAsInteger.withDefault(
    new Date().getFullYear() * 100 + (new Date().getMonth() + 1),
  ),
});
