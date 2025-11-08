import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Star } from "lucide-react";

export function ProductReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Ambil semua review dari Supabase
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles ( username, avatar_url )
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal ambil review:", error.message);
    } else {
      setReviews(data || []);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Kirim review ke Supabase
  const submitReview = async () => {
    if (!rating || !comment.trim()) {
      alert("Isi rating dan komentar dulu.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Login dulu baru bisa review.");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        profile_id: user.id, // pastikan profile_id = auth.users.id
        rating,
        comment,
      });

      if (error) throw error;

      // refresh list review
      await fetchReviews();
      setComment("");
      setRating(0);
      alert("Review terkirim!");
    } catch (err: any) {
      console.error("Gagal kirim review:", err.message);
      alert("Terjadi kesalahan saat mengirim review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="font-bold text-lg mt-6 mb-2 flex items-center gap-2">
        <Star size={20} color="#535351ff" />
        Ulasan Produk
      </h3>

      {/* tampilkan daftar review */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada review untuk produk ini.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border p-3 rounded-md bg-white/5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    color={n <= r.rating ? "#534730ff" : "#d1d5db"}
                    fill={n <= r.rating ? "#534730ff" : "none"}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  ({r.rating}/5)
                </span>
              </div>
              <p className="mt-1">{r.comment}</p>
              {r.profiles && (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  {r.profiles.avatar_url ? (
                    <img
                      src={r.profiles.avatar_url}
                      alt="avatar"
                      className="w-5 h-5 rounded-full"
                    />
                  ) : null}
                  <span>{r.profiles.username || "Anonim"}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* form input */}
      <div className="mt-6 border-t pt-4">
        <p className="font-semibold mb-2">Beri Rating:</p>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={28}
              className="cursor-pointer transition-colors"
              color={n <= (hover || rating) ? "#ee9d08ff" : "#9ca3af"}
              fill={n <= (hover || rating) ? "#ee9d08ff" : "none"}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
            />
          ))}
        </div>

        <textarea
          placeholder="Tulis komentar..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-2 rounded mt-1 bg-transparent"
        />

        <button
          disabled={loading}
          onClick={submitReview}
          className={`mt-3 px-3 py-1 rounded text-white ${
            loading ? "bg-gray-500" : "bg-gray-950 hover:bg-black"
          }`}
        >
          {loading ? "Mengirim..." : "Kirim"}
        </button>
      </div>
    </div>
  );
}
