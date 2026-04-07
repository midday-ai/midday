import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
const WEATHER_CACHE_SECONDS = 60 * 10;
const WEATHER_STALE_SECONDS = 60 * 60 * 24;

function isTemperatureUnit(
  value: string | null,
): value is "celsius" | "fahrenheit" {
  return value === "celsius" || value === "fahrenheit";
}

function getFallbackWeather(city: string, unit: "celsius" | "fahrenheit") {
  return {
    city,
    temp: unit === "fahrenheit" ? 43 : 6,
    high: unit === "fahrenheit" ? 48 : 9,
    low: unit === "fahrenheit" ? 37 : 3,
    code: 3,
    sunset: "7:42 PM",
    unit,
  };
}

function weatherResponse(
  body:
    | ReturnType<typeof getFallbackWeather>
    | {
        city: string;
        temp: number;
        high: number;
        low: number;
        code: number;
        sunset: string | undefined;
        unit: "celsius" | "fahrenheit";
      },
) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      "CDN-Cache-Control": `public, s-maxage=${WEATHER_CACHE_SECONDS}, stale-while-revalidate=${WEATHER_STALE_SECONDS}`,
      "Vercel-CDN-Cache-Control": `public, s-maxage=${WEATHER_CACHE_SECONDS}, stale-while-revalidate=${WEATHER_STALE_SECONDS}`,
      Vary: "x-vercel-ip-city, x-vercel-ip-latitude, x-vercel-ip-longitude",
    },
  });
}

export async function GET(request: NextRequest) {
  const city =
    (request.headers.get("x-vercel-ip-city")
      ? decodeURIComponent(request.headers.get("x-vercel-ip-city")!)
      : undefined) ?? "Stockholm";
  const latitude = request.headers.get("x-vercel-ip-latitude") ?? "59.3293";
  const longitude = request.headers.get("x-vercel-ip-longitude") ?? "18.0686";
  const requestedUnit = request.nextUrl.searchParams.get("unit");
  const unit = isTemperatureUnit(requestedUnit) ? requestedUnit : "celsius";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunset&temperature_unit=${unit}&timezone=auto&forecast_days=1`,
      {
        signal: controller.signal,
        next: { revalidate: WEATHER_CACHE_SECONDS },
      },
    );

    if (!res.ok) {
      return weatherResponse(getFallbackWeather(city, unit));
    }

    const weather = await res.json();

    const sunsetISO = weather.daily?.sunset?.[0] as string | undefined;
    let sunsetDisplay: string | undefined;
    if (sunsetISO) {
      const d = new Date(sunsetISO);
      const h = d.getHours() % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = d.getHours() >= 12 ? "PM" : "AM";
      sunsetDisplay = `${h}:${m} ${ampm}`;
    }

    return weatherResponse({
      city,
      temp: Math.round(weather.current.temperature_2m),
      high: Math.round(weather.daily.temperature_2m_max[0]),
      low: Math.round(weather.daily.temperature_2m_min[0]),
      code: weather.current.weather_code,
      sunset: sunsetDisplay,
      unit,
    });
  } catch {
    return weatherResponse(getFallbackWeather(city, unit));
  } finally {
    clearTimeout(timeoutId);
  }
}
