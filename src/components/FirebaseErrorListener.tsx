"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { useToast } from "@/hooks/use-toast";

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      console.error("Firebase Permission Error:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `You do not have permission to ${error.context.operation} at ${error.context.path}. Please ensure you are logged in correctly.`,
      });
    };

    errorEmitter.on("permission-error", handlePermissionError);
    return () => {
      errorEmitter.removeListener("permission-error", handlePermissionError);
    };
  }, [toast]);

  return null;
}
