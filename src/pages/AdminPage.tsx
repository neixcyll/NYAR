import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  description?: string;
  long_description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category_id?: string; // ganti: jangan simpan nama kategori, tapi id
  brand?: string;
  images?: string[];
  specifications?: Record<string, string>;
  variants?: Record<string, string[]>;
  related_products?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

const AdminPage = () => {
  const { toast } = useToast();

  // =========================
  // STATE PRODUK
  // =========================
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // form produk
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [gallery, setGallery] = useState("");
  const [specs, setSpecs] = useState("");
  const [variants, setVariants] = useState("");
  const [categoryId, setCategoryId] = useState(""); // pakai id kategori
  const [brand, setBrand] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // =========================
  // STATE KATEGORI
  // =========================
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // form kategori baru
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // =========================
  // FETCH DATA
  // =========================

  // ambil produk
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error ambil produk",
        description: error.message,
        variant: "destructive",
      });
    } else {
        setProducts(data || []);
    }
    setLoadingProducts(false);
  };

  // ambil kategori
  const fetchCategories = async () => {
    setLoadingCategories(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Error ambil kategori",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
    setLoadingCategories(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // =========================
  // PRODUK: SIMPAN (INSERT / UPDATE)
  // =========================
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataProduct = {
        name,
        description: desc,
        long_description: longDesc || null,
        specifications: specs ? JSON.parse(specs) : null,
        variants: variants ? JSON.parse(variants) : null,
        images: gallery
          ? gallery.split(",").map((url) => url.trim())
          : [],
        price: parseFloat(price),
        stock: parseInt(stock),
        image_url: image,
        category_id: categoryId || null,
        brand,
        related_products: relatedProducts,
      };

      let error;
      if (editingId) {
        ({ error } = await supabase
          .from("products")
          .update(dataProduct)
          .eq("id", editingId));
      } else {
        ({ error } = await supabase
          .from("products")
          .insert([dataProduct]));
      }

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Sukses",
        description: editingId
          ? "Produk berhasil diperbarui"
          : "Produk berhasil ditambahkan",
      });

      resetProductForm();
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error simpan produk",
        description: err.message || "Gagal menyimpan produk.",
        variant: "destructive",
      });
    }
  };

  // =========================
  // PRODUK: HAPUS
  // =========================
  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error hapus produk",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Produk dihapus" });
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // =========================
  // PRODUK: EDIT (PREFILL FORM)
  // =========================
  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setDesc(p.description || "");
    setLongDesc(p.long_description || "");
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setImage(p.image_url || "");
    setCategoryId(p.category_id || "");
    setBrand(p.brand || "");
    setGallery(p.images?.join(", ") || "");
    setSpecs(p.specifications ? JSON.stringify(p.specifications) : "");
    setVariants(p.variants ? JSON.stringify(p.variants) : "");
    setRelatedProducts(p.related_products || []);
  };

  const resetProductForm = () => {
    setEditingId(null);
    setName("");
    setDesc("");
    setLongDesc("");
    setPrice("");
    setStock("");
    setImage("");
    setGallery("");
    setSpecs("");
    setVariants("");
    setCategoryId("");
    setBrand("");
    setRelatedProducts([]);
  };

  // =========================
  // KATEGORI: TAMBAH
  // =========================
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!catName.trim() || !catSlug.trim()) {
      toast({
        title: "Data kurang lengkap",
        description: "Nama dan slug wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("categories").insert([
      {
        name: catName,
        slug: catSlug.toLowerCase(),
        description: catDesc || null,
      },
    ]);

    if (error) {
      toast({
        title: "Error tambah kategori",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Kategori ditambahkan",
        description: `${catName} berhasil dibuat.`,
      });
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      fetchCategories();
    }
  };

  // =========================
  // KATEGORI: HAPUS
  // =========================
  const handleDeleteCategory = async (id: string) => {
    // catatan: ini akan gagal kalau kategori masih dipakai produk
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Tidak bisa hapus",
        description:
          "Kategori ini mungkin sedang dipakai di produk lain.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Kategori dihapus",
      });
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  // helper: tampilkan nama kategori dari id
  const getCategoryName = (id?: string) => {
    if (!id) return "—";
    const found = categories.find((c) => c.id === id);
    return found ? found.name : "—";
  };

return (
  <div className="p-8 bg-muted/20 min-h-screen text-foreground">
    <div className="max-w-7xl mx-auto space-y-8">

      {/* TITLE DASHBOARD */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola kategori dan produk FixieStore di sini. Jangan typo harga,
          nanti orang beli fullbike 5 juta jadi 5 ribu.
        </p>
      </header>

      {/* GRID ATAS: KATEGORI & PRODUK FORM */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KIRI: KATEGORI */}
        <Card className="shadow-sm border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Tambah Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* form kategori */}
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kategori</Label>
                <Input
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug) {
                      setCatSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, "-")
                      );
                    }
                  }}
                  placeholder="Contoh: Frame, Wheelset, Apparel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="frame, wheelset, apparel"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Digunakan untuk URL / filter. Huruf kecil, pakai tanda "-".
                </p>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi (opsional)</Label>
                <Textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Kategori khusus frame fullbike alloy, ready size S-M-L"
                  className="min-h-[70px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                Tambah Kategori
              </Button>
            </form>

            {/* daftar kategori */}
            <div className="pt-4 border-t">
              <h2 className="text-sm font-semibold mb-3">
                Daftar Kategori
              </h2>

              {loadingCategories ? (
                <p className="text-sm text-muted-foreground">
                  Memuat kategori...
                </p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kategori.
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scroll">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-start justify-between rounded-lg border bg-card text-card-foreground p-3"
                    >
                      <div className="text-sm leading-relaxed">
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">
                          /{cat.slug}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KANAN: PRODUK */}
        <Card className="shadow-sm border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {editingId ? "Edit Produk" : "Tambah Produk"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmitProduct} className="space-y-5">
              {/* Kategori Produk */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full bg-background text-foreground text-sm"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Produk terkait */}
              <div className="space-y-2">
                <Label>Produk Terkait</Label>
                <select
                  multiple
                  value={relatedProducts}
                  onChange={(e) =>
                    setRelatedProducts(
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full bg-background text-foreground text-sm h-24"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Ctrl / Cmd untuk pilih banyak.
                </p>
              </div>

              {/* Nama & brand */}
              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="contoh: Shimano, FixGear Co"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                <Input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Deskripsi pendek untuk tampilan grid"
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Lengkap</Label>
                <Textarea
                  value={longDesc}
                  onChange={(e) => setLongDesc(e.target.value)}
                  placeholder="Tuliskan deskripsi lengkap produk..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Gambar */}
              <div className="space-y-2">
                <Label>URL Gambar Utama</Label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/gambar.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Galeri Gambar (pisahkan koma)</Label>
                <Input
                  value={gallery}
                  onChange={(e) => setGallery(e.target.value)}
                  placeholder="https://img1.jpg, https://img2.jpg"
                />
              </div>

              {/* Harga & Stok */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stok</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tombol aksi */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  {editingId ? "Update Produk" : "Tambah Produk"}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={resetProductForm}
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* LIST PRODUK */}
      <section>
        <Card className="shadow-sm border rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Daftar Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <p>Memuat produk...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada produk.
              </p>
            ) : (
              <div className="divide-y border rounded-lg overflow-hidden bg-card text-card-foreground">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
                  >
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Rp {p.price} · Stok {p.stock}
                      </p>
                      {p.related_products &&
                        p.related_products.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Terkait: {p.related_products.length} produk
                          </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(p)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs"
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  </div>
);
}
export default AdminPage;
