'use client';

import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <button onClick={signOut} className="text-gray-600 hover:text-black">
      Uitloggen
    </button>
  );
}
