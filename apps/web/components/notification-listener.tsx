"use client";

import { useNotificationSocket } from "@/hooks/use-notification-socket";

export function NotificationListener() {
  // Just calling the hook is enough to initialize the socket and listeners
  useNotificationSocket();
  
  return null;
}
