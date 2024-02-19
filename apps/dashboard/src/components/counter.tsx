"use client";

import { useCurrentLocale } from "@/locales/client";
import { useEffect, useRef, useState } from "react";

const max = 20000;

const Character = ({ className, value }) => {
  return (
    <span data-value={value} className={`character ${className || ""}`}>
      <span className="character__track" style={{ "--v": value }}>
        <span>9</span>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val, index) => {
          return <span key={`${value}--${index.toString()}`}>{val}</span>;
        })}
        <span>0</span>
      </span>
    </span>
  );
};

const InnerCounter = ({ currency, pad, value, locale }) => {
  if (!currency) {
    return null;
  }

  const padCount = pad
    ? max.toFixed(2).toString().length - value.toString().length
    : 0;

  const paddedValue = value
    .toString()
    .padStart(value.toString().length + padCount, "1");

  let i = 0;
  const renderValue = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  })
    .format(paddedValue)
    .split("")
    .map((character) => {
      if (!Number.isNaN(parseInt(character, 10)) && i < padCount) {
        i++;
        return "0";
      }
      return character;
    })
    .join("");

  return (
    <div className="counter font-mono">
      <fieldset>
        <h2>
          <span className="sr-only">{renderValue}</span>
          <span aria-hidden="true" className="characters">
            {renderValue.split("").map((character, index) => {
              if (Number.isNaN(parseInt(character, 10)))
                return (
                  <span
                    key={index.toString()}
                    className="character character--symbol"
                  >
                    {character}
                  </span>
                );
              return (
                <Character
                  key={index.toString()}
                  value={character}
                  className={
                    index > renderValue.split("").length - 3 ? "fraction" : ""
                  }
                />
              );
            })}
          </span>
        </h2>
      </fieldset>
    </div>
  );
};

export function Counter({
  value: initalValue,
  currency,
  lastPeriodAmount = 0,
}) {
  const locale = useCurrentLocale();
  const hasRunned = useRef(false);
  const [value, setValue] = useState(initalValue - lastPeriodAmount);

  useEffect(() => {
    if (value !== initalValue) {
      setValue(initalValue);
    }
  }, [initalValue]);

  useEffect(() => {
    if (!hasRunned.current) {
      setValue((prev) => prev + lastPeriodAmount);
      hasRunned.current = true;
    }
  }, [lastPeriodAmount, hasRunned]);

  return (
    <>
      {value > 0 && (
        <InnerCounter value={value} currency={currency} locale={locale} />
      )}
      {value > 0 && (
        <InnerCounter value={value} currency={currency} locale={locale} />
      )}
    </>
  );
}
