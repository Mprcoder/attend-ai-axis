// Attend AI — Problems Library Client Module (Phase 4)
import { apiRequest } from './supabase.js';

export async function fetchAllProblems() {
  return await apiRequest('/problems', { method: 'GET' });
}

export async function fetchProblemCategories() {
  return await apiRequest('/problems/categories', { method: 'GET' });
}

export function filterAndSortProblems(
  problems,
  {
    search = '',
    difficulty = 'All',
    language = 'All',
    categoryId = 'All',
    status = 'All',
    sortBy = 'id',
  } = {}
) {
  const query = search.trim().toLowerCase();
  return problems
    .filter((p) => {
      if (
        query &&
        !p.title.toLowerCase().includes(query) &&
        !p.description.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (language !== 'All' && p.language !== language) return false;
      if (categoryId !== 'All' && String(p.categoryId) !== String(categoryId))
        return false;
      if (status === 'Solved' && !p.isSolved) return false;
      if (status === 'Unsolved' && p.isSolved) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'difficulty') {
        const order = { Easy: 1, Medium: 2, Hard: 3 };
        return (order[a.difficulty] || 1) - (order[b.difficulty] || 1);
      }
      return a.id - b.id;
    });
}
