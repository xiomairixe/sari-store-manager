import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // or react plugin if using React

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'public', // <-- change 'public' to whatever you want
  }
})