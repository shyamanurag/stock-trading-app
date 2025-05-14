'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Globe, Shield, Users, Zap } from 'lucide-react';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('stocks');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold">StockMarket</span>
          </div>
          
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-gray-600 hover:text-indigo-600">Features</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-indigo-600">Pricing</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-indigo-600">Testimonials</Link>
            <Link href="#faq" className="text-gray-600 hover:text-indigo-600">FAQ</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
            <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Trade Smarter with Advanced Market Insights
              </h1>
              <p className="text-xl text-gray-600">
                A professional-grade trading platform with real-time data, advanced analytics, and seamless execution for traders of all levels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo" className="border border-gray-300 bg-white text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 flex items-center justify-center">
                  View Demo
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-200"></div>
                  <div className="w-8 h-8 rounded-full bg-indigo-300"></div>
                  <div className="w-8 h-8 rounded-full bg-indigo-400"></div>
                </div>
                <span>Trusted by 10,000+ traders nationwide</span>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                <div className="flex border-b border-gray-200">
                  <button 
                    className={`flex-1 py-3 text-center ${activeTab === 'stocks' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('stocks')}
                  >
                    Stocks
                  </button>
                  <button 
                    className={`flex-1 py-3 text-center ${activeTab === 'futures' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('futures')}
                  >
                    Futures
                  </button>
                  <button 
                    className={`flex-1 py-3 text-center ${activeTab === 'options' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('options')}
                  >
                    Options
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">NIFTY 50</h3>
                      <p className="text-gray-500 text-sm">NSE</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-semibold">18,245.32</h3>
                      <p className="text-green-600 text-sm">+49.57 (0.27%)</p>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-100 rounded mb-4 flex items-center justify-center">
                    <span className="text-gray-400">Chart Placeholder</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-sm text-gray-500 mb-1">Open</h4>
                      <p className="font-medium">18,210.65</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-sm text-gray-500 mb-1">Previous Close</h4>
                      <p className="font-medium">18,195.75</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-sm text-gray-500 mb-1">Day High</h4>
                      <p className="font-medium">18,260.45</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-sm text-gray-500 mb-1">Day Low</h4>
                      <p className="font-medium">18,190.20</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Serious Traders</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything you need to analyze the market, execute trades, and manage your portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Market Data</h3>
              <p className="text-gray-600">
                Stay informed with lightning-fast streaming quotes, charts, and market depth directly from NSE.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Charting</h3>
              <p className="text-gray-600">
                Analyze markets with customizable charts, 50+ technical indicators, and drawing tools.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Execution</h3>
              <p className="text-gray-600">
                Execute trades instantly with our high-speed trading engine and advanced order types.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Infrastructure</h3>
              <p className="text-gray-600">
                Trade with confidence on our secure platform with encryption and multi-factor authentication.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Algorithmic Trading</h3>
              <p className="text-gray-600">
                Create, backtest, and deploy automated trading strategies without coding experience.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio Analytics</h3>
              <p className="text-gray-600">
                Track performance with detailed analytics, risk metrics, and customizable reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Join thousands of traders who are already using our platform to trade smarter and faster.
          </p>
          <Link href="/register" className="bg-white text-indigo-600 px-8 py-4 rounded-md font-medium hover:bg-gray-100 inline-flex items-center gap-2">
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                <span className="text-lg font-bold">StockMarket</span>
              </div>
              <p className="text-gray-600 mb-4">
                A professional-grade trading platform designed for modern traders.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-indigo-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">API</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Terms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Privacy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Cookies</a></li>
                <li><a href="#" className="text-gray-600 hover:text-indigo-600">Licenses</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} StockMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
