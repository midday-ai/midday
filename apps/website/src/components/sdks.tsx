"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { MaterialIcon } from "./homepage/icon-mapping";
import Link from "next/link";

type SDKTab = "typescript" | "go" | "php" | "python";

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      console.error("Failed to copy:", err);
    }
  };

  return (
      <div className="relative group">
      <div className="bg-secondary border border-border p-4 rounded-none overflow-x-auto">
        <pre className="font-mono text-sm text-muted-foreground whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Icons.Check size={16} className="text-foreground" />
        ) : (
          <Icons.Copy size={16} />
        )}
      </button>
    </div>
  );
}

export function SDKs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SDKTab>("typescript");

  const handleLogoClick = (sdk: SDKTab) => {
    setActiveTab(sdk);
    const tabsSection = document.getElementById("sdk-tabs");
    if (tabsSection) {
      tabsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
            priority
          />
          <Image
            src="/images/grid-dark.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-[12%] hidden dark:block"
            priority
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">
          <div className="flex flex-col justify-start items-center z-20 px-4 sm:px-6">
            {/* SDK Logos */}
            <div className="flex justify-center w-full relative gap-4 sm:gap-6 mb-12 sm:mb-16 md:mb-20">
              <button
                onClick={() => handleLogoClick("typescript")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/typescript.svg"
                  alt="TypeScript"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("go")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/go.svg"
                  alt="Go"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("php")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/php.svg"
                  alt="PHP"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("python")}
                className="border border-border bg-background p-4 sm:p-6 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/python.svg"
                  alt="Python"
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
                Use Midday's SDKs to integrate financial data, insights, and workflows into your product with just a few lines of code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md mx-auto justify-center sm:justify-center mt-8">
              <Button
                onClick={() => router.push("/login")}
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans"
              >
                Get started
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/docs")}
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                View documentation
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
                onClick={() => handleLogoClick("typescript")}
                className="border border-border bg-background p-6 xl:p-8 2xl:p-10 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/typescript.svg"
                  alt="TypeScript"
                  width={80}
                  height={80}
                  className="w-16 h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("go")}
                className="border border-border bg-background p-6 xl:p-8 2xl:p-10 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/go.svg"
                  alt="Go"
                  width={80}
                  height={80}
                  className="w-16 h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("php")}
                className="border border-border bg-background p-6 xl:p-8 2xl:p-10 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/php.svg"
                  alt="PHP"
                  width={80}
                  height={80}
                  className="w-16 h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 object-contain"
                  priority
                />
              </button>
              <button
                onClick={() => handleLogoClick("python")}
                className="border border-border bg-background p-6 xl:p-8 2xl:p-10 flex items-center justify-center rounded-none cursor-pointer hover:border-foreground/20 transition-colors"
              >
                <Image
                  src="/images/python.svg"
                  alt="Python"
                  width={80}
                  height={80}
                  className="w-16 h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 object-contain"
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
                Use Midday's SDKs to integrate financial data, insights, and workflows into your product with just a few lines of code.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-6 justify-center mt-8">
              <Button
                onClick={() => router.push("/login")}
                className="h-11 px-6 text-sm font-sans"
              >
                Get started
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/docs")}
                className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                View documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SDK Tabs Section */}
      <section id="sdk-tabs" className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div
              className="relative flex items-stretch bg-muted"
              style={{ width: 'fit-content' }}
            >
              <div className="flex items-stretch">
                <button
                  onClick={() => setActiveTab("typescript")}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none font-sans ${
                    activeTab === "typescript"
                      ? "text-foreground bg-background border-border"
                      : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    marginBottom: activeTab === "typescript" ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: activeTab === "typescript" ? 10 : 1,
                  }}
                >
                  <span>TypeScript</span>
                </button>
                <button
                  onClick={() => setActiveTab("go")}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none font-sans ${
                    activeTab === "go"
                      ? "text-foreground bg-background border-border"
                      : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    marginBottom: activeTab === "go" ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: activeTab === "go" ? 10 : 1,
                  }}
                >
                  <span>Go</span>
                </button>
                <button
                  onClick={() => setActiveTab("php")}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none font-sans ${
                    activeTab === "php"
                      ? "text-foreground bg-background border-border"
                      : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    marginBottom: activeTab === "php" ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: activeTab === "php" ? 10 : 1,
                  }}
                >
                  <span>PHP</span>
                </button>
                <button
                  onClick={() => setActiveTab("python")}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none font-sans ${
                    activeTab === "python"
                      ? "text-foreground bg-background border-border"
                      : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    marginBottom: activeTab === "python" ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: activeTab === "python" ? 10 : 1,
                  }}
                >
                  <span>Python</span>
                </button>
              </div>
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
                  A fully typed SDK for interacting with Midday's APIs, designed for modern web and backend applications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-sans text-sm text-foreground">Key features:</p>
                  <ul className="list-disc list-inside space-y-1 font-sans text-sm text-muted-foreground">
                    <li>Fully typed with first-class TypeScript support</li>
                    <li>Works in Node, Bun, and modern runtimes</li>
                    <li>Simple setup and predictable responses</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-sans text-sm text-foreground mb-2">Install:</p>
                    <CodeBlock code="bun add @midday/sdk" />
                  </div>

                  <div>
                    <p className="font-sans text-sm text-foreground mb-2">Example:</p>
                    <CodeBlock code={`import { Midday } from "@midday/sdk";

const midday = new Midday({ 
  apiKey: process.env.MIDDAY_API_KEY 
});

const transactions = await midday.transactions.list();`} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    View TypeScript docs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs/examples")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    See examples
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
                  A lightweight Go SDK for building server-side applications with Midday's APIs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Install:</p>
                  <CodeBlock code="go get github.com/midday/sdk-go" />
                </div>

                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Example:</p>
                  <CodeBlock code={`package main

import (
  "context"
  "github.com/midday/sdk-go"
)

func main() {
  client := midday.NewClient(midday.WithAPIKey("YOUR_API_KEY"))
  
  transactions, err := client.Transactions.List(context.Background())
  if err != nil {
    panic(err)
  }
}`} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    View Go docs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs/examples")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    See examples
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
                  A PHP SDK for integrating Midday's APIs into your PHP applications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Install:</p>
                  <CodeBlock code="composer require midday/sdk" />
                </div>

                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Example:</p>
                  <CodeBlock code={`<?php

require 'vendor/autoload.php';

use Midday\Midday;

$midday = new Midday([
  'api_key' => getenv('MIDDAY_API_KEY')
]);

$transactions = $midday->transactions()->list();`} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    View PHP docs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs/examples")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    See examples
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Python SDK Content */}
          {activeTab === "python" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h3 className="font-serif text-2xl sm:text-2xl text-foreground">
                  Python SDK
                </h3>
                <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
                  A Python SDK for integrating Midday's APIs into your Python applications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Install:</p>
                  <CodeBlock code="pip install midday-sdk" />
                </div>

                <div>
                  <p className="font-sans text-sm text-foreground mb-2">Example:</p>
                  <CodeBlock code={`from midday import Midday

midday = Midday(api_key="YOUR_API_KEY")

transactions = midday.transactions.list()`} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    View Python docs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/docs/examples")}
                    className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                  >
                    See examples
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
      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Build real financial workflows
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="font-sans text-base text-foreground">
                  Sync and analyze transactions
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Access transaction data programmatically and build custom analysis tools.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-sans text-base text-foreground">
                  Build dashboards and reports
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Create custom financial dashboards tailored to your needs.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-sans text-base text-foreground">
                  Power internal tools with financial data
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Integrate financial data into your existing tools and workflows.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-sans text-base text-foreground">
                  Automate accounting-ready exports
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Generate formatted exports ready for your accounting software.
                </p>
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
      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Secure by default
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-normal">
              All SDKs use secure API keys and scoped access to ensure your data stays protected.
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Get up and running
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/docs"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon name="play_arrow" className="text-muted-foreground group-hover:text-foreground transition-colors" size={20} />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  Quickstart
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  Get started with Midday SDKs in minutes.
                </p>
              </Link>
              <Link
                href="/docs/examples"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon name="description" className="text-muted-foreground group-hover:text-foreground transition-colors" size={20} />
                </div>
                <h3 className="font-sans text-base text-foreground mb-2 group-hover:text-foreground">
                  Examples
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  See example apps and code snippets.
                </p>
              </Link>
              <Link
                href="/docs"
                className="bg-secondary border border-border p-6 hover:border-foreground/20 transition-colors group flex flex-col items-center text-center"
              >
                <div className="mb-4 flex items-center justify-center">
                  <MaterialIcon name="open_in_new" className="text-muted-foreground group-hover:text-foreground transition-colors" size={20} />
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
                  <Icons.History size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
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

