<script setup lang="ts">
import type { Product } from "~~/shared/types/product";
defineProps<{ products: Product[]; featured?: boolean }>();
</script>
<template>
  <div class="product-grid" :class="{ 'product-grid--featured': featured }">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
</template>
