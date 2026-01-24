'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useIDEStore } from '../stores/ideStore';

interface UsePortScannerOptions {
  /** Polling interval in ms (default: 3000) */
  interval?: number;
  /** Whether to scan immediately on mount (default: true) */
  scanOnMount?: boolean;
  /** Whether scanning is enabled (default: true) */
  enabled?: boolean;
}

interface UsePortScannerReturn {
  /** Currently detected open ports */
  ports: number[];
  /** Currently selected port */
  selectedPort: number | null;
  /** Whether a scan is in progress */
  isScanning: boolean;
  /** Manually trigger a scan */
  scan: () => Promise<void>;
  /** Select a port for preview */
  selectPort: (port: number) => void;
}

export function usePortScanner(options: UsePortScannerOptions = {}): UsePortScannerReturn {
  const { interval = 3000, scanOnMount = true, enabled = true } = options;

  const activePorts = useIDEStore((state) => state.activePorts);
  const selectedPort = useIDEStore((state) => state.selectedPort);
  const syncPortsFromScan = useIDEStore((state) => state.syncPortsFromScan);
  const setSelectedPort = useIDEStore((state) => state.setSelectedPort);
  const setServerPort = useIDEStore((state) => state.setServerPort);

  const isScanningRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get ports as array
  const ports = Object.keys(activePorts).map(Number).sort((a, b) => a - b);

  // Scan for open ports
  const scan = useCallback(async () => {
    if (isScanningRef.current) return;

    isScanningRef.current = true;

    try {
      const response = await fetch('/api/ports/scan');
      const data = await response.json();

      if (data.success && Array.isArray(data.ports)) {
        syncPortsFromScan(data.ports);

        // Default to IDE port (4000) if none selected
        // The IDE/App always runs on 4000, other servers are secondary
        if (!selectedPort) {
          const IDE_PORT = 4000;
          setSelectedPort(IDE_PORT);
          setServerPort(IDE_PORT);
        }
      }
    } catch (err) {
      console.error('Port scan failed:', err);
    } finally {
      isScanningRef.current = false;
    }
  }, [syncPortsFromScan, selectedPort, setSelectedPort, setServerPort]);

  // Select a port
  const selectPort = useCallback((port: number) => {
    setSelectedPort(port);
    setServerPort(port);
  }, [setSelectedPort, setServerPort]);

  // Set up polling
  useEffect(() => {
    if (!enabled) return;

    // Scan on mount if requested
    if (scanOnMount) {
      scan();
    }

    // Set up interval
    intervalRef.current = setInterval(scan, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, scan, scanOnMount]);

  return {
    ports,
    selectedPort,
    isScanning: isScanningRef.current,
    scan,
    selectPort,
  };
}
