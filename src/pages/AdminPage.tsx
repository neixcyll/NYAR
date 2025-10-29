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
  category_id?: string;
  brand?: string;
  images?: string[];
  specifications?: Record<string, string>;
  variants?: Record<string, string[]>;
  related_products?: string[];
}

interface Category {
  id: string;
  name: string;
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
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // =========================
  // STATE KATEGORI
  // =========================
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // =========================
  // FETCH DATA
  // =========================

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

  const fetchCategories = async () => {
    setLoadingCategories(true);
    const { data, error } = await supabase
      .from("categories") // pastikan tabel ini ADA di Supabase!
      .select("id, name")
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
  // PRODUK: SIMPAN
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
        images: gallery ? gallery.split(",").map((url) => url.trim()) : [],
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
        ({ error } = await supabase.from("products").insert([dataProduct]));
      }

      if (error) throw new Error(error.message);

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
    const { error } = await supabase.from("products").delete().eq("id", id);
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
  // PRODUK: EDIT
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

  const getCategoryName = (id?: string) => {
    if (!id) return "—";
    const found = categories.find((c) => c.id === id);
    return found ? found.name : "—";
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-8 bg-muted/20 min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Manajemen Produk
          </h1>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah, dan hapus produk FixieStore di sini.
          </p>
        </header>

        {/* FORM PRODUK */}
        <Card className="shadow-sm border rounded-xl">
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Produk" : "Tambah Produk"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProduct} className="space-y-5">
              {/* KATEGORI */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                {loadingCategories ? (
                  <p className="text-sm text-muted-foreground">
                    Memuat kategori...
                  </p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada kategori di database.
                  </p>
                ) : (
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
                )}
              </div>

              {/* PRODUK TERKAIT */}
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
                  Gunakan Ctrl/Cmd untuk pilih lebih dari satu.
                </p>
              </div>

              {/* NAMA & BRAND */}
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

              {/* DESKRIPSI */}
              <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                <Input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Deskripsi pendek"
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

              {/* GAMBAR */}
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

              {/* HARGA & STOK */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* TOMBOL */}
              <div className="flex flex-col sm:flex-row gap-2">
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
                    onClick={resetProductForm}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* LIST PRODUK */}
        <Card className="shadow-sm border rounded-xl">
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <p>Memuat produk...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada produk.</p>
            ) : (
              <div className="divide-y border rounded-lg overflow-hidden bg-card text-card-foreground">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 flex-wrap gap-3"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Kategori: {getCategoryName(p.category_id)} | Rp{" "}
                        {p.price} | Stok: {p.stock}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(p.id)}
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
      </div>
    </div>
  );
};

export default AdminPage;
