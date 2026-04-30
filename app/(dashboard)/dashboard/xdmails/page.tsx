import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getCampaigns } from "@/actions/emails";
import { EmailComposer, CampaignList } from "@/components/emails";
import { Toaster } from "sonner";

type SearchParams = Promise<{ view?: string }>;

export default async function XDMailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || !["superadmin", "admin", "ops"].includes(session.role)) {
    redirect("/login");
  }

  const { view = "compose" } = await searchParams;
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-right" richColors />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-realce">XDMailer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk email campaigns for marketing and outreach
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/60">
        <a
          href="/dashboard/xdmails?view=compose"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "compose"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          XDComposer
        </a>
        <a
          href="/dashboard/xdmails?view=campaigns"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "campaigns"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Campaigns
        </a>
      </div>

      {view === "compose" ? (
        <EmailComposer />
      ) : (
        <CampaignList campaigns={campaigns} />
      )}
    </div>
  );
}
