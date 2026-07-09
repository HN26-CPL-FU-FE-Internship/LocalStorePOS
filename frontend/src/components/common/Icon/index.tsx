import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

export interface IconProps {
  /** icon name without the "icon-" prefix, e.g. "box", "badge-dollar-sign" */
  name: string;
  className?: string;
  style?: CSSProperties;
}

const toPascalCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");

const Icon = ({ name, className = "", style }: IconProps) => {
  const pascalName = toPascalCase(name);
  const IconComponent = ((LucideIcons as unknown) as Record<string, LucideIcon | undefined>)[pascalName] ?? LucideIcons.CircleHelp;

  return (
    <IconComponent
      className={className}
      style={{ width: "1em", height: "1em", ...style }}
      aria-hidden="true"
    />
  );
};

export default Icon;
