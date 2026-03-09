// Configuração específica para deployment
export default {
  // Configuração para reduzir bundle size
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['axios', 'date-fns', 'clsx']
        }
      }
    }
  },
  // Variáveis de ambiente para produção
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.PGSSL': JSON.stringify('require')
  },
  // Otimizações para deployment
  optimizeDeps: {
    exclude: ['fsevents']
  }
};