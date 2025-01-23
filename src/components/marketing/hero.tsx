import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { H1, Lead } from '@/components/ui/typography';
import { Button } from '@/components/common/Button';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const eventDate = new Date('2025-01-01T00:00:00');
  const difference = eventDate.getTime() - new Date().getTime();

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="animate-countdown rounded-lg bg-primary-500 px-4 py-2 text-3xl font-bold text-white">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="mt-2 text-sm text-primary-600">{label}</span>
    </div>
  );
}

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-24 sm:py-32">
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-fade-in">
            <H1 className="mb-8">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                GAIAthon25
              </span>
            </H1>
            <Lead className="mb-12">
              Join the world's premier hackathon for sustainable technology solutions.
              Transform ideas into impact.
            </Lead>
          </div>

          <div className="animate-slide-up mb-12 flex justify-center space-x-8">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>

          <div className="animate-scale-in flex justify-center space-x-4">
            <Button size="lg">Register Now</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>
      </Container>

      {/* Background decoration */}
      <div className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform">
        <div className="h-[800px] w-[1200px] bg-accent-100/30 blur-3xl" />
      </div>
    </div>
  );
} 