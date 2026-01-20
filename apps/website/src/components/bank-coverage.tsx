"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useState } from "react";

interface Bank {
  name: string;
  provider: string;
}

const banks: Bank[] = [
  { name: "SEB företag", provider: "Gocardless" },
  { name: "Avanza", provider: "Gocardless" },
  { name: "Mercury", provider: "Teller" },
  { name: "Nordea", provider: "Gocardless" },
  { name: "Revolut", provider: "Teller" },
  { name: "SEB företag", provider: "Gocardless" },
  { name: "Avanza", provider: "Gocardless" },
  { name: "Mercury", provider: "Teller" },
  { name: "Nordea", provider: "Gocardless" },
  { name: "Revolut", provider: "Teller" },
  { name: "Avanza", provider: "Gocardless" },
  { name: "Nordea", provider: "Gocardless" },
];

const countries = [
  "Sweden",
  "United States",
  "United Kingdom",
  "Norway",
  "Denmark",
  "Finland",
];

export function BankCoverage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Sweden");

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <div className="pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
        <div className="pt-12 sm:pt-16 lg:pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {/* Title and Subtitle */}
              <div className="text-center space-y-4">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-foreground">
                  Banks
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  We currently support over 25,000+ banks worldwide. Search
                  below to find yours.
                </p>
              </div>

              {/* Search and Country Selector */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Icons.Search className="absolute pointer-events-none left-3 top-[11px] text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search banks"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table Section */}
              <div className="space-y-0">
                {/* List Headers */}
                <div className="flex items-center justify-between bg-secondary px-2 py-2">
                  <span className="font-sans text-sm font-medium text-muted-foreground">
                    Most popular
                  </span>
                  <span className="font-sans text-sm font-medium text-muted-foreground">
                    Provider
                  </span>
                </div>

                {/* Bank List */}
                <div className="space-y-0 pt-2">
                  {filteredBanks.map((bank, index) => (
                    <div
                      key={`${bank.name}-${index}`}
                      className="flex items-center justify-between py-3 border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Placeholder Oval */}
                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex-shrink-0" />
                        <span className="font-sans text-sm text-foreground">
                          {bank.name}
                        </span>
                      </div>
                      <span className="font-sans text-sm text-muted-foreground">
                        {bank.provider}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
