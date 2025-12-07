"use client";

import Image from "next/image";
import Login from "@/components/auth/Login";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Page Container */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 p-8">
        
        {/* LEFT SIDE — LOGIN BOX */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <Login onLogin={() => {}} />
          </div>
        </div>

        {/* RIGHT SIDE — IMAGE DISPLAY */}
        <div className="hidden md:flex items-center justify-center">
          <Image
            src="/welcome.jpg"  // <-- Change to your image
            alt="Welcome Image"
            width={500}
            height={500}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

      </div>
    </div>
  );
}
