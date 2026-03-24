import { defineConfig } from 'orval';

export default defineConfig({
  wardrobe: {
    input: 'http://localhost:3000/api/docs-json',
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints',
      schemas: 'src/api/model',
      client: 'axios',
      mock: false,
      override: {
        mutator: {
          path: 'src/services/api.ts',
          name: 'customInstance'
        }
      }
    }
  }
});
