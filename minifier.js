var fs = require('fs');
var path = require('path');
var htmlMinifier = require('html-minifier');
var minifier = require('node-minify');

function htmlMinify(inPath, outPath, file) {
	fs.readFile(path.join(inPath, file), 'utf8', function(readError, readFile) {
        if(readError) {
            //TODO Change to proper logging
            console.log('ReadError', readError)
        } else {
            var minifyConfig = {
                removeComments : true,
                removeCommentsFromCDATA : true,
                removeCDATASectionsFromCDATA : true,
                collapseWhitespace : true,
                minifyJS : true,
                minifyCSS : true
            }

            fs.writeFile(path.join(outPath, file), htmlMinifier.minify(readFile, minifyConfig), function(writeError) {
                if(writeError) {
                    //TODO Change to proper logging
                    console.log('WriteError', writeError);
                }
            });
        }
    });
}

function nodeMinify(inPath, outPath, file, minifierType) {
	new minifier.minify({
        type : minifierType,
        fileIn : path.join(inPath, file),
        fileOut : path.join(outPath, file),
        callback : function (err) {
            if(err) {
                console.log("Minify error", err);
            }

            console.log("Minified " + path.join(inPath, file));
        }
    });
}

//TODO: Proper logging
function minify(inPath, outPath, extension) {
	fs.readdir(inPath, function(err, files) {
        if(err) {
            console.log(err);
        } else {
            files.forEach(function(file) {
            	if(path.extname(file).substr(1) === extension) {
                    if(extension === 'html') {
		                htmlMinify(inPath, outPath, file);
					} else if(extension === 'js') {
						nodeMinify(inPath, outPath, file, "uglifyjs");
					} else if(extension === 'css') {
						nodeMinify(inPath, outPath, file, "sqwish")
					}
				}
            });
        }
    });
}

exports.minify = minify;