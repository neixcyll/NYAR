import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "../context/cart-context"; // ✅ ganti jadi relatif juga
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast"; // ✅ ditambahkan agar bisa pakai toast sukses
import { ProductReviewSection } from "@/components/ProductReviewSection";


interface Product {
  id: string;
  name: string;
  description?: string;
  long_description?: string;
  price: number;
  stock: number;
  image_url?: string;
  images?: string[];
  brand?: string;
  category_id?: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartCount } = useCart();

  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          long_description,
          price,
          stock,
          image_url,
          images,
          brand,
          category_id,
          categories:category_id ( name )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error.message);
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(data);
      setActiveImage(
        data?.image_url ||
          (data?.images && data.images.length > 0 ? data.images[0] : null)
      );
      setCategoryName(data?.categories?.name || "");
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  // ✅ Tambahkan fungsi handler supaya addToCart dan toast jalan bersamaan
  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id); // kirim ke context
      toast.success(`${product.name} berhasil ditambahkan ke keranjang`);
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan ke keranjang");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Memuat produk...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Produk tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Barang mungkin sudah dihapus atau tidak tersedia lagi.
        </p>
        <Link to="/">
          <Button>← Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header cartItemCount={cartCount} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* BREADCRUMB SEDERHANA */}
        <div className="text-sm text-muted-foreground mb-6 flex flex-wrap gap-1">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          {categoryName ? (
            <>
              <span className="text-muted-foreground">{categoryName}</span>
              <span>/</span>
            </>
          ) : null}
          <span className="text-foreground font-medium">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* LEFT: IMAGE GALLERY */}
          <section>
            <div className="border rounded-xl overflow-hidden bg-white">
              <img
                src={
                  activeImage ||
                  product.image_url ||
                  "/placeholder.png"
                }
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* thumbnail gallery */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-3 mt-4 flex-wrap">
                {[product.image_url, ...(product.images || [])]
                  .filter(Boolean)
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .map((imgUrl) => (
                    <button
                      key={imgUrl}
                      onClick={() => setActiveImage(imgUrl as string)}
                      className={`border rounded-lg overflow-hidden w-20 h-20 bg-white ${
                        activeImage === imgUrl
                          ? "ring-2 ring-black"
                          : "ring-0"
                      }`}
                    >
                      <img
                        src={imgUrl as string}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            )}
          </section>

          {/* RIGHT: INFO PRODUK */}
          <section className="flex flex-col">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                {product.brand ? (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    {product.brand}
                  </p>
                ) : null}

                <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                  {product.name}
                </h1>
              </div>

              <div className="text-sm">
                {product.stock > 0 ? (
                  <span className="inline-block rounded-full bg-green-100 text-green-700 text-xs font-medium px-3 py-1 border border-green-300">
                    Stok tersedia ({product.stock})
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-red-100 text-red-700 text-xs font-medium px-3 py-1 border border-red-300">
                    Habis
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* harga + action */}
            <div className="mt-6 border rounded-xl p-4 bg-card text-card-foreground">
              <div className="flex items-baseline justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Harga
                  </div>
                  <div className="text-3xl font-semibold text-foreground">
                    Rp{" "}
                    {Number(product.price).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Belum termasuk ongkir. Fixie bukan barang ringan :)
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Button
  size="lg"
  className="w-full bg-black text-white hover:bg-gray-800"
  disabled={product.stock <= 0}
  onClick={() => handleAddToCart(product)} // ✅ kirim product ke handler
>
  Tambah ke Keranjang
</Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <a
                      href={`https://wa.me/6281234567890?text=Halo%20saya%20mau%20tanya%20tentang%20${encodeURIComponent(
                        product.name
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tanya via WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <ul className="text-xs text-muted-foreground mt-4 space-y-1">
              {categoryName && (
                <li>
                  Kategori:{" "}
                  <span className="text-foreground font-medium">
                    {categoryName}
                  </span>
                </li>
              )}
              {product.brand && (
                <li>
                  Brand:{" "}
                  <span className="text-foreground font-medium">
                    {product.brand}
                  </span>
                </li>
              )}
              <li>
                ID Produk:{" "}
                <span className="text-foreground font-medium">
                  {product.id}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-12 grid lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Deskripsi Produk
            </h2>
            <p className="text-sm text-muted-foreground">
              Detail lengkap, spek, catatan penjual.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-4 text-sm leading-relaxed text-foreground bg-card border rounded-xl p-5">
            {product.long_description ? (
              <p className="whitespace-pre-wrap">
                {product.long_description}
              </p>
            ) : product.description ? (
              <p className="whitespace-pre-wrap">
                {product.description}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Penjual belum menambahkan deskripsi lengkap.
              </p>
            )}

            <div className="text-xs text-muted-foreground border-t pt-4">
              • Barang original sesuai deskripsi  
              <br />
              • Bisa request size / setup  
              <br />
              • Harga bisa berubah tergantung ketersediaan part
            </div>
          </div>
        </section>
        <ProductReviewSection productId={product.id} />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
