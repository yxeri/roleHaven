'use strict';

const fs = require('fs');
const path = require('path');
const htmlMinifier = require('html-minifier');
const minifier = require('node-minify');

function htmlMinify(inPath, outPath) {
    fs.readFile(inPath, 'utf8', function(readError, readFile) {
        if(readError) {
            //TODO Change to proper logging
            console.log('ReadError', readError);
        } else {
            const minifyConfig = {
                removeComments : true,
                removeCommentsFromCDATA : true,
                removeCDATASectionsFromCDATA : true,
                collapseWhitespace : true,
                minifyJS : true,
                minifyCSS : true
            };

            fs.writeFile(outPath, htmlMinifier.minify(readFile, minifyConfig),
                         function(writeError) {
                if(writeError) {
                    //TODO Change to proper logging
                    console.log('WriteError', writeError);
                }
            });
        }
    });
}

function nodeMinify(inPath, outPath, minifierType) {
    new minifier.minify({
        type : minifierType,
        fileIn : inPath,
        fileOut : outPath,
        callback : function(err) {
            if(err) {
                console.log('Minify error', err);
            }

            console.log('Minified ' + inPath);
        }
    });
}

//TODO: Proper logging
function minifyDir(inPath, outPath, extension) {
    fs.readdir(inPath, function(err, files) {
        if(err) {
            console.log(err);
        } else {
            files.forEach(function(file) {
                const fullInPath = path.join(inPath, file);
                const fullOutPath = path.join(outPath, file);

                if(path.extname(file).substr(1) === extension) {
                    if(extension === 'html') {
                        htmlMinify(fullInPath, fullOutPath);
                    } else if(extension === 'js') {
                        nodeMinify(fullInPath, fullOutPath, 'uglifyjs');
                    } else if(extension === 'css') {
                        nodeMinify(fullInPath, fullOutPath, 'sqwish');
                    }
                }
            });
        }
    });
}

function minifyFile(filePath, outPath) {
    const extension = path.extname(filePath).substr(1);

    if(extension === 'html') {
        htmlMinify(filePath, outPath);
    } else if(extension === 'js') {
        nodeMinify(filePath, outPath, 'uglifyjs');
    } else if(extension === 'css') {
        nodeMinify(filePath, outPath, 'sqwish');
    }
}

exports.minifyDir = minifyDir;
exports.minifyFile = minifyFile;