import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceExpenses } from "@/components/finance/finance-expenses";
import { FinanceWallets } from "@/components/finance/finance-wallets";

type SearchParams = Promise<{ tab?: string }>;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "finance", "sales"].includes(session.role)
  ) {
    redirect("/login");
  }

  const { tab = "overview" } = await searchParams;
  const data = await getFinanceData("month");
  const canAdmin = ["superadmin", "admin", "finance"].includes(session.role);
  const canTransfer = ["superadmin", "finance"].includes(session.role);

  if (tab === "expenses") {
    return <FinanceExpenses data={data} canAdmin={canAdmin} />;
  }
  if (tab === "wallets") {
    return (
      <FinanceWallets
        data={data}
        canAdmin={canAdmin}
        canTransfer={canTransfer}
      />
    );
  }
  return (
    <FinanceOverview
      data={data}
      canAdmin={canAdmin}
      canTransfer={canTransfer}
    />
  );
}
