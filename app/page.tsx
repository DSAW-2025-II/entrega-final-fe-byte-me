"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const API = process.env.NEXT_PUBLIC_API_URL;

  async function load() {
    const r = await fetch(`${API}/items`, { cache: "no-store" });
    const data = await r.json();
    setItems(data.items || []);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch(`${API}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "ui-sans-serif" }}>
      <h1>MoveTogether2</h1>
      <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Nuevo item"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Agregar</button>
      </form>
      <ul>
        {items.map(i => (<li key={i.id}>{i.text}</li>))}
      </ul>
    </main>
  );
}
