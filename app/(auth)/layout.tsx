import React from "react";
import { Landmark, Shield, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#d3daea] w-full flex items-start justify-center pt-20">
      <div className="flex flex-col items-center w-full gap-10">
        <div className="flex gap-2 items-center text-3xl font-semibold">
          <Landmark color="#00685F" size={30} />
          <h1>Payflow</h1>
        </div>
        <Card className="max-w-110 m-auto rounded-4xl w-full !px-0">
          {children}
        </Card>
      </div>
      <div className="fixed bottom-0 right-0 w-1/3 h-1/3 opacity-20 pointer-events-none blur-3xl bg-[#001a17]" />
    </div>
  );
}
