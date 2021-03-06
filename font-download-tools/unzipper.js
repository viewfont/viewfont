var unzip = require('unzip'),
    fs = require('fs'),
    _ = require('underscore'),
    fnparser = require('./filenameparser');

function getFontFaceTemplate(fontName, fontPath){
  return '@font-face{font-family:"' + fontName + '";src:url("../fonts/' + fontPath + '");}'
}

// Creates a master CSS file containing all fonts
var fontsToAppend = [];

function addFontCSS(path){
  font = {
    name: fnparser.parse( path.substring( 0, path.lastIndexOf('.') ) ),
    path: path
  };
  fontsToAppend.push(font);
  appendNextFontCSS();
}

// Appends next fonts' @font-face css to fonts.css
var firstFont = true;
var inProgress = false;
function appendNextFontCSS(){
  if(inProgress || fontsToAppend.length === 0) return;
  inProgress = true;
  var font = fontsToAppend.shift();
  fs.appendFile('fonts.css', getFontFaceTemplate(font.name, font.path), function(err){
    console.log( getFontFaceTemplate(font.name, font.path) );
    if(err){
      console.log('Error writing CSS: ', err);
    }
    var objectToAppend;
    if(firstFont){
      objectToAppend = JSON.stringify(font);
      firstFont = false;
    }else{
      objectToAppend = ',' + JSON.stringify(font);
    }
    console.log(objectToAppend);
    fs.appendFile('fonts.js', objectToAppend, function(err){
      if(err){
        console.log('Error writing JS: ', err);
      }
      inProgress = false;
      appendNextFontCSS();
    });
  });
}

// Unzips a folder and calls addFontCSS for each of the fonts inside
function unzipFolder(path){
  fs.createReadStream(path)
    .pipe(unzip.Parse())
    .on('entry', function (entry) {
      var fileName = entry.path;
      var extension = fileName.substr( fileName.lastIndexOf('.') + 1 );
      if (extension == 'woff' || extension == 'ttf' || extension == 'otf' || extension == 'eot' || extension == 'svg'){
        entry.pipe(fs.createWriteStream('fonts/' + fileName));
        addFontCSS(fileName);
      }else{
        entry.autodrain();
      }
    });
}


fs.readdir('./', function(err, files){
  if(err){
    console.log('Error reading files: ', err);
    return;
  }

  // Filters out extraneous files
  files = _.filter(files, function(file){
    return file.substr(file.length - 3) === 'zip';
  });

  // Creates a javascript file with a list of all of the fonts
  fs.writeFile('fonts.js', 'var fonts=[', function(err){
    if(err){
      console.log('Error creating fonts.js: ', err);
    }
  });

  // Unzips each file and puts the results in the 'fonts' folder
  _.each(files, function(file, index){
    unzipFolder(file);
  });
});

/* This here is some trickery here to combat EMFILE errors (too many files open) that we were getting. Unfortunately it doesn't work. */
// var filePackets = [];
// for(var i = 0; i < files.length; i += 120){
//   filePackets.push( files.splice(i, i + 120) );
// }
// var delay = 5000;
// _.each(filePackets, function(files){
// console.log('this');
//   setTimeout(function(){
//     _.each(files, function(file){
//       unzipFolder(file);
//     });
//   }, delay - 5000);
//   delay *= 2;
// });







