import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const images = [
  "https://illustrations.popsy.co/white/team-work.svg",
  "https://illustrations.popsy.co/white/brainstorming.svg",
  "https://illustrations.popsy.co/white/work-from-home.svg",
];

export default function ProjectHelpBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative py-16 px-6 md:px-12 lg:px-20 overflow-hidden">

      {/* 🔥 Green → Orange Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f6f44] via-[#18a05c] to-[#ff7f11] opacity-95"></div>

      {/* 🔵 Floating soft shapes */}
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-12 left-10 w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full blur-xl"
      ></motion.div>

      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute bottom-10 right-10 w-32 h-32 bg-orange-300/25 rounded-full blur-2xl"
      ></motion.div>

      {/* CONTENT (foreground) */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-14 max-w-6xl mx-auto">

        {/* LEFT TEXT */}
        <div className="text-white max-w-xl">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          >
            Need Help With  
            <span className="text-[#ff7f11]"> School Projects</span>  
            or Assignments?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-4 text-lg text-white/90"
          >
            Get fast, reliable & professionally-written project materials, 
            coding assignments, and research support — delivered with quality.
          </motion.p>

          {/* CTA BUTTON */}
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            href="https://wa.me/2348108745980?text=Hello,%20I%20need%20help%20with%20a%20project%20or%20assignment"
            target="_blank"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-[#0f6f44] font-bold rounded-xl shadow-xl hover:bg-[#ff7f11] hover:text-white transition-all"
          >
            <MessageCircle size={22} />
            Get Help on WhatsApp
          </motion.a>
        </div>

        {/* RIGHT — CAROUSEL IMAGE */}
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full md:w-1/2 flex justify-center"
        >
          <img
            src={images[index]}
            alt="Project Illustration"
            className="w-full max-w-md drop-shadow-2xl rounded-xl"
          />
        </motion.div>
      </div>

      {/* WhatsApp floating bubble */}
      <a
        href="https://wa.me/2348108745980"
        target="_blank"
        className="fixed bottom-6 right-6 z-50 bg-[#0f6f44] hover:bg-[#0d5a38] text-white p-4 rounded-full shadow-2xl transition"
      >
        <MessageCircle size={30} />
      </a>

    </section>
  );
}
