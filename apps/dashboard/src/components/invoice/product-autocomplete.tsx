"use client";

import { extractTextFromValue } from "@midday/invoice";
import type { InvoiceProduct } from "@midday/invoice/types";
import { cn } from "@midday/ui/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { useProductParams } from "@/hooks/use-product-params";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";

type Props = {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: InvoiceProduct) => void;
  disabled?: boolean;
};

export function ProductAutocomplete({
  index,
  value,
  onChange,
  onProductSelect,
  disabled = false,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setValue, watch } = useFormContext();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Extract text content from value (handles JSON, TipTap content, etc.)
  const parsedValue = extractTextFromValue(value);

  // Adjust height on mount and when value changes
  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [parsedValue, adjustTextareaHeight]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams: setProductParams } = useProductParams();

  // Get current line item data for learning
  const currentPrice = watch(`lineItems.${index}.price`);
  const currentUnit = watch(`lineItems.${index}.unit`);
  const currentProductId = watch(`lineItems.${index}.productId`);
  const currency = watch("template.currency");
  const locale = watch("template.locale");
  const includeDecimals = watch("template.includeDecimals");

  const maximumFractionDigits = includeDecimals ? 2 : 0;

  // Mutation for saving line item as product
  const saveLineItemAsProductMutation = useMutation(
    trpc.invoiceProducts.saveLineItemAsProduct.mutationOptions({
      onSuccess: (result) => {
        // Invalidate products query to get fresh data
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });

        if (result.shouldClearProductId) {
          // Clear the old product reference (name was removed or changed)
          setValue(`lineItems.${index}.productId`, undefined, {
            shouldValidate: true,
            shouldDirty: true,
          });

          // If we found/created a new product, set the new reference
          if (result.product) {
            setValue(`lineItems.${index}.productId`, result.product.id, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        } else if (result.product && !currentProductId) {
          // Set the product reference if we saved/found a product
          setValue(`lineItems.${index}.productId`, result.product.id, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      },
    }),
  );

  // Mutation for incrementing usage count when product is selected
  const incrementUsageMutation = useMutation(
    trpc.invoiceProducts.incrementUsage.mutationOptions({
      onSuccess: () => {
        // Invalidate products query to get fresh usage counts
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
      },
    }),
  );

  // Get all products for client-side filtering
  const { data: allProducts = [] } = useQuery(
    trpc.invoiceProducts.get.queryOptions(
      {
        currency,
      },
      {
        staleTime: 300000, // Cache for 5 minutes
      },
    ),
  );

  // Filter products instantly on client-side
  const filteredProducts =
    parsedValue.trim().length >= 2
      ? allProducts.filter((product) =>
          product.name.toLowerCase().includes(parsedValue.toLowerCase()),
        )
      : allProducts.slice(0, 5); // Show top 5 when not searching

  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setSelectedIndex(-1); // Reset selection when typing

      // If the input is cleared/erased and we have a productId, remove it
      if (newValue.trim() === "" && currentProductId) {
        setValue(`lineItems.${index}.productId`, undefined, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Show suggestions when typing (productId check is in render condition)
      if (isFocused) {
        setShowSuggestions(true);
      }

      // Adjust textarea height after value change
      requestAnimationFrame(adjustTextareaHeight);
    },
    [
      onChange,
      isFocused,
      currentProductId,
      setValue,
      index,
      adjustTextareaHeight,
    ],
  );

  const handleProductSelect = useCallback(
    (product: InvoiceProduct) => {
      // Fill in the line item with product data
      setValue(`lineItems.${index}.name`, product.name, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (product.price) {
        setValue(`lineItems.${index}.price`, product.price, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (product.unit) {
        setValue(`lineItems.${index}.unit`, product.unit, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Auto-fill tax rate if product has one
      if (product.taxRate !== null && product.taxRate !== undefined) {
        setValue(`lineItems.${index}.taxRate`, product.taxRate, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Set product reference
      setValue(`lineItems.${index}.productId`, product.id, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Increment usage count since user actively selected this product
      incrementUsageMutation.mutate({ id: product.id });

      setShowSuggestions(false);
      onProductSelect?.(product);
    },
    [setValue, index, onProductSelect, incrementUsageMutation],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setSelectedIndex(-1); // Reset selection on focus

    // Only show suggestions if no product is selected (no productId)
    if (!currentProductId) {
      setShowSuggestions(true);
    }
  }, [currentProductId]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);

    // Only save if there's content OR if we need to clear a productId
    const hasContent = parsedValue && parsedValue.trim().length > 0;
    const needsToClearProductId = !hasContent && currentProductId;

    if (hasContent || needsToClearProductId) {
      saveLineItemAsProductMutation.mutate({
        name: parsedValue || "",
        price: currentPrice !== undefined ? currentPrice : null,
        unit: currentUnit || null,
        productId: currentProductId || undefined,
        currency: currency || null,
      });
    }
  }, [
    parsedValue,
    currentPrice,
    currentUnit,
    currentProductId,
    currency,
    saveLineItemAsProductMutation,
  ]);

  // Use filtered products as the display list
  const displaySuggestions = filteredProducts;

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [displaySuggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Always handle these keys when suggestions are shown
      if (showSuggestions && displaySuggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex((prev) => {
              const newIndex =
                prev === -1
                  ? 0
                  : prev < displaySuggestions.length - 1
                    ? prev + 1
                    : 0;
              return newIndex;
            });
            return;
          case "ArrowUp":
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex((prev) => {
              const newIndex =
                prev === -1
                  ? displaySuggestions.length - 1
                  : prev > 0
                    ? prev - 1
                    : displaySuggestions.length - 1;
              return newIndex;
            });
            return;
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            if (selectedIndex >= 0 && displaySuggestions[selectedIndex]) {
              handleProductSelect(displaySuggestions[selectedIndex]);
            }
            return;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            setShowSuggestions(false);
            setSelectedIndex(-1);
            textareaRef.current?.blur();
            return;
        }
      }

      // Handle Tab separately
      if (e.key === "Tab") {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [showSuggestions, displaySuggestions, selectedIndex, handleProductSelect],
  );

  // Match the exact placeholder logic from the Editor component
  const showPlaceholder = !parsedValue && !isFocused;

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={parsedValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={
          isFocused && !parsedValue ? "Search or create product..." : ""
        }
        role="combobox"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls="product-suggestions-listbox"
        aria-activedescendant={
          selectedIndex >= 0 ? `product-option-${selectedIndex}` : undefined
        }
        className={cn(
          "border-0 p-0 min-h-6 border-b border-transparent focus:border-border text-xs pt-1",
          "transition-colors duration-200 bg-transparent outline-none resize-none w-full",
          "text-primary leading-[18px] invoice-editor overflow-hidden",
          "placeholder:font-sans placeholder:text-muted-foreground",
          showPlaceholder &&
            "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
        )}
      />

      {showSuggestions &&
        !currentProductId &&
        displaySuggestions.length > 0 && (
          <div
            id="product-suggestions-listbox"
            className="absolute z-50 mt-1 bg-background border shadow-md max-h-64 overflow-y-auto right-0 left-0"
          >
            {displaySuggestions.map((product, suggestionIndex) => (
              <div
                key={product.id}
                id={`product-option-${suggestionIndex}`}
                aria-selected={selectedIndex === suggestionIndex}
                className={cn(
                  "w-full cursor-pointer px-3 py-2 transition-colors",
                  selectedIndex === suggestionIndex &&
                    "bg-accent text-accent-foreground",
                  hoveredIndex === suggestionIndex &&
                    "bg-accent text-accent-foreground",
                )}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur from firing before click
                  handleProductSelect(product);
                }}
                onMouseEnter={() => {
                  setSelectedIndex(suggestionIndex);
                  setHoveredIndex(suggestionIndex);
                }}
                onMouseLeave={() => setHoveredIndex(-1)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <div className="text-xs">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {product.price && product.currency && (
                        <span>
                          {formatAmount({
                            amount: product.price,
                            currency: product.currency,
                            locale,
                            maximumFractionDigits,
                          })}
                          {product.unit && `/${product.unit}`}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex justify-end transition-all duration-150 ease-out",
                        hoveredIndex === suggestionIndex ? "w-8" : "w-0",
                      )}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur from firing before click
                          e.stopPropagation();
                          setProductParams({ productId: product.id });
                          setShowSuggestions(false);
                        }}
                        className={cn(
                          "text-xs px-1 transition-all duration-150 ease-out",
                          hoveredIndex === suggestionIndex
                            ? "opacity-50 hover:opacity-100"
                            : "opacity-0 pointer-events-none",
                        )}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
