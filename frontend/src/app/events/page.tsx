"use client";

import { Suspense } from "react";
import { EventsContent } from "./EventsContent";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EventsContent />
    </Suspense>
  );
}