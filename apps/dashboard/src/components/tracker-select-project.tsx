"use client";

import { Combobox } from "@midday/ui/combobox";
import { useState } from "react";

export function TrackerSelectProject() {
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);

  const onSelect = (selected) => {
    console.log(selected);
  };

  return (
    <Combobox
      placeholder="Search or create project"
      className="w-full relative"
      classNameList="top-[50px] bottom-0 h-[100px]"
      value={value}
      onValueChange={setValue}
      onSelect={onSelect}
      options={[{ id: "1", name: "Hej" }]}
      hidden={false}
      onCreate={() => {}}
    />
  );
}
