'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#161618] px-4 flex items-center justify-center">
      <div className="max-w-6xl w-full">
        <h1 className="text-3xl font-bold text-center text-text-primary mb-12">
          What kind of event would you like to create?
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Poker Game Card */}
          <Link 
            href="/events/new/poker"
            className="group flex flex-col items-center p-8 pt-10 rounded-2xl bg-dark-surface border border-dark-border hover:border-brand-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="w-38 h-16 mb-2 flex items-center justify-center rounded-xltransition-colors">
              <Image
                src="/poker-icons.svg"
                alt="Poker"
                width={167}
                height={36}
                className="text-brand-primary"
              />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Poker</h3>
           
          </Link>

          {/* Basketball Game Card */}
          <Link 
            href="/events/new/basketball"
            className="group flex flex-col items-center p-8 pt-10 rounded-2xl bg-dark-surface border border-dark-border hover:border-brand-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="w-16 h-16 mb-2 flex items-center justify-center rounded-xl transition-colors">
              <Image
                src="/basketball-icon.svg"
                alt="Basketball"
                width={64}
                height={64}
                className="text-brand-primary"
              />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Basketball</h3>
      
          </Link>

          {/* Custom Timer Card */}
          <Link 
            href="/events/new/custom"
            className="group flex flex-col items-center p-8 pt-10 rounded-2xl bg-dark-surface border border-dark-border hover:border-brand-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <div className="w-16 h-16 mb-2 flex items-center justify-center rounded-xltransition-colors">
              <Image
                src="/custom-icon.svg"
                alt="Custom"
                width={64}
                height={64}
                className="text-brand-primary"
              />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Custom</h3>
           
          </Link>
        </div>
      </div>
    </div>
  );
} 