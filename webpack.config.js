//const WrapperPlugin = require('wrapper-webpack-plugin');
const path = require('path');
//const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
	entry: {
		//"fovtest": "./build/fov/test.js",
		"fluidtest": "./build/fluidtest/main.js",
		//"serializeTest": "./build/test/serializeTest.js"
	},
	output: {
		path: __dirname + "/dist",
		filename: "_bundle.[name].js"
	},
	mode: "production",
	optimization: {
		minimize: true,
		namedModules: true,
		namedChunks: true
	},
	performance: {
		maxEntrypointSize: 400000,
		maxAssetSize: 400000
	},
	resolve: {
		modules: [
			path.resolve("./build"),
			path.resolve("./node_modules")
		]
	},
	plugins: [
		// new CircularDependencyPlugin({
		// 	// exclude detection of files based on a RegExp
		// 	exclude: /node_modules/,
		// 	// add errors to webpack instead of warnings
		// 	// failOnError: true,
		// 	// set the current working directory for displaying module paths
		// 	cwd: process.cwd(),
		// }),
// 		new WrapperPlugin({
// 			test: /\.js$/,
// 			header: ``,
// 			footer: ''
// 		})
	],
	// module: {
	// 	rules: [
				//left this here commented out because I'm too lazy to google documentation when I need this again
			// {
			// 	test: /\.js$/,
			// 	loader: "string-replace-loader",
			// 	options: {
			// 		search: ``,
			// 		replace: ``
			// 	}
			// }
	// 	]
	// }
};