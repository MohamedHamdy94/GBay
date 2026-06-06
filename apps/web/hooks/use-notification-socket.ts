"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "./use-toast";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL?.replace('/auctions', '/notifications') || "http://localhost:4000/notifications";

export function useNotificationSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    const token = getCookie("gbay_token");
    if (!token) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    s.on("connect", () => {
      console.log("Connected to notification socket");
    });

    s.on("notification:new", (notification: any) => {
      console.log("New notification received", notification);
      toast({
        title: notification.title,
        description: notification.body,
        // variant: "default", // or based on type
      });
    });

    s.on("connect_error", (error) => {
      console.error("Notification socket connection error", error);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [toast]);

  return { socket };
}
