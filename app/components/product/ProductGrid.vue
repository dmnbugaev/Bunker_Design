<script setup lang="ts">
import type { Product } from "~~/shared/types/product";
defineProps<{ products: Product[] }>();
</script>
<template>
  <div class="product-grid">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
</template>
