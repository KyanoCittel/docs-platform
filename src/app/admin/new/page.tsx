import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createDoc } from '../actions';
import DocEditor from '@/components/DocEditor';

export default async function NewDocPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-gray-600 hover:text-black">← Terug</Link>
      <h1 className="text-2xl font-bold">Nieuwe doc</h1>

      <form action={createDoc} className="space-y-4">
        <DocEditor categories={categories ?? []} />
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-md bg-black text-white">Aanmaken</button>
        </div>
      </form>
    </div>
  );
}
