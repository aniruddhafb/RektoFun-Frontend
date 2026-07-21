export interface Category {
  id: number;
  category: string;
  challenges_count: number | null;
  parent_category: string | null;
  asset_type: AssetType | null;
  image_url?: string;
  metadata?: { image_url?: string } | null;
  created_at: string;
}

export type AssetType = "crypto" | "stock" | "rwa";

const API_BASE_URL = "/api/backend";

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

export async function getCategoriesByParent(
  parentCategory: string,
): Promise<Category[]> {
  const response = await fetch(
    `${API_BASE_URL}/categories/by-parent/${parentCategory}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch categories by parent: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getParentCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories/parent-categories`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch parent categories: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function createCategory(input: {
  category: string;
  parent_category?: string | null;
  asset_type?: AssetType | null;
  metadata?: { image_url?: string };
}): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, challenges_count: 0, volume: 0 }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to create category");
  }
  return response.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to remove category");
  }
}

export async function updateCategoryImage(
  id: number,
  imageUrl: string,
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PATCH",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: { image_url: imageUrl } }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to update category image");
  }
  return response.json();
}

export async function updateCategoryAssetType(
  id: number,
  assetType: AssetType,
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PATCH",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ asset_type: assetType }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to update asset type");
  }
  return response.json();
}
