import { AppLayout } from "@/components/layout/AppLayout";
import { CreatorReviewScreen } from "@/components/bounty/CreatorReviewScreen";
export default async function ReviewPage({ params }: { params: { id: string } }) {
  return <AppLayout><CreatorReviewScreen bountyId={params.id} /></AppLayout>;
}
