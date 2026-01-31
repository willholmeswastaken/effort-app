import ProgramDetailClient from "./client";

interface ProgramPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params;

  return <ProgramDetailClient id={id} />;
}
