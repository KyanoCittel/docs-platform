import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateDoc, deleteDoc } from '../../actions';
import DocEditor from '@/components/DocEditor';

type Params = Promise<{ id: string }>;

export default async function EditDocPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: doc }, { data: categories }] = await Promise.all([
    supabase.from('docs').select('id, title, content, category_id, published, slug').eq('id', id).maybeSingle(),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  if (!doc) notFound();

  const update = updateDoc.bind(null, doc.id);
  const remove = deleteDoc.bind(null, doc.id);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-gray-600 hover:text-black">← Terug</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bewerken</h1>
        <Link href={`/docs/${doc.slug}`} className="text-sm text-gray-600 hover:text-black">
          Bekijk live →
        </Link>
      </div>

      <form action={update} className="space-y-4">
        <DocEditor categories={categories ?? []} doc={doc} />
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-md bg-black text-white">Opslaan</button>
        </div>
      </form>

      <form action={remove} className="border-t pt-4">
        <button
          type="submit"
          className="px-4 py-2 rounded-md border text-red-600 hover:bg-red-50"
        >
          Verwijderen
        </button>
      </form>
    </div>
  );
}
