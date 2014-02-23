var bundle = require('browserify')(),
    fs = require('fs');
    uglify = require('uglify-js');

function buildCompress (source) {
    fs.writeFile('./src/DataBind.min.js', uglify.minify(source, {fromString: true}).code, function (err) {
        if (err) throw err;
    });
}

function buildSimple (source) {
    fs.writeFile('./src/DataBind.min.js', source, function (err) {
        if (err) throw err;
    });
}

function build (source) {
    buildCompress(source);
    //buildSimple(source);
}

bundle.add('./src/DataBind.js');
bundle.bundle({standalone: 'DataBind'}, function (err, source) {
    if (err) console.error(err);
    fs.writeFileSync('DataBind.bundle.js', source);
    build(source);
});
