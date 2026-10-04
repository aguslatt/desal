import { Shell } from "@/components/Shell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <Shell preload={["/pieces/ring-a.webp"]}>{children}</Shell>;
}
