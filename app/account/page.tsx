import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/app/account/actions";
import { AppHeader } from "@/components/app-header";
import { AccountForm } from "@/components/auth/account-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await getProfile(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} profile={profile} />
      <main className="flex flex-1 flex-col items-center justify-start px-3 py-6 sm:px-4 sm:py-8">
        <AccountForm email={user.email ?? ""} profile={profile} />
      </main>
    </div>
  );
}
