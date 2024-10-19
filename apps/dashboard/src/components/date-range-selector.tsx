'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@midday/ui/button';
import { Calendar } from '@midday/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@midday/ui/popover';
import { format } from 'date-fns';

interface DateRangeSelectorProps {
  from: string;
  to: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ from, to }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(from));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date(to));

  const handleApply = () => {
    if (fromDate && toDate) {
      const params = new URLSearchParams(searchParams);
      params.set('from', format(fromDate, 'yyyy-MM-dd'));
      params.set('to', format(toDate, 'yyyy-MM-dd'));
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="flex space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {fromDate ? format(fromDate, 'PP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={setFromDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {toDate ? format(toDate, 'PP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={setToDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button onClick={handleApply}>Apply</Button>
    </div>
  );
};
