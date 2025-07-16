import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SnbdLogo } from '@/components/icons';
import Image from 'next/image';
import { ArrowRight, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
                No other Hosting is Required After you <span className="text-primary">switch here</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Looking for the best hosting provider in Bangladesh? You&apos;ve come to the right place! We deliver <strong className="font-semibold text-gray-700">lightning-fast, reliable, and secured web hosting</strong> designed for Bangladeshi businesses of all sizes — from small blogs to growing online stores. With <strong className="font-semibold text-gray-700">99.9% uptime, 24/7 expert support, and unbeatable pricing</strong>, we make sure your website performs at its best, helping you grow and reach more customers online.
              </p>
              <div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/register">
                    Try us for 14 Days <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500 mt-2">No Credit Card Required</p>
              </div>
            </div>
            <div className="relative">
                <div className="absolute inset-0 bg-repeat bg-center opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23dc2626\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'}}></div>
                <div className="grid grid-cols-2 gap-4 relative">
                    <Card className="col-span-1 shadow-xl rounded-2xl overflow-hidden">
                        <Image src="https://placehold.co/400x400.png" width={400} height={400} alt="Developer at work" className="object-cover" data-ai-hint="developer hosting" />
                    </Card>
                    <Card className="col-span-1 shadow-xl rounded-2xl p-4 flex flex-col justify-center bg-white">
                        <p className="text-sm font-medium text-gray-500">Performance Score</p>
                        <p className="text-5xl font-bold text-gray-900 my-2">99%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{width: '99%'}}></div>
                        </div>
                    </Card>
                     <Card className="col-span-1 shadow-xl rounded-2xl p-4 flex flex-col justify-center bg-white">
                        <p className="text-sm font-medium text-gray-500 mb-2">Speed Performance</p>
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-xs text-gray-500">Page speed score</p>
                                <p className="text-3xl font-bold text-green-500">A <span className="text-lg">99%</span></p>
                            </div>
                             <div>
                                <p className="text-xs text-gray-500">Load Time</p>
                                <p className="text-3xl font-bold text-gray-900">0.132<span className="text-lg">s</span></p>
                            </div>
                        </div>
                    </Card>
                    <Card className="col-span-1 shadow-xl rounded-2xl overflow-hidden">
                        <Image src="https://placehold.co/400x400.png" width={400} height={400} alt="Business professional with laptop" className="object-cover h-full" data-ai-hint="professional woman" />
                    </Card>
                </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">We use b2b partner license from various third parties, these software includes</h2>
                 <div className="flex flex-wrap justify-center items-center gap-x-8 sm:gap-x-12 gap-y-4 mt-6">
                    <SnbdLogo className="h-10 text-gray-500" />
                    <p className="text-3xl font-bold text-gray-400">cPanel</p>
                    <p className="text-3xl font-bold text-gray-400">CloudLinux</p>
                    <p className="text-3xl font-bold text-gray-400">LiteSpeed</p>
                 </div>
            </div>
        </section>
      </main>

    </div>
  );
}
