"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", memo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const fetchCustomers = async () => {
    const res = await fetch("/api/customers");
    const result = await res.json();
    if (result.data) setCustomers(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (result.data) {
      setCustomers((prev) => [result.data, ...prev]);
      setForm({ name: "", phone: "", memo: "" });
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 고객을 삭제하시겠습니까?")) return;
    await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      c.phone?.includes(search) ||
      c.memo?.includes(search)
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="section-label">Clients</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          고객 <em className="italic text-gold-light">관리</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          내 고객 정보를 한 곳에서 관리하세요
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <input
          type="text"
          placeholder="이름, 연락처, 메모로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border border-gold/15 px-5 py-3 text-[13px] font-light text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none transition-colors"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-3 border border-gold text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 whitespace-nowrap"
        >
          {showForm ? "취소" : "고객 등록"}
        </button>
      </motion.div>

      {/* Add Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="border border-gold/15 p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
                이름 *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors"
                placeholder="고객 이름"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
                연락처
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors"
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
              메모
            </label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={2}
              className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors resize-none"
              placeholder="두피 민감함, 지난번 탈색 이력 등"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 border border-gold text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </motion.form>
      )}

      {/* Customer List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[12px] tracking-[4px] uppercase text-gold">
            고객 목록
          </h2>
          <span className="text-[12px] text-white/30 font-light">
            {filtered.length}명
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-px">
            {filtered.map((customer, i) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/customers/${customer.id}`)}
                className="border border-gold/10 p-5 hover:bg-gold/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-heading text-[18px] font-normal">
                        {customer.name}
                      </span>
                      {customer.phone && (
                        <span className="text-[12px] text-white/30 font-light">
                          {customer.phone}
                        </span>
                      )}
                    </div>
                    {customer.memo && (
                      <p className="text-[13px] text-white/40 font-light truncate">
                        {customer.memo}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-[11px] text-gold/40 group-hover:text-gold transition-colors">
                      상세 →
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                      className="text-[11px] text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">
              No Clients
            </p>
            <p className="text-[13px] text-white/30 font-light">
              {search ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
