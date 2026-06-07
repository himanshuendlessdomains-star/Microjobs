import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { CreatorReviewScreen } from "@/components/bounty/CreatorReviewScreen";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  return (
    <PhoneFrame>
      <CreatorReviewScreen bountyId={params.id} />
    </PhoneFrame>
  );
}
