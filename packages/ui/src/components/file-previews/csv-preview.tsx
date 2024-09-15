import { parse } from "papaparse";
import React, { useEffect, useState } from "react";

import { Card } from "../card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

interface CsvPreviewProps {
  fileUrl: string;
}

export const CsvPreview: React.FC<CsvPreviewProps> = ({ fileUrl }) => {
  const [data, setData] = useState<Array<any>>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(fileUrl);
        const reader = response.body?.getReader();
        const result = await reader?.read(); // read all content
        const decoder = new TextDecoder("utf-8");
        const csv = decoder.decode(result?.value); // convert Uint8Array to string
        parse(csv, {
          complete: (results) => {
            setData(results.data as Array<any>);
          },
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          preview: 30,
          error: (err: { message: React.SetStateAction<string> }) =>
            setError(err.message),
        });
      } catch (err) {
        setError("Failed to load CSV data");
      }
    };

    fetchData();
  }, [fileUrl]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data.length) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="overflow-scroll rounded-2xl">
      <TableHelperComponent data={data} />
    </Card>
  );
};

const TableHelperComponent = ({ data }: { data: Array<any> }) => {
  if (!data.length) {
    return <p>No data available.</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <Table className="p-[5%]">
      <TableCaption>A list of your recent data.</TableCaption>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead
              key={index}
              className={index === headers.length - 1 ? "text-right" : ""}
            >
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            {Object.values(row).map((value, i) => (
              <TableCell
                key={i}
                className={i === headers.length - 1 ? "text-right" : ""}
              >
                {value as React.ReactNode}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CsvPreview;
