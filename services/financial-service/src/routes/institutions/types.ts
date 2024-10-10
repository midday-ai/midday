import { Providers } from "@/common/schema";
import { z } from "zod";

const DocumentSchema = z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string().nullable(),
    available_history: z.number().nullable(),
    provider: Providers,
    popularity: z.number(),
});

const SearchResultSchema = z.object({
    hits: z.array(
        z.object({
            document: DocumentSchema,
        })
    ),
});

type Document = z.infer<typeof DocumentSchema>;
type SearchResult = z.infer<typeof SearchResultSchema>;

export { DocumentSchema, SearchResultSchema };
export type { Document, SearchResult };

