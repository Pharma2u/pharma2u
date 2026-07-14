import type { Product } from "@/lib/authApi";
import { productCategoryLabels } from "./productConfig";

export function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const image = product.imageUrls?.[0]?.url ?? product.imageUrl;
  const size = large ? "h-14 w-14" : "h-12 w-12";

  if (image) {
    return <img src={image} alt="" className={`${size} shrink-0 rounded-xl border border-slate-200 bg-white object-cover`} />;
  }

  return (
    <div className={`${size} grid shrink-0 place-items-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700`} aria-hidden="true">
      {product.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function ProductRow({
  product,
  onStock,
  onRemove,
  onEdit,
}: {
  product: Product;
  onStock: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const low = product.isActive && product.stock < 10;

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <ProductImage product={product} />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{product.name}</h3>
            {!product.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">Inactive</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {product.genericName} / {productCategoryLabels[product.category]} / INR {product.price.toFixed(2)} / {product.unit}
          </p>
          <p className={`mt-1 text-sm font-semibold ${low ? "text-amber-700" : "text-slate-700"}`}>
            {product.stock} units{low && " - Low stock"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
        <button type="button" onClick={onStock} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stock</button>
        {product.isActive && <button type="button" onClick={onRemove} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Deactivate</button>}
      </div>
    </article>
  );
}