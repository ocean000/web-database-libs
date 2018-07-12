import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
    input: 'src/index.js',
    output: {
        file: pkg.main,
        format: 'cjs'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        uglify()
    ]
}