"use client";

import { Avatar, AvatarImageNext } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";

export type Story = {
  id: number;
  title: string;
  description: string;
  name: string;
  company: string;
  country: string;
  src: string;
  video?: string;
};

export function StoryCard({
  title,
  description,
  name,
  company,
  country,
  src,
  video,
}: Story) {
  return (
    <div className="w-[300px] cursor-pointer">
      <div className="p-6 bg-background border border-border">
        {video && (
          <div className="flex items-center justify-center size-8 bg-primary rounded-full mb-2">
            <Icons.Play size={16} className="text-background" />
          </div>
        )}
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-[#878787]">{description}</p>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="size-4">
              <AvatarImageNext src={src} alt={name} width={16} height={16} />
            </Avatar>
            <p className="text-sm">{name}</p>
          </div>

          <div className="flex items-center gap-2 text-[#878787]">
            <p className="text-sm text-[#878787]">{company}</p> •
            <p className="text-sm text-[#878787]">{country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
