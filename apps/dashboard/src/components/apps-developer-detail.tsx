"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Separator } from "@midday/ui/separator";
import {
  ExternalLink,
  FileText,
  Globe,
  Lock,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";

interface Config {
  company: string;
  webUrl: string;
  documentationUrl: string;
  termsAndConditionsUrl: string;
  privacyPolicyUrl: string;
}

export default function AppsDeveloperDetail({ config }: { config: Config }) {
  const details = [
    { label: "Developer", value: config.company, icon: User },
    { label: "Website", value: config.webUrl, icon: Globe, isLink: true },
    {
      label: "Documentation",
      value: config.documentationUrl,
      icon: FileText,
      isLink: true,
    },
    {
      label: "Terms & Conditions",
      value: config.termsAndConditionsUrl,
      icon: Shield,
      isLink: true,
    },
    {
      label: "Privacy Policy",
      value: config.privacyPolicyUrl,
      icon: Lock,
      isLink: true,
    },
  ];

  return (
    <Card className="w-full border-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {details.map((item, index) => (
          <div key={item.label}>
            {item.isLink ? (
              <Link
                href={item.value}
                className="flex items-center justify-between group hover:underline"
              >
                <div className="flex items-center space-x-2">
                  <item.icon className="h-6 w-6 text-muted-foreground" />
                  <p className="text-md font-medium leading-none">
                    {item.label}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground group-hover:text-primary">
                  <span>{item.value}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <item.icon className="h-6 w-6 text-muted-foreground" />
                  <p className="text-md font-medium leading-none">
                    {item.label}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            )}
            {index < details.length - 1 && <Separator className="mt-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
