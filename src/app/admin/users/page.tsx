import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import CreateUserForm from '@/components/CreateUserForm';
import UserRoleForm from '@/components/UserRoleForm';
import DeleteUserButton from '@/components/DeleteUserButton';

type Role = 'admin' | 'editor' | 'viewer';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/users');

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!me || !['admin', 'editor'].includes(me.role)) {
    return <p className="text-red-600">Geen toestemming.</p>;
  }

  const isAdmin = me.role === 'admin';

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gebruikers</h1>
        <Link href="/admin" className="text-sm text-gray-600 hover:text-black">← Admin</Link>
      </div>

      <section className="bg-white border rounded-md p-4 space-y-3">
        <h2 className="font-semibold">Nieuwe gebruiker aanmaken</h2>
        <CreateUserForm isAdmin={isAdmin} />
        <p className="text-xs text-gray-500">
          Tip: kies een startwachtwoord en geef het door aan de gebruiker.
        </p>
      </section>

      <section className="bg-white border rounded-md">
        <h2 className="px-4 py-3 border-b font-semibold">Bestaande gebruikers</h2>
        <ul className="divide-y">
          {(profiles ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <div className="font-medium">{p.email ?? '(geen e-mail)'}</div>
                <div className="text-xs text-gray-500">
                  {p.role} · aangemaakt {new Date(p.created_at).toLocaleDateString('nl-BE')}
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <UserRoleForm id={p.id} role={p.role as Role} />
                  {p.id !== user.id && <DeleteUserButton id={p.id} />}
                </div>
              ) : (
                <span className="text-xs text-gray-400">alleen admins kunnen rollen wijzigen</span>
              )}
            </li>
          ))}
          {(!profiles || profiles.length === 0) && (
            <li className="px-4 py-6 text-gray-500 text-sm">Nog geen gebruikers.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
