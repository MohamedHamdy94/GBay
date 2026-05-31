"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000/auctions";

export function useAuctionSocket(auctionId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastBid, setLastBid] = useState<any>(null);
  const [newEndTime, setNewEndTime] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [watchers, setWatchers] = useState(0);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    s.on("connect", () => {
      console.log("Connected to auction socket");
      s.emit("auction:join", { auctionId });
    });

    s.on("auction:bid", (payload) => {
      console.log("New bid received", payload);
      setLastBid(payload);
    });

    s.on("auction:extension", (payload) => {
      console.log("Auction extended", payload);
      setNewEndTime(payload.newEndTime);
    });

    s.on("auction:ended", (payload) => {
      console.log("Auction ended", payload);
      setIsEnded(true);
      setWinner(payload);
    });

    s.on("auction:watchers", (payload) => {
      setWatchers(payload.count);
    });

    setSocket(s);

    return () => {
      s.emit("auction:leave", { auctionId });
      s.disconnect();
    };
  }, [auctionId]);

  return { lastBid, newEndTime, isEnded, winner, watchers };
}
