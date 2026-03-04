import { AppLogo } from "@/components/header-app-logo";
import { UserMenu } from "@/components/auth/user-menu";
import type { Profile } from "@/app/account/actions";

type Props = {
  user: { email?: string | null };
  profile: Profile | null;
};

export function AppHeader({ user, profile }: Props) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900 sm:px-4 sm:py-3">
      <AppLogo size="small" />
      <div className="flex min-w-0 items-center">
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  );
}
