import { Metadata } from 'next';
import SmsCampaignClientPage from './SmsCampaignClientPage';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <SmsCampaignClientPage id={resolvedParams.id} />;
} 