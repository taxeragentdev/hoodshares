"use client";

import { useEffect, useState } from "react";

/** False on the server and the first client paint so wagmi cannot mismatch HTML. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return ready;
}
