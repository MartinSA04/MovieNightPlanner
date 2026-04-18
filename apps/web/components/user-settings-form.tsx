"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import {
  SectionHeading,
  buttonVariants,
  cn,
  inputClassName
} from "@movie-night/ui";
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
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span>Country code</span>
          <RegionSelect
            className={inputClassName}
            name="countryCode"
            onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
            value={countryCode}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <SectionHeading>Streaming services</SectionHeading>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {selectedServiceIds.size === 1
                ? "1 selected"
                : `${selectedServiceIds.size} selected`}{" "}
              / {services.length === 1 ? "1 service" : `${services.length} services`} /{" "}
              {countryCode}
            </p>
          </div>

          {!tmdbConfigured ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Using stored providers.</p>
          ) : null}
        </div>

        {serviceError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {serviceError}
          </div>
        ) : null}

        {Array.from(selectedServiceIds).map((serviceId) => (
          <input key={serviceId} name="providerIds" type="hidden" value={serviceId} />
        ))}

        {isLoadingServices ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Loading services…
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="relative h-72 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50 md:h-80">
            <div className="absolute inset-0 overflow-y-auto p-3 pr-2">
              <div className="grid gap-3 pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {filteredServices.map((service) => {
                  const checked = selectedServiceIds.has(service.id);

                  return (
                    <label
                      key={service.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-4 rounded-[24px] border px-4 py-4 transition",
                        checked
                          ? "border-slate-950 bg-slate-950 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950"
                          : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:border-slate-600"
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
                          className="h-10 w-10 rounded-xl bg-white/90 object-contain p-2"
                          height={40}
                          loading="lazy"
                          src={`${TMDB_LOGO_BASE_URL}${service.logoPath}`}
                          width={40}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold uppercase",
                            checked
                              ? "bg-white/20 text-current dark:bg-slate-950/15"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          )}
                        >
                          {getInitials(service.name)}
                        </span>
                      )}

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{service.name}</span>
                        <span
                          className={cn(
                            "block text-xs uppercase tracking-[0.18em]",
                            checked
                              ? "text-white/70 dark:text-slate-950/65"
                              : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          TMDb
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          checked
                            ? "border-white bg-white text-slate-950 dark:border-slate-950 dark:bg-slate-950 dark:text-amber-300"
                            : "border-slate-300 dark:border-slate-700"
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
          <div className="rounded-[28px] border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
            <p className="text-base font-semibold text-slate-950 dark:text-white">No matching services</p>
          </div>
        )}
      </div>

      <button className={buttonVariants()} disabled={isLoadingServices}>
        {isLoadingServices ? "Loading services" : "Save"}
      </button>
    </form>
  );
}
