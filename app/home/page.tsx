"use client";

import Image from "next/image";
import Login from "@/components/auth/Login";

export default function WelcomePage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      
      {/* LEFT: LOGIN */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Login onLogin={() => {}} />
        </div>
      </div>

      {/* RIGHT: IMAGE */}
      <div className="hidden md:flex items-center justify-center bg-muted p-8">
        <Image
          src="/welcome.jpg" // or your image
          alt="Welcome"
          width={800}
          height={600}
          className="rounded-1xl shadow-xl object-cover"
        />
      </div>

    </div>
  );
}
