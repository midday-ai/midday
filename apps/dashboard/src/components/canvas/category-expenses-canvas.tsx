"use client";

import { BaseCanvas } from "@/components/canvas/base";

export function CategoryExpensesCanvas() {
  return (
    <BaseCanvas>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Category Expenses
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed breakdown by expense categories
              </p>
            </div>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Category expenses data will appear here
            </p>
          </div>
        </div>
      </div>
    </BaseCanvas>
  );
}
