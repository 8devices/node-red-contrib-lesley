const Promise = require('promise');

function main() {
  var xpromises = [];
  for (var x=0; x<3; x++) {
    xpromises.push(new Promise(function (xfullfill) {
      setTimeout(function () {
        var ypromises = [];
        for (var y=0; y<5; y++) {
          ypromises.push(new Promise(function (yfullfill) {
            setTimeout(function () {
              yfullfill();
            }, y*10);
          }));
        }

        Promise.all(ypromises).then(function (res) {
          console.log('Y promises fullfilled', ypromises);
          xfullfill();
        });
      }, x*100);
    }));
  }
  
  Promise.all(xpromises).then(function (res) {
    console.log('X promises fullfilled', xpromises);
  });
}


main();
