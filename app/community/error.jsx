"use client";

export default function Error({ error, reset }) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h2 className="mb-4 text-xl font-bold text-red-500">Ein Fehler ist aufgetreten!</h2>
      <pre className="mb-4 overflow-auto rounded bg-zinc-950 p-4 text-left text-xs text-zinc-400">
        {error?.message || JSON.stringify(error)}
      </pre>
      <button onClick={() => reset()} className="rounded bg-blue-600 px-4 py-2 font-medium text-white" type="button">
        Erneut versuchen
      </button>
    </div>
  );
}
