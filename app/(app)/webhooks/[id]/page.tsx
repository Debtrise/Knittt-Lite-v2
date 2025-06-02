import WebhookClient from './WebhookClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <WebhookClient id={resolvedParams.id} />;
} 