import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ZedLogo } from '@/components/ui/zed-logo';
import { AppNavLinks, AppNavUser } from '@/components/ui/app-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, first_name, onboarding_completed')
    .eq('id', user.id)
    .single();

  const isAdmin = userData?.role === 'admin';

  // Redirect new (non-admin) users to the onboarding wizard
  if (!isAdmin && userData?.onboarding_completed !== true) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left: logo + separator + nav links */}
            <div className="flex items-center gap-4 min-w-0">
              <a href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center shrink-0">
                <ZedLogo size="lg" />
              </a>
              <div className="hidden md:block h-6 w-px bg-gray-200 shrink-0" />
              <AppNavLinks isAdmin={isAdmin} />
            </div>

            {/* Right: user avatar + dropdown */}
            <div className="shrink-0">
              <AppNavUser
                isAdmin={isAdmin}
                firstName={userData?.first_name}
                role={userData?.role}
              />
            </div>

          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
