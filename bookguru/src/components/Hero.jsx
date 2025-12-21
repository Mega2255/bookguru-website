import React from 'react'
import { motion } from 'framer-motion'

export default function Hero(){
  return (
    <section className="pt-12 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight text-green-700">
            Prepare. Practice. <span className="text-orange-600">Pass</span> your exams with BookGuru.
          </h1>
          <p className="mt-5 text-xl text-gray-700">
            Learn smart. Pass easy. Real exam simulations, past questions, and an active student community.
          </p>
          <p>Access all bookguru features free from now till January 8th 2026.</p>
          <div className="mt-8 flex gap-4">
            {/* Primary CTA - High-contrast orange */}
            <a href="#" className="inline-block px-8 py-3 bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition duration-300">
              Start Practicing
            </a>
            {/* Secondary CTA - High-contrast border */}
            <a href="#" className="inline-block px-6 py-3 border-2 border-green-700 text-green-700 text-lg font-medium rounded-xl hover:bg-green-50 transition duration-300">
              Learn More
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex justify-center md:justify-end">
          {/* Enhanced image styling with rounded corners and deeper shadow */}
          <img src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1f3f6c8f2d4d4d6c8f5b1c7f3a6b8c5a" alt="students studying and collaborating" className="w-full max-w-lg rounded-2xl shadow-xl border-4 border-white" />
        </motion.div>
      </div>
    </section>
  )
}