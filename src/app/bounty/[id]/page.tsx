import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { BountyDetailScreen } from "@/components/bounty/BountyDetailScreen";

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  return (
    <PhoneFrame>
      <BountyDetailScreen bountyId={params.id} />
    </PhoneFrame>
  );
}
