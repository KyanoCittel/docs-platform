'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { ok: boolean; message: string } | null;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function requireEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    throw new Error('Geen toestemming');
  }
  return { supabase, user };
}

export async function createDoc(formData: FormData) {
  const { supabase, user } = await requireEditor();

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  const categoryId = String(formData.get('category_id') ?? '') || null;
  const published = formData.get('published') === 'on';

  if (!title) throw new Error('Titel is verplicht');

  const baseSlug = slugify(title) || 'doc';
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('docs')
    .insert({ title, slug, content, category_id: categoryId, author_id: user.id, published })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin/edit/${data.id}`);
}

export async function updateDoc(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireEditor();

    const title = String(formData.get('title') ?? '').trim();
    const content = String(formData.get('content') ?? '');
    const categoryId = String(formData.get('category_id') ?? '') || null;
    const published = formData.get('published') === 'on';

    if (!title) return { ok: false, message: 'Titel is verplicht' };

    const { error } = await supabase
      .from('docs')
      .update({ title, content, category_id: categoryId, published })
      .eq('id', id);

    if (error) return { ok: false, message: error.message };

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/docs/[slug]`, 'page');

    return { ok: true, message: `Opgeslagen om ${new Date().toLocaleTimeString('nl-BE')}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Onbekende fout' };
  }
}

export async function deleteDoc(id: string) {
  const { supabase } = await requireEditor();
  const { error } = await supabase.from('docs').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin');
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireEditor();
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return { ok: false, message: 'Naam verplicht' };

    const { error } = await supabase
      .from('categories')
      .insert({ name, slug: slugify(name) || `cat-${Date.now().toString(36)}` });

    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin');
    return { ok: true, message: `"${name}" toegevoegd` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Onbekende fout' };
  }
}
