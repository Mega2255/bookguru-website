import React from 'react'
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react' // Added icons

export default function Footer(){
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-16 border-t bg-gray-50"> {/* Light gray background for contrast */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="BookGuru" className="h-9 w-9" />
              <span className="font-bold text-xl text-green-700">Book<span className="text-orange-600">Guru</span></span>
            </div>
            <p className="mt-4 text-gray-600 text-sm">Helping students pass their exams with confidence and ease.</p>
            {/* Social Icons */}
            <div className="flex space-x-4 mt-4">
                <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-green-700 transition"><Facebook size={20} /></a>
                <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-green-700 transition"><Twitter size={20} /></a>
                <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-green-700 transition"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Column 2: Explore Links */}
          <div>
            <h4 className="font-bold text-green-700 mb-3">Explore</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-orange-600 transition">CBT Practice Tests</a></li>
              <li><a href="#" className="hover:text-orange-600 transition">Study Materials</a></li>
              <li><a href="#" className="hover:text-orange-600 transition">Student Community</a></li>
              <li><a href="#" className="hover:text-orange-600 transition">News & Updates</a></li>
            </ul>
          </div>
          
          {/* Column 3: Contact Info */}
          <div>
            <h4 className="font-bold text-green-700 mb-3">Contact</h4>
            <ul className="space-y-3">
                <li className="flex items-center gap-2">
                    <Mail size={16} className="text-green-600"/>
                    <a href="mailto:support@bookguru.com" className="hover:text-orange-600 transition">support@bookguru.com</a>
                </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policy */}
          <div>
            <h4 className="font-bold text-green-700 mb-3">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-orange-600 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-600 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-orange-600 transition">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          © {currentYear} BookGuru. All rights reserved.
        </div>
      </div>
    </footer>
  )
}