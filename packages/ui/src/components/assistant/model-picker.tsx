"use client";

import "@radix-ui/react-select";

import type { FC } from "react";
import Image from "next/image";
import anthropic from "../../assets/providers/anthropic.svg";
import fireworks from "../../assets/providers/fireworks.svg";
import google from "../../assets/providers/google.svg";
import huggingface from "../../assets/providers/huggingface.svg";
import meta from "../../assets/providers/meta.svg";
import mistral from "../../assets/providers/mistral.svg";
import openai from "../../assets/providers/openai.svg";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

const models = [
  {
    name: "GPT 3.5 Turbo",
    value: "gpt-3.5-turbo",
    icon: openai,
  },
  {
    name: "Gemini 1.5 Pro",
    value: "gemini-1.5-pro",
    icon: google,
  },
  {
    name: "Gemma 7b",
    value: "gemma-7b",
    icon: google,
  },
  {
    name: "Claude 3 Haiku",
    value: "claude-3-haiku",
    icon: anthropic,
  },
  {
    name: "Llama 3 8b",
    value: "llama-3-8b",
    icon: meta,
  },
  {
    name: "Llama 3 70b",
    value: "llama-3-70b",
    icon: meta,
  },
  {
    name: "Codellama 70b",
    value: "codellama-70b",
    icon: meta,
  },
  {
    name: "Mistral 7b",
    value: "mistral-7b",
    icon: mistral,
  },
  {
    name: "Mixtral 8x7b",
    value: "mixtral-8x7b",
    icon: mistral,
  },
  {
    name: "DBRX",
    value: "dbrx",
    icon: fireworks,
  },
  {
    name: "Firefunction V1",
    value: "firefunction-v1",
    icon: fireworks,
  },
  {
    name: "Firellava 13b",
    value: "firellava-13b",
    icon: fireworks,
  },
  {
    name: "Hermes 2 Pro",
    value: "hermes-2-pro",
    icon: huggingface,
  },
  {
    name: "Neural Hermes",
    value: "neuralhermes",
    icon: huggingface,
  },
];
export const ModelPicker: FC = () => {
  return (
    <Select defaultValue={models[0]?.value ?? ""}>
      <SelectTrigger className="max-w-[300px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="">
        {models.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            <span className="flex items-center gap-2">
              <Image
                src={model.icon}
                alt={model.name}
                className="inline size-4"
              />
              <span>{model.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
