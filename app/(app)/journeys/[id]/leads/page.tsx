import JourneyLeadsClient from './JourneyLeadsClient';

export default function Page({ params }: { params: { id: string } }) {
  return <JourneyLeadsClient journeyId={params.id} />;
} 