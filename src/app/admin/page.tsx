import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CategoryForm from '@/components/CategoryForm';

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: docs }, { data: categories }] = await Promise.all([
    supabase.from('docs').select('id, title, slug, published, updated_at').order('updated_at', { ascending: false }),
    supabase.from('categories').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/users" className="px-4 py-2 rounded-md border hover:bg-gray-50">
            Gebruikers
          </Link>
          <Link href="/admin/new" className="px-4 py-2 rounded-md bg-black text-white">
            + Nieuwe doc
          </Link>
        </div>
      </div>

      <section className="bg-white border rounded-md">
        <h2 className="px-4 py-3 border-b font-semibold">Documenten</h2>
        <ul className="divide-y">
          {(docs ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-gray-500">
                  {d.published ? 'Gepubliceerd' : 'Concept'} · bijgewerkt{' '}
                  {new Date(d.updated_at).toLocaleDateString('nl-BE')}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link href={`/docs/${d.slug}`} className="text-gray-600 hover:text-black">
                  Bekijk
                </Link>
                <Link
                  href={`/admin/edit/${d.id}`}
                  className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                >
                  Bewerken
                </Link>
              </div>
            </li>
          ))}
          {(!docs || docs.length === 0) && (
            <li className="px-4 py-6 text-gray-500 text-sm">Nog geen documenten.</li>
          )}
        </ul>
      </section>

      <section className="bg-white border rounded-md">
        <h2 className="px-4 py-3 border-b font-semibold">Categorieën</h2>
        <ul className="divide-y">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="px-4 py-2 text-sm">{c.name}</li>
          ))}
        </ul>
        <CategoryForm />
      </section>
    </div>
  );
}
