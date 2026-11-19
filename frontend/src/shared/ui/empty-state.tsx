import type { ReactNode } from "react";
import Icon, { type IconName } from "./icon";

type EmptyStateProps = { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode };

export default function EmptyState({ icon = "search", title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {children && <p className="lead">{children}</p>}
      {action}
    </div>
  );
}
