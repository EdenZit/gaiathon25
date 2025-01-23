import { Metadata } from 'next';
import { Section } from '@/components/ui/container';
import { H1, H2, P } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'Component Library - GAIAthon25',
  description: 'Test and showcase UI components',
};

export default function ComponentsPage() {
  return (
    <div className="min-h-screen py-10">
      <Section>
        <H1 className="mb-8">Component Library</H1>

        {/* Buttons Section */}
        <div className="space-y-8">
          <div>
            <H2 className="mb-4">Buttons</H2>
            <div className="flex flex-wrap gap-4">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
            </div>
          </div>

          {/* Input Section */}
          <div>
            <H2 className="mb-4">Inputs</H2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Default input" />
              <Input 
                placeholder="With icon" 
                icon={
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Input placeholder="Error state" error />
              <Input placeholder="Disabled" disabled />
            </div>
          </div>

          {/* Cards Section */}
          <div>
            <H2 className="mb-4">Cards</H2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <P>This is the main content of the card.</P>
                </CardContent>
                <CardFooter>
                  <Button>Action</Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Badges Section */}
          <div>
            <H2 className="mb-4">Badges</H2>
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          {/* Progress Section */}
          <div>
            <H2 className="mb-4">Progress</H2>
            <div className="space-y-4">
              <Progress value={33} />
              <Progress value={66} variant="success" />
              <Progress value={45} variant="warning" />
              <Progress value={85} variant="error" />
            </div>
          </div>

          {/* Tooltips Section */}
          <div>
            <H2 className="mb-4">Tooltips</H2>
            <div className="flex gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <P>Tooltip content</P>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Dialog Section */}
          <div>
            <H2 className="mb-4">Dialog</H2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a description of the dialog content and actions.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <P>This is the main content of the dialog.</P>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Section>
    </div>
  );
} 