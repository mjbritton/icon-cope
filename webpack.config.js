/*
  SUPER IMPORTANT: This config assumes your theme folder is named
  exactly 'fictional-university-theme' and that you have a folder
  inside it named 'bundled-assets' - If you'd like to adapt this
  config to work with your own custom folder structure and names
  be sure to adjust the publicPath value on line #116. You do NOT
  need to update any of the other publicPath settings in this file,
  only the one on line #116.
*/

const currentTask = process.env.npm_lifecycle_event;
const path = require("path");
const pjson = require(path.join(__dirname, 'package.json'));
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {
	CleanWebpackPlugin
} = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const autoprefixer = require("autoprefixer");
const fse = require("fs-extra");


const postCSSPlugins = [
	require("postcss-import"),
	require("postcss-mixins"),
	require("postcss-simple-vars"),
	require("postcss-nested"),
	require("postcss-hexrgba"),
	require("postcss-color-function"),
];

class RunAfterCompile {
	apply(compiler) {
		compiler.hooks.done.tap("Update functions.php", function() {
			// update functions php here
			const manifest = fse.readJsonSync("./bundled-assets/manifest.json");

			fse.readFile("./functions.php", "utf8", function(err, data) {
				if (err) {
					console.log(err);
				}

				const scriptsRegEx = new RegExp("/bundled-assets/scripts.+?'", "g");
				const vendorsRegEx = new RegExp("/bundled-assets/vendors~scripts.+?'", "g");
				const cssRegEx = new RegExp("/bundled-assets/styles.+?'", "g");

				let result = data
					.replace(scriptsRegEx, `/bundled-assets/${manifest["scripts.js"]}'`)
					.replace(vendorsRegEx, `/bundled-assets/${manifest["vendors~scripts.js"]}'`)
					.replace(cssRegEx, `/bundled-assets/${manifest["scripts.css"]}'`);

				fse.writeFile("./functions.php", result, "utf8", function(err) {
					if (err) return console.log(err);
				});
			});
		});
	}
}

let cssConfig = {
	test: /\.s[ac]ss$/i,
	use: [
		"css-loader",
		{
			loader: "postcss-loader",
			options: {
				postcssOptions: {
				plugins: () => [autoprefixer()]}
			}
		},
		"sass-loader"
	]
};

let config = {
	entry: {
		scripts: "./js/scripts.js"
	},
	plugins: [],
	module: {
		rules: [
			cssConfig,
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {
					loader: "babel-loader",
					options: {
						presets: [
							"@babel/preset-react",
							["@babel/preset-env", {
								targets: {
									node: "12"
								}
							}]
						]
					}
				}
			}
		]
	}
};

if (currentTask == "devFast") {
	config.devtool = "source-map";
	cssConfig.use.unshift("style-loader");
	config.output = {
		filename: "bundled.js",
		publicPath: "http://192.168.0.2:3000/"
	};
	config.devServer = {
    watchFiles: ['./**/*.php', '!./functions.php'],
		static: {
      directory: path.join(__dirname, 'public'),
      publicPath: 'http://192.168.0.2:3000/',
    },
    watchFiles: ['./**/*.php', '!./functions.php'],
    open: true,
    hot: 'only',
    port: 3000,
    allowedHosts: 'all',
    proxy: {
      '/': {
        target: pjson.wptheme.proxyURL,
        secure: false,
        autoRewrite: true,
        changeOrigin: true,
        headers: {
          'X-ProxiedBy-Webpack' : true,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
          "Access-Control_Allow-Credentials": true
      }
    },
    }
  },
	config.mode = "development";
}

if (currentTask == "build" || currentTask == "buildWatch") {
	cssConfig.use.unshift(MiniCssExtractPlugin.loader);
	postCSSPlugins.push(require("cssnano"));
	config.output = {
		publicPath: "/wp-content/themes/icon-cope/bundled-assets/",
		filename: "[name].[contenthash].js",
		chunkFilename: "[name].[contenthash].js",
		path: path.resolve(__dirname, "bundled-assets")
	};
	config.mode = "production";
	config.optimization = {
		chunkIds: "named",
		splitChunks: {
			chunks: "all",
			name: "vendors~scripts"
		}
	};
	config.plugins.push(
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: "styles.[contenthash].css"
		}),
		new WebpackManifestPlugin({
			publicPath: "",
		}),
		new RunAfterCompile()
	);
}

module.exports = config;