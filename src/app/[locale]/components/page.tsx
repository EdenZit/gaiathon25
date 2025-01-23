'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Container } from '@/components/ui/container';
import { H1, H2, P } from '@/components/ui/typography';

export default function ComponentsTestPage() {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  useState(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Container>
      <div className="py-12 space-y-12">
        {/* Responsive Grid Test */}
        <section>
          <H1>Responsive Grid Test</H1>
          <P className="mb-6">This grid should adapt to different screen sizes</P>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="p-6">
                <H2>Card {item}</H2>
                <P>This card should resize smoothly</P>
              </Card>
            ))}
          </div>
        </section>

        {/* Button Variants Test */}
        <section>
          <H2>Button Variants</H2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>

        {/* Form Elements Test */}
        <section>
          <H2>Form Elements</H2>
          <div className="space-y-4 max-w-md">
            <Input placeholder="Standard input" />
            <Input disabled placeholder="Disabled input" />
            <div className="flex space-x-2">
              <Input placeholder="With button" />
              <Button>Submit</Button>
            </div>
          </div>
        </section>

        {/* Dialog Test */}
        <section>
          <H2>Dialog Test</H2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <P>This dialog should be centered and responsive</P>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Progress and Badge Test */}
        <section>
          <H2>Progress and Badges</H2>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </section>

        {/* Mobile Menu Test */}
        <section>
          <H2>Mobile Navigation Test</H2>
          <div className="md:hidden">
            <Button className="w-full">
              This button is only visible on mobile
            </Button>
          </div>
          <div className="hidden md:block">
            <P>This text is only visible on desktop</P>
          </div>
        </section>
      </div>
    </Container>
  );
} 