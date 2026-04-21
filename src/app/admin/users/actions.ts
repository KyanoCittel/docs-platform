'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function createUser(formData: FormData) {
  const { role: actorRole } = await requireRole('editor');

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const newRole = String(formData.get('role') ?? 'viewer') as Role;

  if (!email || !password) throw new Error('E-mail en wachtwoord verplicht');
  if (password.length < 8) throw new Error('Wachtwoord minstens 8 tekens');
  if (!ROLES.includes(newRole)) throw new Error('Ongeldige rol');

  // Editors mogen geen admins aanmaken
  if (actorRole === 'editor' && newRole === 'admin') {
    throw new Error('Alleen een admin mag een nieuwe admin aanmaken');
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);

  const userId = data.user?.id;
  if (!userId) throw new Error('Geen user id teruggekregen');

  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);
  if (profileErr) throw new Error(profileErr.message);

  revalidatePath('/admin/users');
}

export async function updateUserRole(formData: FormData) {
  await requireRole('admin');

  const id = String(formData.get('id') ?? '');
  const newRole = String(formData.get('role') ?? '') as Role;
  if (!id || !ROLES.includes(newRole)) throw new Error('Ongeldige invoer');

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
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
