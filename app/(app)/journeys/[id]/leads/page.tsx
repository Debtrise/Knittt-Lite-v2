import JourneyLeadsClient from './JourneyLeadsClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <JourneyLeadsClient journeyId={resolvedParams.id} />;
} 