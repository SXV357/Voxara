import { NavLink, useNavigate } from 'react-router-dom';
import { Mic, Drama, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col justify-between bg-studio-surface p-4">
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/voice-acting/scenarios"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors',
              isActive
                ? 'border-l-[3px] border-studio-crimson bg-studio-warm font-semibold'
                : 'border-l-[3px] border-transparent hover:bg-studio-warm'
            )
          }
        >
          <Mic className="size-4" />
          Voice Acting
        </NavLink>

        <div
          className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted opacity-50"
          aria-disabled="true"
        >
          <Drama className="size-4" />
          Theatre
        </div>
      </nav>

      <div className="flex flex-col gap-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors',
              isActive
                ? 'border-l-[3px] border-studio-crimson bg-studio-warm font-semibold'
                : 'border-l-[3px] border-transparent hover:bg-studio-warm'
            )
          }
        >
          <User className="size-4" />
          Profile
        </NavLink>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-studio-warm"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
