import { CalendarDays, GitCommit } from "lucide-react";
import { LegalDocumentVersion } from "@/lib/legal/versions";

interface VersionInfoProps {
  version: LegalDocumentVersion;
  showChangelog?: boolean;
}

export function VersionInfo({ version, showChangelog = false }: VersionInfoProps) {
  return (
    <div className="text-sm text-muted-foreground space-y-2">
      <div className="flex items-center gap-2">
        <GitCommit className="h-4 w-4" />
        <span>Version {version.version}</span>
        <span className="text-muted-foreground/60">•</span>
        <CalendarDays className="h-4 w-4" />
        <span>
          Effective {version.effectiveDate.toLocaleDateString()}
        </span>
      </div>
      
      {showChangelog && version.changes.length > 0 && (
        <div className="mt-4 pl-4 border-l border-border">
          <p className="font-medium mb-2">Changes in this version:</p>
          <ul className="list-disc pl-4 space-y-1">
            {version.changes.map((change, index) => (
              <li key={index} className="text-muted-foreground">
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 