import { OpenStreetMapProvider } from "leaflet-geosearch";
import { RawResult } from "leaflet-geosearch/dist/providers/bingProvider.js";
import { SearchResult } from "leaflet-geosearch/dist/providers/provider.js";
import { useCallback, useEffect, useState } from "react";

import { useDebounce } from "./use-debounce";

interface UseSearchAddressResult {
  query: string;
  results: Record<string, SearchResult<RawResult>[]>;
  loading: boolean;
  handleSearch: (value: string) => void;
  selectedItem: SearchResult<RawResult> | null;
  setSelectedItem: (item: SearchResult<RawResult> | null) => void;
}

export const useSearchAddress = (): UseSearchAddressResult => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Record<string, SearchResult<RawResult>[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<SearchResult<RawResult> | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  const groupByType = useCallback(
    (
      data: SearchResult<RawResult>[],
    ): Record<string, SearchResult<RawResult>[]> => {
      return data.reduce(
        (acc, item) => {
          const { raw } = item;

          const rawData = raw as unknown as any;
          const type = rawData.class;

          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type]?.push(item);
          return acc;
        },
        {} as Record<string, SearchResult<RawResult>[]>,
      );
    },
    [],
  );

  const handleSearch = (value: string) => {
    setQuery(value);
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length > 2) {
        setLoading(true);
        const provider = new OpenStreetMapProvider();
        const results = await provider.search({ query: debouncedQuery });
        setResults(
          groupByType(results as unknown as SearchResult<RawResult>[]),
        );
        setLoading(false);
      } else {
        setResults({});
      }
    };

    fetchResults();
  }, [debouncedQuery, groupByType]);

  return {
    query,
    results,
    loading,
    handleSearch,
    selectedItem,
    setSelectedItem,
  };
};
