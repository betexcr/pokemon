import ChampionshipClient from './ChampionshipClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChampionshipDetailPage({ params }: Props) {
  const { id } = await params;
  return <ChampionshipClient championshipId={id} />;
}
