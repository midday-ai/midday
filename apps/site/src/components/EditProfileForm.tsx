"use client";

import React from "react";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { insertUserSchema } from "@midday/db/schema";

export const EditProfileForm = ({ defaultValues }) => {
  const { mutate } = api.user.update.useMutation();

  const { register, handleSubmit } = useForm<z.infer<typeof insertUserSchema>>({
    defaultValues,
    resolver: zodResolver(insertUserSchema),
  });

  const onSubmit = (input) => mutate(input);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-4 w-[100%] max-w-md px-8 pb-8 pt-6"
    >
      <div className="mb-4">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="full_name"
        >
          Name
        </label>
        <input
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 text-sm leading-tight text-gray-700 focus:outline-none"
          id="full_name"
          {...register("full_name")}
          type="text"
          placeholder="Name"
        />
      </div>

      <div className="mb-4">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="email"
        >
          Email
        </label>
        <input
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 text-sm leading-tight text-gray-700 focus:outline-none"
          id="email"
          {...register("email")}
          type="email"
          placeholder="Email"
        />
      </div>

      <div className="mb-6 text-center">
        <button
          className="focus:shadow-outline w-full rounded-full bg-black px-4 py-2 font-bold text-white focus:outline-none"
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  );
};
