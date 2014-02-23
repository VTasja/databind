
var bundle = require('browserify')(),
    fs = require('fs'),
    uglify = require('uglify-js');

function buildCompress (source, filePath) {
    fs.writeFile(filePath, uglify.minify(source, {fromString: true}).code, function (err) {
        if (err) throw err;
    });
}

function build (source, filePath) {
    buildCompress(source, filePath);
}

bundle.add('./src/DataBind.js');
bundle.bundle({standalone: 'DataBind'}, function (err, source) {
    if (err) console.error(err);
    build(source, './src/DataBind.min.js');
});
