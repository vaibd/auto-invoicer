"use client";

import { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  products: Product[];
  onChange: (products: Product[]) => void;
}

export function ProductForm({ products, onChange }: Props) {
  function addProduct() {
    onChange([
      ...products,
      { id: `prod-${Date.now()}`, name: "", price: 0, quantity: 1 },
    ]);
  }

  function updateProduct(id: string, updates: Partial<Product>) {
    onChange(
      products.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }

  function removeProduct(id: string) {
    onChange(products.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-lg font-bold">Products / Services</h3>

      {products.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No products added yet. Add at least one to generate invoices.
        </p>
      )}

      <div className="space-y-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Item {i + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeProduct(product.id)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`prod-name-${product.id}`}>Name</Label>
              <Input
                id={`prod-name-${product.id}`}
                value={product.name}
                maxLength={200}
                onChange={(e) =>
                  updateProduct(product.id, { name: e.target.value })
                }
                placeholder="e.g. Web Development"
                className="pt-0 pb-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`prod-price-${product.id}`}>Price</Label>
                <Input
                  id={`prod-price-${product.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={999999999}
                  value={product.price || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateProduct(product.id, {
                      price: Math.max(0, Math.min(999999999, val)),
                    });
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`prod-qty-${product.id}`}>Quantity</Label>
                <Input
                  id={`prod-qty-${product.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={999999}
                  value={product.quantity || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updateProduct(product.id, {
                      quantity: Math.max(0, Math.min(999999, Math.floor(val))),
                    });
                  }}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addProduct}
        className="gap-1"
      >
        <Plus className="size-3.5" />
        Add product
      </Button>
    </div>
  );
}
