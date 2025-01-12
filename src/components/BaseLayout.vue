<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Menubar from 'primevue/menubar';
import Toast from 'primevue/toast';

const router = useRouter();
const menuItems = ref([
  {
    label: 'Leaderboard',
    icon: 'pi pi-chart-bar',
    command: () => router.push('/'),
  },
  {
    label: 'Admin Panel',
    icon: 'pi pi-cog',
    command: () => router.push('/admin'),
  },
]);

const title = ref('VerifyInfluencers');
const titleStyle = ref(
  'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700'
);
</script>

<template>
  <div class="min-h-screen p-2">
    <Menubar :model="menuItems">
      <template #start>
        <router-link to="/">
          <div class="hidden md:flex items-center gap-2 text-primary-500">
            <i class="pi pi-shield text-primary-500"></i>
            <span :class="['text-xl', titleStyle]">
              {{ title }}
            </span>
          </div>
        </router-link>
      </template>

      <template #end>
        <router-link to="/">
          <span :class="['md:hidden pr-2', titleStyle]">{{ title }}</span>
        </router-link>
      </template>
    </Menubar>

    <main class="p-4">
      <slot />
    </main>

    <Toast position="bottom-right" />
  </div>
</template>

<style scoped></style>
