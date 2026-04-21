import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ q?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('docs')
    .select('id, title, slug, updated_at, categories(name, slug)')
    .eq('published', true)
    .order('updated_at', { ascending: false });

  if (q && q.trim()) {
    const term = q.trim().replace(/[,()]/g, ' ').trim();
    const pattern = `%${term}%`;
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  const { data: docs } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documentatie</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Zoek op titel of inhoud..."
          className="flex-1 border rounded-md px-3 py-2 bg-white"
        />
        <button className="px-4 py-2 rounded-md bg-black text-white">Zoek</button>
      </form>

      <ul className="divide-y border rounded-md bg-white">
        {(docs ?? []).map((d) => {
          const cat = Array.isArray(d.categories) ? d.categories[0] : d.categories;
          return (
            <li key={d.id}>
              <Link href={`/docs/${d.slug}`} className="block px-4 py-3 hover:bg-gray-50">
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-gray-500">
                  {cat?.name ?? 'Zonder categorie'} · bijgewerkt {new Date(d.updated_at).toLocaleDateString('nl-BE')}
                </div>
              </Link>
            </li>
          );
        })}
        {(!docs || docs.length === 0) && (
          <li className="px-4 py-6 text-gray-500 text-sm">Geen resultaten.</li>
        )}
      </ul>
    </div>
  );
}
