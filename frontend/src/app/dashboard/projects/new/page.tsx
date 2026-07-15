"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/projects?create=1");
  }, [router]);

  return (
    <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
      Opening project form...
    </div>
  );
}
