import { AppLayout } from "@/components/layout/AppLayout";
import { BountyDetailScreen } from "@/components/bounty/BountyDetailScreen";
export default async function BountyPage({ params }: { params: { id: string } }) {
  return <AppLayout><BountyDetailScreen bountyId={params.id} /></AppLayout>;
}
