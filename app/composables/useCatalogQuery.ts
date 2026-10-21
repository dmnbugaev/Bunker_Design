import { parseCatalogQuery } from "~~/shared/utils/catalog-query";
export interface FilterValues {
  minPrice: string;
  maxPrice: string;
  available: boolean;
}
export function useCatalogQuery(category: MaybeRefOrGetter<string> = "") {
  const route = useRoute();
  const router = useRouter();
  const { store } = useStoreSelection();
  const parsed = computed(() => parseCatalogQuery(route.query));
  /**
   * «Только в наличии» включён по умолчанию: без параметра в URL каталог
   * показывает товары, доступные в выбранном магазине. Явное available=0
   * снимает фильтр — тогда видны и позиции с нулевым остатком («Скоро в
   * наличии»).
   */
  const availableDefault = computed(() => route.query.available === undefined);
  const requestQuery = computed(() => ({
    ...(route.query as Record<string, string | string[] | undefined>),
    category: toValue(category) || undefined,
    storeId: store.value?.id,
    // 24 позиции на страницу — три-четыре ряда плотной товарной сетки.
    limit: 24,
    available: availableDefault.value
      ? "1"
      : String(route.query.available ?? ""),
  }));
  const values = computed<FilterValues>(() => ({
    minPrice: parsed.value.minPrice?.toString() ?? "",
    maxPrice: parsed.value.maxPrice?.toString() ?? "",
    available: availableDefault.value ? true : parsed.value.available,
  }));
  // Явно применённые фильтры (для чипов и счётчика на кнопке «Фильтры»):
  // наличие, включённое по умолчанию без параметра в URL, не считается.
  const activeCount = computed(
    () =>
      Number(!!values.value.minPrice || !!values.value.maxPrice) +
      Number(parsed.value.available),
  );
  function apply(filters: Partial<FilterValues>) {
    const next = { ...values.value, ...filters };
    return router.push({
      query: {
        ...route.query,
        page: undefined,
        minPrice: next.minPrice || undefined,
        maxPrice: next.maxPrice || undefined,
        available: next.available ? "1" : "0",
        material: undefined,
        brand: undefined,
      },
    });
  }
  // Сброс возвращает каталог к состоянию по умолчанию: параметры фильтров
  // исчезают из URL целиком (в том числе неявное available), а не
  // превращаются в явный available=1.
  function reset() {
    const omitted = [
      "page",
      "minPrice",
      "maxPrice",
      "available",
      "material",
      "brand",
    ];
    const rest = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => !omitted.includes(key)),
    );
    return router.push({ query: rest });
  }
  function sort(value: string) {
    return router.push({
      query: {
        ...route.query,
        sort: value === "popular" ? undefined : value,
        page: undefined,
      },
    });
  }
  watch(
    () => store.value?.id,
    () => {
      if (route.query.page)
        void router.replace({ query: { ...route.query, page: undefined } });
    },
  );
  return { parsed, requestQuery, values, activeCount, apply, reset, sort };
}
