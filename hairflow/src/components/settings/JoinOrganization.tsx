"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinOrganization() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/organization/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: code.trim() })
            });
            const result = await res.json();

            if (result.success) {
                alert(`'${result.data.organizationName}' 매장에 합류했습니다!`);
                window.location.reload(); // Refresh to update role/UI
            } else {
                alert(result.error || "매장 합류에 실패했습니다. 코드를 확인해주세요.");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-lg text-center">
                <h3 className="text-white text-lg font-light mb-2">매장 합류하기</h3>
                <p className="text-white/40 text-xs mb-8">
                    원장님께 전달받은 초대 코드를 입력하여<br />매장 스태프로 등록하세요.
                </p>

                <form onSubmit={handleJoin} className="max-w-xs mx-auto space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="HF-XXXXXX"
                        className="w-full bg-black/40 border border-gold/20 px-4 py-3 text-center text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none tracking-widest uppercase"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="w-full py-3 bg-gold text-charcoal font-medium text-sm tracking-widest hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "확인 중..." : "매장 합류하기"}
                    </button>
                </form>
            </div>

            <div className="text-center">
                <p className="text-white/20 text-[10px]">
                    * 매장 합류 시 프로필 정보가 매장 관리자에게 공유됩니다
                </p>
            </div>
        </div>
    );
}
