import { MeetupsView } from "@/components/meetups/MeetupsView";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("events");

export default function EventsPage() {
  return <MeetupsView />;
}
