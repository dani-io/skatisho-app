"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X, Save, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FaqCategory {
  id: string;
  title: string;
  order: number;
  items: FaqItem[];
}

export default function AdminFaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catTitle, setCatTitle] = useState("");
  const [editingItem, setEditingItem] = useState<{ catId: string; item?: FaqItem } | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  function loadData() {
    fetch("/api/faq").then((r) => r.json()).then((d) => setCategories(d.categories || [])).finally(() => setLoading(false));
  }

  function toggleCat(id: string) {
    setOpenCats((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function addCategory() {
    if (!catTitle.trim()) return;
    await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", title: catTitle }),
    });
    setCatTitle("");
    setShowCatForm(false);
    loadData();
  }

  async function deleteCategory(id: string) {
    if (!confirm("این دسته و تمام سوالاتش حذف شود؟")) return;
    await fetch("/api/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "category" }),
    });
    loadData();
  }

  function openItemForm(catId: string, item?: FaqItem) {
    setEditingItem({ catId, item });
    setQuestion(item?.question || "");
    setAnswer(item?.answer || "");
  }

  async function saveItem() {
    if (!editingItem || !question.trim() || !answer.trim()) return;
    if (editingItem.item) {
      await fetch("/api/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "item", id: editingItem.item.id, question, answer }),
      });
    } else {
      await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "item", categoryId: editingItem.catId, question, answer }),
      });
    }
    setEditingItem(null);
    loadData();
  }

  async function deleteItem(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch("/api/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "item" }),
    });
    loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">سوالات متداول</h1>
        <Button onClick={() => setShowCatForm(true)}><Plus className="w-4 h-4 ml-2" />دسته جدید</Button>
      </div>

      {showCatForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">دسته جدید</h2>
            <button onClick={() => setShowCatForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <input value={catTitle} onChange={(e) => setCatTitle(e.target.value)} placeholder="عنوان دسته"
              className="flex-1 h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            <Button onClick={addCategory} disabled={!catTitle.trim()}>افزودن</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-dim cursor-pointer" onClick={() => toggleCat(cat.id)}>
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("w-4 h-4 transition-transform", openCats.has(cat.id) && "rotate-180")} />
                <h3 className="text-sm font-bold">{cat.title}</h3>
                <span className="text-[10px] text-on-surface-muted">({cat.items.length} سوال)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); openItemForm(cat.id); }}
                  className="text-primary"><Plus className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {openCats.has(cat.id) && (
              <div className="divide-y divide-surface-container">
                {cat.items.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.question}</p>
                        <p className="text-xs text-on-surface-muted mt-1">{item.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mr-2">
                        <button onClick={() => openItemForm(cat.id, item)} className="p-1 hover:bg-surface-dim rounded">
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {cat.items.length === 0 && (
                  <p className="text-xs text-on-surface-muted text-center py-6">سوالی ثبت نشده</p>
                )}
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-16 text-on-surface-muted">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">دسته‌ای وجود ندارد</p>
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[var(--radius-card)] w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm">{editingItem.item ? "ویرایش سوال" : "سوال جدید"}</h2>
              <button onClick={() => setEditingItem(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="سوال"
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="پاسخ" rows={4}
                className="w-full px-3 py-2 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none" />
              <Button size="full" onClick={saveItem} disabled={!question.trim() || !answer.trim()}>
                <Save className="w-4 h-4 ml-2" />{editingItem.item ? "ذخیره" : "افزودن"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
