import { Section } from '@/components/ui/container';
import { H2, P } from '@/components/ui/typography';

const highlights = [
  {
    title: 'Sustainable Innovation',
    description: 'Develop solutions that address real-world environmental challenges using cutting-edge technology.',
    icon: '🌱',
  },
  {
    title: 'Expert Mentorship',
    description: 'Get guidance from industry leaders and technical experts throughout the event.',
    icon: '👥',
  },
  {
    title: 'Global Community',
    description: 'Connect with passionate developers and innovators from around the world.',
    icon: '🌍',
  },
  {
    title: 'Substantial Prizes',
    description: 'Compete for a prize pool worth over $100,000 and potential startup funding.',
    icon: '🏆',
  },
];

export function HighlightsSection() {
  return (
    <Section className="bg-primary-50">
      <div className="text-center">
        <H2 className="mb-4">Event Highlights</H2>
        <P className="mx-auto max-w-2xl">
          Join us for an unforgettable experience where innovation meets sustainability.
          Here&apos;s what makes GAIAthon25 special.
        </P>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight, index) => (
          <div
            key={highlight.title}
            className="group relative animate-fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="relative rounded-2xl border border-primary-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-block rounded-lg bg-primary-100 p-3 text-3xl">
                {highlight.icon}
              </div>
              <h3 className="text-lg font-semibold text-primary-900">
                {highlight.title}
              </h3>
              <P className="mt-2 text-sm">
                {highlight.description}
              </P>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
} 