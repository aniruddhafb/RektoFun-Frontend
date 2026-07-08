export interface Category {
  id: number;
  category: string;
  challenges_count: number | null;
  parent_category: string | null;
  image_url?: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL || 'http://localhost:8000/api';

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

export async function getCategoriesByParent(parentCategory: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories/by-parent/${parentCategory}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories by parent: ${response.statusText}`);
  }

  return response.json();
}

export async function getParentCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories/parent-categories`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch parent categories: ${response.statusText}`);
  }

  return response.json();
}