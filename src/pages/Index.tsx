import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  brand?: string;
  image_url?: string;
  description?: string;
  category_id?: string;
  stock?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Index = () => {
  const { cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ==============================
  // FETCH DATA (Kategori & Produk)
  // ==============================
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Ambil kategori dari tabel 'categories'
  const fetchCategories = async () => {
    setLoadingCategories(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error.message);
      setCategories([]);
    } else {
      setCategories(data || []);
    }
    setLoadingCategories(false);
  };

  // Ambil produk dari tabel 'products'
  const fetchProducts = async (categoryId?: string) => {
    setLoadingProducts(true);
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching products:", error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  };

  // ==============================
  // HANDLE FILTER KATEGORI
  // ==============================
  const handleCategoryChange = (categoryId?: string) => {
    if (categoryId === activeCategory) {
      // klik ulang = reset ke "semua"
      setActiveCategory(null);
      fetchProducts();
    } else {
      setActiveCategory(categoryId || null);
      fetchProducts(categoryId);
    }
  };

  // ==============================
  // FILTER PENCARIAN CLIENT-SIDE
  // ==============================
  const filteredProducts = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.brand?.toLowerCase() || "").includes(search)
    );
  }, [products, searchQuery]);

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        cartItemCount={cart.items?.length || 0}
        onSearchChange={setSearchQuery}
      />

      <HeroSection />

      {/* NAVIGASI KATEGORI */}
      <div className="border-t border-b bg-card/30">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-center gap-2">
          <Button
            variant={!activeCategory ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange()}
          >
            Semua
          </Button>

          {loadingCategories ? (
            <p className="text-sm text-muted-foreground">
              Memuat kategori...
            </p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada kategori
            </p>
          ) : (
            categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* GRID PRODUK */}
      <section className="container mx-auto px-4 py-8">
        {searchQuery && (
          <p className="mb-6 text-muted-foreground">
            Menampilkan {filteredProducts.length} hasil untuk "{searchQuery}"
          </p>
        )}

        {loadingProducts ? (
          <p className="text-center py-10 text-muted-foreground">
            Memuat produk...
          </p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold mb-2">
              Tidak ada produk ditemukan
            </h3>
            <p className="text-muted-foreground">
              Coba ubah kategori atau kata kunci pencarian
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Index;
