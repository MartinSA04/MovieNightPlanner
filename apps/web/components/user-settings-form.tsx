"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { RegionSelect } from "@/components/region-select";
import { updateUserSettingsAction } from "@/app/(app)/settings/actions";
import type { SettingsServiceOption } from "@/server/settings";

const TMDB_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w92";

interface UserSettingsFormProps {
  initialCountryCode: string;
  initialSelectedServiceIds: string[];
  initialServices: SettingsServiceOption[];
  tmdbConfigured: boolean;
}

interface ProviderResponse {
  error?: string;
  services?: SettingsServiceOption[];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserSettingsForm({
  initialCountryCode,
  initialSelectedServiceIds,
  initialServices,
  tmdbConfigured
}: UserSettingsFormProps) {
  const [countryCode, setCountryCode] = useState(initialCountryCode.toUpperCase());
  const [loadedCountryCode, setLoadedCountryCode] = useState(initialCountryCode.toUpperCase());
  const [services, setServices] = useState(initialServices);
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    () => new Set(initialSelectedServiceIds)
  );
  const [query, setQuery] = useState("");
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    if (!tmdbConfigured || countryCode === loadedCountryCode) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setIsLoadingServices(true);
    setServiceError(null);

    void fetch(`/api/settings/providers?countryCode=${encodeURIComponent(countryCode)}`, {
      method: "GET",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = (await response.json()) as ProviderResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load streaming services.");
        }

        return payload.services ?? [];
      })
      .then((nextServices) => {
        if (cancelled) {
          return;
        }

        const nextServiceIdSet = new Set(nextServices.map((service) => service.id));

        setServices(nextServices);
        setLoadedCountryCode(countryCode);
        setSelectedServiceIds((current) => {
          const nextSelected = new Set<string>();

          for (const serviceId of current) {
            if (nextServiceIdSet.has(serviceId)) {
              nextSelected.add(serviceId);
            }
          }

          return nextSelected;
        });
      })
      .catch((error) => {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        setLoadedCountryCode(countryCode);
        setServiceError(
          error instanceof Error ? error.message : "Could not load streaming services."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingServices(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [countryCode, loadedCountryCode, tmdbConfigured]);

  const filteredServices = useMemo(() => {
    if (deferredQuery.length === 0) {
      return [...services].sort((left, right) => {
        const leftSelected = selectedServiceIds.has(left.id) ? 0 : 1;
        const rightSelected = selectedServiceIds.has(right.id) ? 0 : 1;

        if (leftSelected !== rightSelected) {
          return leftSelected - rightSelected;
        }

        return 0;
      });
    }

    return services
      .filter((service) => service.name.toLowerCase().includes(deferredQuery))
      .sort((left, right) => {
        const leftSelected = selectedServiceIds.has(left.id) ? 0 : 1;
        const rightSelected = selectedServiceIds.has(right.id) ? 0 : 1;

        if (leftSelected !== rightSelected) {
          return leftSelected - rightSelected;
        }

        return 0;
      });
  }, [deferredQuery, selectedServiceIds, services]);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => {
      const next = new Set(current);

      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }

      return next;
    });
  }

  return (
    <form action={updateUserSettingsAction} className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Country</span>
          <RegionSelect
            className={inputClassName}
            name="countryCode"
            onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
            value={countryCode}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Search services</span>
          <input
            className={inputClassName}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by service name"
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Streaming services</h2>
          <p className="text-sm text-muted-foreground">
            {selectedServiceIds.size === 1
              ? "1 selected"
              : `${selectedServiceIds.size} selected`}
            {" · "}
            {services.length === 1 ? "1 available" : `${services.length} available`}
            {" · "}
            {countryCode}
          </p>
        </div>

        {!tmdbConfigured ? (
          <p className="text-xs text-muted-foreground">Using stored providers.</p>
        ) : null}

        {serviceError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serviceError}
          </div>
        ) : null}

        {Array.from(selectedServiceIds).map((serviceId) => (
          <input key={serviceId} name="providerIds" type="hidden" value={serviceId} />
        ))}

        {isLoadingServices ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
            Loading services…
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="relative h-[calc(100vh-30rem)] min-h-[12rem] overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="absolute inset-0 overflow-y-auto p-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => {
                const checked = selectedServiceIds.has(service.id);

                return (
                  <label
                    key={service.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      checked
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/60 bg-transparent text-foreground hover:border-primary/30 hover:bg-secondary/40"
                    )}
                  >
                    <input
                      checked={checked}
                      className="sr-only"
                      onChange={() => toggleService(service.id)}
                      type="checkbox"
                    />
                    {service.logoPath ? (
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-9 w-9 rounded-md bg-background object-contain p-1.5"
                        height={36}
                        loading="lazy"
                        src={`${TMDB_LOGO_BASE_URL}${service.logoPath}`}
                        width={36}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold uppercase text-primary"
                      >
                        {getInitials(service.name)}
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {service.name}
                    </span>

                    <span
                      className={cn(
                        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70"
                      )}
                    >
                      {checked ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  </label>
                );
              })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">No matching services</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          className={buttonVariants({ size: "sm" })}
          disabled={isLoadingServices}
          type="submit"
        >
          {isLoadingServices ? "Loading…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
