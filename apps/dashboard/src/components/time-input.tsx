import { Input } from "@midday/ui/input";
import { useState } from "react";

const toHHMMSS = (secs: number) => {
  const secNum = parseInt(secs.toString(), 10);
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor(secNum / 60) % 60;
  const seconds = secNum % 60;

  return [hours, minutes, seconds]
    .map((val) => (val < 10 ? `0${val}` : val))
    .filter((val, index) => val !== "00" || index > 0)
    .join(":")
    .replace(/^0/, "");
};

type Props = {
  defaultValue?: number;
  onChange: (seconds: number) => void;
  className?: string;
};

export function TimeInput({ defaultValue, onChange, className }: Props) {
  const [value, setValue] = useState(
    (defaultValue && toHHMMSS(defaultValue)) ?? "0:00:00"
  );

  const handleOnChange = (evt) => {
    setValue(evt.target.value);

    const value = evt.target.value;
    const seconds = Math.max(0, getSecondsFromHHMMSS(value));

    onChange(+seconds);
  };

  const getSecondsFromHHMMSS = (value: string) => {
    const [str1, str2, str3] = value.split(":");

    const val1 = Number(str1);
    const val2 = Number(str2);
    const val3 = Number(str3);

    if (!Number.isNaN(val1) && Number.isNaN(val2) && Number.isNaN(val3)) {
      return val1;
    }

    if (!Number.isNaN(val1) && !Number.isNaN(val2) && Number.isNaN(val3)) {
      return val1 * 60 + val2;
    }

    if (!Number.isNaN(val1) && !Number.isNaN(val2) && !Number.isNaN(val3)) {
      return val1 * 60 * 60 + val2 * 60 + val3;
    }

    return 0;
  };

  return (
    <Input onChange={handleOnChange} value={value} className={className} />
  );
}
