import LeadDetailClient from './LeadDetailClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const id = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  const leadId = id ? parseInt(id, 10) : 0;
  return <LeadDetailClient leadId={leadId} />;
} 