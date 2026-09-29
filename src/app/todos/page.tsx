import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div className="min-h-screen bg-void text-foreground p-8">
      <h1 className="text-2xl font-bold mb-4 font-display">Supabase Connection Test</h1>
      {todos && todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo: any) => (
            <li key={todo.id} className="p-3 bg-void-2 rounded-lg border border-glass-border">
              {todo.name || todo.title || JSON.stringify(todo)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm">
          Connected to Supabase. No rows found in the &apos;todos&apos; table yet.
        </p>
      )}
    </div>
  );
}
