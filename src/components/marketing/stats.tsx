import { useEffect, useRef, useState } from 'react';
import { Section } from '@/components/ui/container';
import { H2, P } from '@/components/ui/typography';

const stats = [
  { label: 'Participants', value: 5000, prefix: '+' },
  { label: 'Countries', value: 85, prefix: '' },
  { label: 'Prize Pool', value: 100, prefix: '$', suffix: 'K' },
  { label: 'Projects', value: 750, prefix: '+' },
];

function AnimatedNumber({ value, prefix = '', suffix = '' }: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let start = 0;
            const end = value;
            const duration = 2000;
            const increment = end / (duration / 16);
            
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
              } else {
                setDisplayValue(Math.floor(start));
              }
            }, 16);

            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={counterRef} className="text-4xl font-bold text-primary-900">
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <Section className="bg-gradient-to-b from-white to-primary-50">
      <div className="text-center">
        <H2 className="mb-4">GAIAthon25 by the Numbers</H2>
        <P className="mx-auto max-w-2xl">
          Join thousands of innovators and developers from around the world in this
          groundbreaking event.
        </P>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative animate-fade-in rounded-2xl border border-primary-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <AnimatedNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
            />
            <P className="mt-2 text-sm font-medium text-primary-600">
              {stat.label}
            </P>
          </div>
        ))}
      </div>
    </Section>
  );
} 