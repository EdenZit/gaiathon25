import { Container } from '@/components/ui/container';
import { H1, P } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1">
      <Container>
        <div className="py-20 text-center">
          <H1 className="mb-6">Welcome to GAIAthon25</H1>
          <P className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the world&apos;s premier hackathon for sustainable technology solutions.
            Transform ideas into impact with Earth Observation data.
          </P>
          <div className="flex justify-center space-x-4">
            <Button
              asChild
              size="lg"
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              <Link href="/register">
                Register Now
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/50"
            >
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex justify-center space-x-6">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary-500"
            >
              <Link href="/schedule">
                View Schedule
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary-500"
            >
              <Link href="/resources">
                Browse Resources
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
} 