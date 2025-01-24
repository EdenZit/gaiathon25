'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaLightbulb, FaUsers, FaHandshake } from 'react-icons/fa';

export default function AboutPage() {
  const features = [
    {
      icon: FaLightbulb,
      title: 'Innovation',
      description: 'Driving technological advancement and creative solutions in Earth Observation.',
    },
    {
      icon: FaUsers,
      title: 'Community',
      description: 'Building a vibrant network of learners, researchers, and innovators.',
    },
    {
      icon: FaHandshake,
      title: 'Collaboration',
      description: 'Fostering partnerships and knowledge sharing across the globe.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            About Edenway Foundation
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-primary-100">
            Empowering communities through Earth Observation technology and innovation.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="relative py-16 bg-background overflow-hidden">
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="text-lg max-w-prose mx-auto">
            <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">Our Mission</h2>
            <p className="mt-8 text-xl text-muted-foreground leading-8">
              Edenway Foundation is a visionary organization committed to youth empowerment through the GEO-Africa Incubator/Accelerator (GAIA) initiative. Operating from Edenkro, a dynamic innovation hub in Ghana, the Foundation equips young minds with the skills and mindset needed to thrive in the ever-evolving world of technology. Through initiatives like GAIAthon, Edenway is transforming lives and shaping Africa&apos;s future—one innovation at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="relative py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-center items-center">
            <Image
              src="/images/eden.png"
              alt="Edenway Foundation Logo"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative group bg-background p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center"
              >
                <div className="flex justify-center">
                  <span className="rounded-lg inline-flex p-3 bg-primary-100 text-primary-700 ring-4 ring-background">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-center">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="bg-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Our Programs</h2>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              We offer various programs and initiatives aimed at empowering individuals with technological 
              skills and knowledge in Earth Observation and environmental monitoring.
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Program items can be added here */}
            </div>
          </div>
        </div>
      </div>

      {/* Join Us Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-primary-200">Join our community today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
              >
                Get Started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 