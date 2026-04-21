import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createUser, updateUserRole, deleteUser } from './actions';

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

  // Haal alle users op via service-role (profiles heeft alleen id/email/role)
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
        <form action={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">E-mail</label>
            <input name="email" type="email" required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Wachtwoord (min. 8)</label>
            <input name="password" type="text" required minLength={8} className="w-full border rounded-md px-3 py-2 font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select name="role" defaultValue="viewer" className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="viewer">Viewer (alleen lezen)</option>
              <option value="editor">Editor (mag bewerken)</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>
          <button className="px-4 py-2 rounded-md bg-black text-white">Aanmaken</button>
        </form>
        <p className="text-xs text-gray-500">
          Tip: kies zelf een startwachtwoord, geef het door aan de gebruiker, en laat hem het wijzigen via de profielpagina (komt later).
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
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      name="role"
                      defaultValue={p.role}
                      className="border rounded-md px-2 py-1 text-sm bg-white"
                    >
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50">
                      Opslaan
                    </button>
                  </form>
                  {p.id !== user.id && (
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-sm px-3 py-1 rounded-md border text-red-600 hover:bg-red-50">
                        Verwijderen
                      </button>
                    </form>
                  )}
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
