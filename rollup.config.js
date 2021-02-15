const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { terser } = require('rollup-plugin-terser');
const babel = require('rollup-plugin-babel');
const typescript = require('@rollup/plugin-typescript')

const pkg = require('./package.json');


const extensions = ['.js', '.jsx', '.ts', '.tsx']
const emptyFile = 'export default undefined'

// ignore builtin requires
function ignore() {
    return {
        transform(code, id) {
            if (!id.includes('commonjs-external')) return

            return {
                code: emptyFile,
                map: null
            }
        }
    }
};

const plugins = [
    ignore(),
    json(),
    typescript(),
    nodeResolve({ extensions }),
    commonjs(),
    babel({
        extensions,
        ignore: [/[/\\]core-js/, /@babel[/\\]runtime/]
    }),
    terser()
];

const output = (format, etc = {}) => ({
    banner: '/* Strom, @license MIT */',
    name: 'Strom',
    sourcemap: true,
    format,
    file: `dist/${format}.js`,
    ...etc
});

module.exports = {
    input: 'index.ts',
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    output: [
        output('umd'),
        output('es'),
        output('cjs', { exports: 'named' }),
    ],
    onwarn: function(error) {
        if (/external dependency|Circular dependency/.test(error.message)) return
        console.error(error.message) // eslint-disable-line
    },
    plugins
}