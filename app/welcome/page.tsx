"use client";

import Image from "next/image";
import Login from "@/components/auth/Login";
import { motion } from "framer-motion";

export default function WelcomePage() {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center relative overflow-hidden
        bg-gradient-to-br from-primary/40 via-background to-accent/40
        dark:from-gray-900 dark:via-gray-800 dark:to-black
        animate-gradient
      "
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)] pointer-events-none"></div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="
          w-full max-w-6xl mx-auto flex flex-col md:flex-row relative z-10
          bg-white/40 dark:bg-white/5 backdrop-blur-xl 
          border border-white/40 dark:border-white/10 
          rounded-3xl shadow-2xl overflow-hidden
        "
      >
        {/* LEFT — LOGIN */}
        <div className="flex-1 flex items-center justify-center p-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="
              w-full max-w-md bg-background/60 dark:bg-gray-900/40 
              p-10 rounded-2xl shadow-xl border border-border/50
            "
          >
            <motion.h2
              className="text-3xl font-bold text-center mb-6 text-foreground dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
            </motion.h2>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Login onLogin={() => {}} />
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT — IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex-1 hidden md:flex items-center justify-center p-10"
        >
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="rounded-3xl overflow-hidden shadow-2xl border border-white/20"
          >
            <Image
              src="/welcome.jpg"
              alt="Welcome Image"
              width={600}
              height={600}
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Soft Blend on bottom */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-background dark:from-black to-transparent"></div>
    </div>
  );
}
