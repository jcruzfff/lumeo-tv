import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-dark-background">
      {/* Hero Section */}
      <section className="min-h-screen  flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
            Professional Timer Display for
            <span className="text-brand-primary"> Events</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Elevate your poker tournaments and basketball games with our professional-grade timer display system.
          </p>
          <Link
            href="/auth/access"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors duration-200 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30"
          >
            Get Started
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-text-secondary">
              Everything you need to run professional events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Poker Timer Feature */}
            <div className="bg-dark-card backdrop-blur-md border border-dark-border/20 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="text-brand-primary mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-4">Poker Timer</h3>
              <p className="text-text-secondary">
                Professional blind structure management with customizable levels and breaks.
              </p>
            </div>

            {/* Basketball Timer Feature */}
            <div className="bg-dark-card backdrop-blur-md border border-dark-border/20 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="text-brand-primary mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-4">Basketball Timer</h3>
              <p className="text-text-secondary">
                Complete game clock with period tracking, shot clock, and score management.
              </p>
            </div>

            {/* Media Display Feature */}
            <div className="bg-dark-card backdrop-blur-md border border-dark-border/20 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="text-brand-primary mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-4">Media Display</h3>
              <p className="text-text-secondary">
                Seamlessly integrate sponsor content and announcements between timer displays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-dark-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Why Choose Lumeo
            </h2>
            <p className="text-xl text-text-secondary">
              Built for event organizers who demand excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Professional Display</h3>
                  <p className="text-text-secondary">High-quality, responsive design that looks great on any screen.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Easy to Use</h3>
                  <p className="text-text-secondary">Intuitive interface designed for quick setup and management.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Customizable</h3>
                  <p className="text-text-secondary">Adapt the system to your specific event needs.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Reliable</h3>
                  <p className="text-text-secondary">Built with robust technology for uninterrupted operation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Elevate Your Events?
          </h2>
          <Link
            href="/auth/access"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-brand-primary bg-white hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started Now
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-surface py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary mb-4">Lumeo</div>
            <p className="text-text-secondary">Professional Timer Display System</p>
            <p className="text-text-tertiary mt-8">© 2024 Lumeo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}