"use client";

import { useTranslations } from "next-intl";
import { useCountdown } from "@/hooks/use-countdown";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: string;
}

export function CountdownTimer({ endTime }: CountdownTimerProps) {
  const t = useTranslations("auctions");
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-500 font-bold">
        <Clock className="h-4 w-4" />
        {t("auction_ended")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-bold">
      <Clock className="h-5 w-5 text-primary" />
      <div className="flex gap-1">
        {days > 0 && (
          <span>
            {days}
            <span className="text-xs font-normal ml-0.5">{t("days")}</span>
          </span>
        )}
        <span>
          {hours.toString().padStart(2, "0")}
          <span className="text-xs font-normal ml-0.5">{t("hours")}</span>
        </span>
        <span className="text-muted-foreground">:</span>
        <span>
          {minutes.toString().padStart(2, "0")}
          <span className="text-xs font-normal ml-0.5">{t("minutes")}</span>
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="text-primary">
          {seconds.toString().padStart(2, "0")}
          <span className="text-xs font-normal ml-0.5">{t("seconds")}</span>
        </span>
      </div>
    </div>
  );
}
