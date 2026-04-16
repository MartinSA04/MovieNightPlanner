import type { SelectHTMLAttributes } from "react";
import { REGION_OPTIONS } from "@/lib/regions";

type RegionSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function RegionSelect({ className, defaultValue = "US", ...props }: RegionSelectProps) {
  const normalizedDefaultValue =
    typeof defaultValue === "string" ? defaultValue.toUpperCase() : defaultValue;
  const controlledValue = typeof props.value === "string" ? props.value.toUpperCase() : props.value;

  return (
    <select
      className={className}
      required
      {...(props.value === undefined ? { defaultValue: normalizedDefaultValue } : {})}
      {...props}
      {...(props.value === undefined ? {} : { value: controlledValue })}
    >
      {REGION_OPTIONS.map((region) => (
        <option key={region.code} value={region.code}>
          {region.label} ({region.code})
        </option>
      ))}
    </select>
  );
}
