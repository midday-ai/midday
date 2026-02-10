"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { highlight } from "sugar-high";
import { MaterialIcon } from "./homepage/icon-mapping";

type SDKTab = "typescript" | "go" | "php";
type PackageManager = "npm" | "bun" | "pnpm" | "yarn";

function ScrambledText() {
  const [tick, setTick] = useState(0);
  const chars = "ABCDEF0123456789";
  const cols = 8;
  const rows = 4;
  const charCount = cols * rows; // 32 characters

  // Pre-compute deterministic seeds for each character position (consistent between server and client)
  const charSeeds = useMemo(
    () => Array.from({ length: charCount }, (_, i) => (i * 17 + 23) % 1000),
    [charCount],
  );

  useEffect(() => {
    // Single interval with requestAnimationFrame for smoother updates
    let animationFrameId: number;
    let lastUpdate = 0;
    const updateInterval = 200; // Update every 200ms

    const update = (timestamp: number) => {
      if (timestamp - lastUpdate >= updateInterval) {
        setTick((prev) => prev + 1);
        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Deterministic character generation - only recalculates when tick changes
  const scrambledChars = useMemo(() => {
    return Array.from({ length: charCount }, (_, i) => {
      // Each character scrambles at different rates based on its seed
      const charTick = Math.floor(tick / (1 + (charSeeds[i] % 3)));
      const charIndex = (i * 7 + charTick * 11 + charSeeds[i]) % chars.length;
      return chars[charIndex];
    });
  }, [tick, charCount, charSeeds, chars]);

  return (
    <div className="mb-8 relative">
      <div
        className="grid grid-cols-8 gap-y-2 sm:gap-y-3 max-w-xs mx-auto relative"
        style={{ columnGap: 0 }}
      >
        {/* Gradient fade masks */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        {scrambledChars.map((char, i) => (
          <span
            key={`char-${i.toString()}`}
            className="font-mono text-sm sm:text-base text-muted-foreground opacity-60 group-hover:opacity-80 transition-opacity duration-300 text-center"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const codeHTML = highlight(code);

  return (
    <div className="relative group">
      <div className="bg-[#fafafa] dark:bg-[#0c0c0c] border border-border rounded-none overflow-hidden">
        <pre className="overflow-x-auto p-4 text-sm font-mono">
          <code dangerouslySetInnerHTML={{ __html: codeHTML }} />
        </pre>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100 rounded-none"
        aria-label="Copy code"
      >
        {copied ? (
          <Icons.Check size={14} className="text-foreground" />
        ) : (
          <Icons.Copy size={14} />
        )}
      </button>
    </div>
  );
}

function InstallTabs({ packageName }: { packageName: string }) {
  const [activeManager, setActiveManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);

  const commands: Record<PackageManager, string> = {
    npm: `npm install ${packageName}`,
    bun: `bun add ${packageName}`,
    pnpm: `pnpm add ${packageName}`,
    yarn: `yarn add ${packageName}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands[activeManager]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const codeHTML = highlight(commands[activeManager]);

  return (
    <div className="relative group">
      <div className="bg-[#fafafa] dark:bg-[#0c0c0c] border border-border rounded-none overflow-hidden">
        <div className="flex border-b border-border">
          {(["npm", "bun", "pnpm", "yarn"] as PackageManager[]).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setActiveManager(pm)}
              className={`px-4 py-2 text-xs font-sans transition-colors ${
                activeManager === pm
                  ? "text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto p-4 text-sm font-mono">
          <code dangerouslySetInnerHTML={{ __html: codeHTML }} />
        </pre>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100 rounded-none"
        aria-label="Copy code"
      >
        {copied ? (
          <Icons.Check size={14} className="text-foreground" />
        ) : (
          <Icons.Copy size={14} />
        )}
      </button>
    </div>
  );
}

export function SDKs() {
  const [activeTab, setActiveTab] = useState<SDKTab>("typescript");

  const handleLogoClick = (sdk: SDKTab) => {
    setActiveTab(sdk);
    const tabsSection = document.getElementById("sdk-tabs");
    if (tabsSection) {
      tabsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sdkRepos: Record<SDKTab, string> = {
    typescript: "https://github.com/midday-ai/midday-ts",
    go: "https://github.com/midday-ai/midday-go",
    php: "https://github.com/midday-ai/midday-php",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Grid Pattern Background - Desktop Only */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <Image
            src="/images/grid-light.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-100 dark:opacity-[12%] dark:hidden"
            loading="lazy"
          />
          <Image
            src="/images/grid-dark.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-[12%] hidden dark:block"
            loading="lazy"
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">
          {/* Grid Pattern Background - Mobile/Tablet Only (Limited Height) */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0"
            style={{ height: "600px" }}
          >
            <Image
              src="/images/grid-light.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-100 dark:opacity-[12%] dark:hidden"
              loading="lazy"
            />
            <Image
              src="/images/grid-dark.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-[12%] hidden dark:block"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-start items-center z-20 px-4 sm:px-6">
            {/* SDK Logos */}
            <div className="flex justify-center w-full relative gap-4 sm:gap-6 mb-12 sm:mb-16 md:mb-20">
              <button
                type="button"
                onClick={() => handleLogoClick("typescript")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/typescript.png"
                  alt="TypeScript"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
              <button
                type="button"
                onClick={() => handleLogoClick("go")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/go.png"
                  alt="Go"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
              <button
                type="button"
                onClick={() => handleLogoClick("php")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/php.png"
                  alt="PHP"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
            </div>

            {/* Title and Description */}
            <div className="space-y-4 text-center max-w-xl w-full">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
                Build with Midday
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto">
                Use Midday's SDKs to integrate financial data, insights, and
                workflows into your product with just a few lines of code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md mx-auto justify-center sm:justify-center mt-8">
              <Button
                asChild
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans"
              >
                <Link href="https://app.midday.ai">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                <Link href="https://api.midday.ai">API documentation</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center z-20 px-4 pb-32">
            {/* SDK Logos - Centered */}
            <div className="flex justify-center w-full relative gap-8 xl:gap-10 mb-16 xl:mb-20 2xl:mb-24">
              <button
                type="button"
                onClick={() => handleLogoClick("typescript")}
                className="border border-border bg-background p-5 xl:p-7 2xl:p-8 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/typescript.png"
                  alt="TypeScript"
                  width={80}
                  height={80}
                  className="w-14 h-14 xl:w-24 xl:h-24 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
              <button
                type="button"
                onClick={() => handleLogoClick("go")}
                className="border border-border bg-background p-5 xl:p-7 2xl:p-8 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/go.png"
                  alt="Go"
                  width={80}
                  height={80}
                  className="w-14 h-14 xl:w-24 xl:h-24 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
              <button
                type="button"
                onClick={() => handleLogoClick("php")}
                className="border border-border bg-background p-5 xl:p-7 2xl:p-8 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Image
                  src="/images/php.png"
                  alt="PHP"
                  width={80}
                  height={80}
                  className="w-14 h-14 xl:w-24 xl:h-24 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
            </div>

            {/* Title and Description */}
            <div className="text-center space-y-4 w-full">
              <h1 className="font-serif text-6xl xl:text-7xl 2xl:text-8xl leading-tight text-foreground">
                Build with Midday
              </h1>
              <p className="text-muted-foreground text-sm xl:text-base leading-normal max-w-xl mx-auto font-sans text-center">
                Use Midday's SDKs to integrate financial data, insights, and
                workflows into your product with just a few lines of code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-6 justify-center mt-8">
              <Button asChild className="h-11 px-6 text-sm font-sans">
                <Link href="https://app.midday.ai">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                <Link href="https://api.midday.ai">API documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SDK Tabs Section */}
      <section id="sdk-tabs" className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Tabs */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-2 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("typescript")}
                className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                  activeTab === "typescript"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                TypeScript
                {activeTab === "typescript" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[2px]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("go")}
                className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                  activeTab === "go"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Go
                {activeTab === "go" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[2px]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("php")}
                className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                  activeTab === "php"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PHP
                {activeTab === "php" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[2px]" />
                )}
              </button>
            </div>
          </div>

          {/* TypeScript SDK Content */}
          {activeTab === "typescript" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h3 className="font-serif text-2xl sm:text-2xl text-foreground">
                  TypeScript SDK
                </h3>
                <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
                  A fully typed SDK for interacting with Midday's APIs, designed
                  for modern web and backend applications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-sans text-sm text-foreground">
                    Key features:
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-sans text-sm text-muted-foreground">
                    <li>Fully typed with first-class TypeScript support</li>
                    <li>Works in Node, Bun, and modern runtimes</li>
                    <li>Simple setup and predictable responses</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-sans text-sm text-foreground mb-2">
                      Install:
                    </p>
                    <InstallTabs packageName="@midday-ai/sdk" />
                  </div>

                  <div>
                    <p className="font-sans text-sm text-foreground mb-2">
                      Example:
                    </p>
                    <CodeBlock
                      code={`import { Midday } from "@midday-ai/sdk";

const midday = new Midday({
  security: {
    oauth2: process.env["MIDDAY_OAUTH2"] ?? "",
  },
});

async function run() {
  const result = await midday.oAuth.getOAuthAuthorization({
    responseType: "code",
    clientId: "mid_client_abcdef123456789",
    redirectUri: "https://myapp.com/callback",
    scope: "transactions.read invoices.read",
    state: "abc123xyz789_secure-random-state-value-with-sufficient-entropy",
    codeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  });

  console.log(result);
}

run();`}
                      language="typescript"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-ts">
                      View TypeScript docs
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-ts">
                      See examples
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Go SDK Content */}
          {activeTab === "go" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h3 className="font-serif text-2xl sm:text-2xl text-foreground">
                  Go SDK
                </h3>
                <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
                  A lightweight Go SDK for building server-side applications
                  with Midday's APIs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm text-foreground mb-2">
                    Install:
                  </p>
                  <CodeBlock
                    code="go get github.com/midday-ai/midday-go"
                    language="bash"
                  />
                </div>

                <div>
                  <p className="font-sans text-sm text-foreground mb-2">
                    Example:
                  </p>
                  <CodeBlock
                    code={`package main

import (
	"context"
	middaygo "github.com/midday-ai/midday-go"
	"github.com/midday-ai/midday-go/models/operations"
	"log"
)

func main() {
	ctx := context.Background()

	s := middaygo.New(
		middaygo.WithSecurity("MIDDAY_API_KEY"),
	)

	res, err := s.Transactions.List(ctx, operations.ListTransactionsRequest{
		PageSize: middaygo.Float64(50),
	})
	if err != nil {
		log.Fatal(err)
	}
	if res.Object != nil {
		// handle response
	}
}`}
                    language="go"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-go">
                      View Go docs
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-go">
                      See examples
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PHP SDK Content */}
          {activeTab === "php" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h3 className="font-serif text-2xl sm:text-2xl text-foreground">
                  PHP SDK
                </h3>
                <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
                  A PHP SDK for integrating Midday's APIs into your PHP
                  applications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm text-foreground mb-2">
                    Install:
                  </p>
                  <CodeBlock
                    code="composer require midday-ai/midday-php"
                    language="bash"
                  />
                </div>

                <div>
                  <p className="font-sans text-sm text-foreground mb-2">
                    Example:
                  </p>
                  <CodeBlock
                    code={`<?php

declare(strict_types=1);

require 'vendor/autoload.php';

use MiddayMidday;
use MiddayMiddayModelsOperations;

$sdk = MiddayMidday::builder()
    ->setSecurity('MIDDAY_API_KEY')
    ->build();

$request = new OperationsListTransactionsRequest(
    pageSize: 50,
);

$response = $sdk->transactions->list(
    request: $request
);

if ($response->object !== null) {
    // handle response
}`}
                    language="php"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-php">
                      View PHP docs
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    <a href="https://github.com/midday-ai/midday-php">
                      See examples
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* What You Can Build Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Build real financial workflows
            </h2>
            <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
              Use Midday SDKs to integrate financial data, insights, and
              workflows into your product.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-secondary border border-border p-6 relative">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Sync and analyze transactions
                    </span>
                    <span className="hidden sm:inline">
                      Sync and analyze transactions programmatically and build
                      custom analysis tools
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Build dashboards and reports
                    </span>
                    <span className="hidden sm:inline">
                      Build dashboards and reports tailored to your needs
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    Power internal tools with financial data and integrate into
                    existing workflows
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Automate accounting-ready exports
                    </span>
                    <span className="hidden sm:inline">
                      Automate accounting-ready exports for your accounting
                      software
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Security Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-20 group">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            {/* Cryptographic Text */}
            <ScrambledText />
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Secure by default
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-normal">
              All SDKs use secure API keys and scoped access to ensure your data
              stays protected.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Resources Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Get up and running
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href={sdkRepos[activeTab]}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon
                    name="timer"
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                    size={20}
                  />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  Quickstart
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Get started with Midday SDKs in minutes.
                </p>
              </Link>
              <Link
                href={sdkRepos[activeTab]}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon
                    name="description"
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                    size={20}
                  />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  Examples
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  See example apps and code snippets.
                </p>
              </Link>
              <Link
                href="https://api.midday.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon
                    name="link"
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                    size={20}
                  />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  API reference
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Complete API documentation and endpoints.
                </p>
              </Link>
              <Link
                href="/updates"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <Icons.History
                    size={20}
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  Changelog
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Stay updated with latest changes.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
