import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Archive, Users, BookOpen } from 'lucide-react'

const items = [
  {title: 'CBT Practice', desc: 'Practice with realistic exam simulations and detailed performance reports.', icon: Zap, color: 'text-orange-600'},
  {title: 'Past Questions', desc: 'Access a constantly updated library of verified past questions for all subjects.', icon: Archive, color: 'text-green-600'},
  {title: 'Community Support', desc: 'Join a supportive community to discuss challenges and find study partners.', icon: Users, color: 'text-indigo-600'},
  {title: 'Study Materials', desc: 'Find curated study guides, notes, and resources to supplement your learning.', icon: BookOpen, color: 'text-red-600'},
]

export default function WhatWeOffer(){
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center text-green-700 mb-10">What We Offer to Help You Pass</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it, idx) => {
          const Icon = it.icon;
          return (
            <motion.div 
              key={it.title} 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: idx*0.05 }} 
              className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 text-center"
            >
              {/* Feature Icon */}
              <div className={`mx-auto w-12 h-12 flex items-center justify-center ${it.color} bg-gray-50 rounded-full mb-4`}>
                <Icon size={28} />
              </div>

              <h3 className="font-extrabold text-xl text-green-700 mb-2">{it.title}</h3>
              <p className="text-gray-600 text-sm">{it.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}