"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@heroui/react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface ReceiptScannerProps {
  onScanComplete: (data: any) => void;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedResult,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanReceiptFn(file);
  };

  /* ------------------------------------------------------------------------ */
  /* IMPORTANT FIX: pass ONLY scannedResult.data to the form                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!scanReceiptLoading && scannedResult?.success && scannedResult.data) {
      onScanComplete(scannedResult.data);
      toast.success("Receipt scanned successfully");
    }
  }, [scannedResult, scanReceiptLoading, onScanComplete]);

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />

      <Button
        type="button"
        variant="bordered"
        className="w-full h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-navy-500 animate-gradient hover:opacity-90 transition-opacity text-white"
        onPress={() => fileInputRef.current?.click()}
        isDisabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}
