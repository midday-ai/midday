import { p } from "framer-motion/client";
import {
    createSearchParamsCache,
    parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
    from: parseAsString,
    to: parseAsString,
    currency: parseAsString.withDefault("USD"),
    page: parseAsString.withDefault("1"),
    pageSize: parseAsString.withDefault("10"),
});
