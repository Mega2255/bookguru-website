import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ads = [
  {
    id: 1,
    title: "Do You Want to Learn a Tech Skill?",
    subtitle: "Join our exclusive WhatsApp community and start learning today!",
    buttonText: "Join WhatsApp Group",
    link: "https://wa.me/2348108745980?text=I%20want%20to%20learn%20a%20tech%20skill",
    image: "https://illustrations.popsy.co/violet/web-design.svg",
  },
  {
    id: 2,
    title: "Final Year Student?",
    subtitle:
      "Get professional help with your final year project — research, coding, documentation & more.",
    buttonText: "Contact Project Support",
    link: "https://wa.me/2348108745980?text=Hello,%20I%20need%20help%20with%20my%20final%20year%20project",
    image: "https://illustrations.popsy.co/violet/studying.svg",
  },
];

export default function PromoPopup() {
  const [visible, setVisible] = useState(true); // show at homepage load
  const [index, setIndex] = useState(0);

  // rotate every 20 seconds
  useEffect(() => {
    const rotate = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, 20000);

    return () => clearInterval(rotate);
  }, []);

  if (!visible) return null; // hide when X is clicked

  const ad = ads[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[999]"
      >
        <motion.div
          key={ad.id}
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl max-w-4xl w-[90%] md:w-[70%] p-8 flex flex-col md:flex-row items-center"
        >
          {/* close button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
          >
            <X size={28} />
          </button>

          {/* text */}
          <div className="md:w-1/2 pr-6">
            <h2 className="text-3xl font-extrabold text-green-700 leading-tight">
              {ad.title}
            </h2>
            <p className="mt-4 text-gray-700 text-base">{ad.subtitle}</p>

            <a
              href={ad.link}
              target="_blank"
              className="inline-block mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
            >
              {ad.buttonText}
            </a>

            <p className="mt-3 text-sm text-gray-500">
              {index + 1} / {ads.length}
            </p>
          </div>

          {/* image */}
          <div className="md:w-1/2 mt-6 md:mt-0 flex justify-center">
            <img
              src={ad.image}
              alt="Promo"
              className="w-64 md:w-80 drop-shadow-2xl"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
