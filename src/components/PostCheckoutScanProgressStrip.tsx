import { Loader2, Mail, Globe, CheckCircle2 } from "lucide-react";

interface Props {
  /** Inbox scan currently running. */
  inboxScanning: boolean;
  /** Broker scan currently running. */
  brokerScanning: boolean;
  /** True once at least one inbox result has landed. */
  inboxHasResults: boolean;
  /** True once at least one broker result has landed. */
  brokerHasResults: boolean;
}

/**
 * Thin live "progress bleed" strip that sits between the next-steps panel and
 * the dashboard body. Its only job is to make the system *feel* alive so the
 * user never wonders "did anything actually start?"
 *
 * Hides itself once nothing is in flight and nothing has reported back yet.
 */
export function PostCheckoutScanProgressStrip({
  inboxScanning,
  brokerScanning,
  inboxHasResults,
  brokerHasResults,
}: Props) {
  const showInbox = inboxScanning || inboxHasResults;
  const showBroker = brokerScanning || brokerHasResults;
  if (!showInbox && !showBroker) return null;

  return (
    <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {showInbox && (
          <div className="flex items-center gap-2">
            {inboxScanning ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className={inboxScanning ? "text-foreground" : "text-muted-foreground"}>
              {inboxScanning ? "Scanning your inbox…" : "Inbox scan complete"}
            </span>
          </div>
        )}
        {showBroker && (
          <div className="flex items-center gap-2">
            {brokerScanning ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className={brokerScanning ? "text-foreground" : "text-muted-foreground"}>
              {brokerScanning ? "Checking data brokers…" : "Broker scan complete"}
            </span>
          </div>
        )}
      </div>
      {(inboxScanning || brokerScanning) && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Results stream in below as each source responds. You can keep using the page.
        </p>
      )}
    </div>
  );
}
