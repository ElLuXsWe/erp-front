export default {
  require: [
    'ts-node/register',
    './src/setupTests.ts' // Este archivo lo crearemos luego
  ],
  extension: ['ts', 'tsx'],
  spec: 'src/**/*.test.ts?(x)', // Puedes ajustar el patrón si tus tests están en otra carpeta
  loader: 'ts-node/esm'
};
