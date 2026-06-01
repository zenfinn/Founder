import { ShowcasesView } from "@/components/showcases/ShowcasesView";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("showcases");

export default function ShowcasesPage() {
  return <ShowcasesView />;
}
