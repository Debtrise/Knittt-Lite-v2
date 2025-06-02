import { Metadata } from 'next';
import SmsCampaignClientPage from './SmsCampaignClientPage';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return <SmsCampaignClientPage id={resolvedParams.id} />;
} 