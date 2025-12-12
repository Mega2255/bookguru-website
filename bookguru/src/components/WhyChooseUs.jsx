import React from 'react'
import { CheckCircle, DollarSign, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const cards = [
  {icon: CheckCircle, title: 'Real Exam Experience', desc: 'Highly realistic computer-based tests that simulate the official exam environment.'},
  {icon: DollarSign, title: 'Affordable Materials', desc: 'Access premium study materials and past questions without breaking the bank.'},
  {icon: Users, title: 'Active Community', desc: 'Join discussions and study groups to share knowledge and stay motivated.'},
  {icon: TrendingUp, title: 'Guaranteed Improvement', desc: 'Track your progress with analytics and see measurable growth in your scores.'},
]

export default function WhyChooseUs(){
  return (
    <section className="py-12 bg-green-50 rounded-2xl"> 
      <h2 className="text-3xl font-bold text-center text-green-700 mb-10">Why Choose BookGuru?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div 
              key={c.title} 
              initial={{ y: 15, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: i*0.06 }} 
              className="p-6 bg-white rounded-xl shadow-md flex items-start gap-4 hover:shadow-lg hover:border-orange-200 transition duration-300 border border-transparent"
            >
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600 flex-shrink-0">
                <Icon size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-green-700 mb-1">{c.title}</h3>
                <p className="text-gray-600 text-sm">{c.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}