'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WsMessage } from '@nightguard/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useRealtimeSubscription(onMessage?: (msg: WsMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nightguard_token') : '';
      const url = `${WS_URL}/ws/dashboard${token ? `?token=${token}` : ''}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WEBSOCKET] Connected to NightGuard live dashboard stream.');
      };

      ws.onmessage = (event) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          setLastEventTime(new Date());
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('[WEBSOCKET] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential backoff or 3s retry
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[WEBSOCKET] Connection error, will retry.');
        ws.close();
      };
    } catch (err) {
      console.warn('[WEBSOCKET] Initialization failed:', err);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastEventTime };
}
