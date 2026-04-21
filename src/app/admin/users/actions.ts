'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ActionState } from '@/app/admin/actions';

type Role = 'admin' | 'editor' | 'viewer';
const ROLES: Role[] = ['admin', 'editor', 'viewer'];

async function requireRole(min: 'editor' | 'admin') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) throw new Error('Geen profiel');

  if (min === 'admin' && profile.role !== 'admin') throw new Error('Alleen admins');
  if (min === 'editor' && !['admin', 'editor'].includes(profile.role)) throw new Error('Geen toestemming');

  return { supabase, user, role: profile.role as Role };
}

export async function createUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { role: actorRole } = await requireRole('editor');

    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const newRole = String(formData.get('role') ?? 'viewer') as Role;

    if (!email || !password) return { ok: false, message: 'E-mail en wachtwoord verplicht' };
    if (password.length < 8) return { ok: false, message: 'Wachtwoord minstens 8 tekens' };
    if (!ROLES.includes(newRole)) return { ok: false, message: 'Ongeldige rol' };

    if (actorRole === 'editor' && newRole === 'admin') {
      return { ok: false, message: 'Alleen een admin mag een nieuwe admin aanmaken' };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return { ok: false, message: error.message };

    const userId = data.user?.id;
    if (!userId) return { ok: false, message: 'Geen user id teruggekregen' };

    const { error: profileErr } = await admin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (profileErr) return { ok: false, message: profileErr.message };

    revalidatePath('/admin/users');
    return { ok: true, message: `${email} aangemaakt als ${newRole}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Onbekende fout' };
  }
}

export async function updateUserRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireRole('admin');

    const id = String(formData.get('id') ?? '');
    const newRole = String(formData.get('role') ?? '') as Role;
    if (!id || !ROLES.includes(newRole)) return { ok: false, message: 'Ongeldige invoer' };

    const admin = createAdminClient();
    const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) return { ok: false, message: error.message };

    revalidatePath('/admin/users');
    return { ok: true, message: `Rol bijgewerkt naar ${newRole}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Onbekende fout' };
  }
}

export async function deleteUser(formData: FormData) {
  const { user } = await requireRole('admin');

  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Geen id');
  if (id === user.id) throw new Error('Je kan jezelf niet verwijderen');

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}
