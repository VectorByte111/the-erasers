import {defineConfig} from 'vite';

//// base './' makes the build work on any static host (GitHub Pages, Netlify, itch.io...)

export default defineConfig({
    base: './',
    build: {chunkSizeWarningLimit : 1600},
});



