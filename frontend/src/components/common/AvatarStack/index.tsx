import type { AvatarStackItem } from "../../../types";

export interface AvatarStackProps {
  items: AvatarStackItem[];
  size?: "sm" | "md" | "lg";
}

const AvatarStack = ({ items, size = "md" }: AvatarStackProps) => (
  <div className={`avatar-list-stacked avatar-group-${size}`}>
    {items.map((item) => (
      <span className="avatar avatar-rounded" key={item.id}>
        <img className="border border-white" src={item.imageUrl} alt={item.alt} />
      </span>
    ))}
  </div>
);

export default AvatarStack;
