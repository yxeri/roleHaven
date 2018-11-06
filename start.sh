#!/bin/bash

mkdir -p ./public/scripts ./public/views ./public/styles ./public/sounds ./public/images ./public/fonts ./public/sounds
mkdir -p ./private/required ./private/images ./private/styles ./private/views ./private/scripts ./private/fonts ./private/sounds

# Copies required JS files to public, such as socket.io
cp -r ./private/required/* ./public/scripts/

# Copies all images to public
cp -r ./private/images/* ./public/images/

cp -r ./private/fonts/* ./public/fonts/

cp -r ./private/sounds/* ./public/sounds

serverMode=$MODE

# Transpiles code to es5
for file in ./private/scripts/*
do
  ./node_modules/browserify/bin/cmd.js "$file" -t [ babelify ] -o ./public/scripts/$(basename "$file")

    if [ "$serverMode" == "dev" ]; then
      # Minifies transpiled code
      ./node_modules/uglify-js/bin/uglifyjs --compress --mangle --output ./public/scripts/$(basename "$file") -- ./public/scripts/$(basename "$file")
    fi
done

# Compiles and compresses sass to css and moves them to public
for file in ./private/styles/*
do
  ./node_modules/node-sass/bin/node-sass --output-style=compressed "$file" -o ./public/styles
done

# Compresses HTML files and moves them to public
for file in ./private/views/*
do
  ./node_modules/html-minifier/cli.js --remove-comments --collapse-whitespace "$file" -o ./public/views/$(basename "$file")
done

configSize=${#CONFIGPATH}

# Installs config from external source, if CONFIGPATH is set
if (($configSize > 0)); then
  # Installs wget, if it doesn't exist
  if ! type "wget" > /dev/null; then
    apt-get update && apt-get -y install wget && rm -rf /var/lib/apt/lists/*
  fi

  mkdir ./config/modified
  wget $CONFIGPATH/appConfig.js -O ./config/modified/appConfig.js
  wget $CONFIGPATH/databasePopulation.js -O ./config/modified/databasePopulation.js
fi
