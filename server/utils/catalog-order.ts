import type { Category } from "../../shared/types/category";

/**
 * Детерминированный порядок категорий каталога: корни — по числу товаров
 * всей ветви (подчинённые папки считают в корень) по убыванию, затем по
 * алфавиту (ru); подкатегории — по алфавиту (ru).
 *
 * Раньше корни и дети сортировались одним проходом с компаратором,
 * который для пары «корень vs подкатегория» сравнивал алфавит, а для
 * «корень vs корень» — количество: неконсистентный компаратор даёт
 * движково-зависимый мусорный порядок (в живом каталоге «Табак для
 * кальяна», 700+ товаров в подпапках, проваливался в конец списка).
 * Сортировка обязана быть двумя раздельными устойчивыми проходами.
 */
export function orderCatalogCategories(
  categories: Category[],
  products: readonly { categoryId: string }[],
): Category[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const rootCounts = new Map<string, number>();
  for (const product of products) {
    let id: string | null = product.categoryId;
    const visited = new Set<string>();
    while (id && !visited.has(id)) {
      visited.add(id);
      const category = byId.get(id);
      if (!category) break;
      if (!category.parentId) rootCounts.set(id, (rootCounts.get(id) ?? 0) + 1);
      id = category.parentId;
    }
  }
  const byName = (a: Category, b: Category) =>
    a.name.localeCompare(b.name, "ru");
  const roots = categories
    .filter((category) => !category.parentId)
    .sort(
      (a, b) =>
        (rootCounts.get(b.id) ?? 0) - (rootCounts.get(a.id) ?? 0) ||
        byName(a, b),
    );
  const children = categories
    .filter((category) => category.parentId)
    .sort(byName);
  return [...roots, ...children];
}
