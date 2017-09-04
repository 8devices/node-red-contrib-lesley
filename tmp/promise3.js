const Promise = require('promise');

function promise_y(x, y) {
  return new Promise(function (fullfill) {
    setTimeout(function () {
      console.log('Y complete', x, y);
      fullfill();
    }, Math.random()*2000);
  });
}

function promise_x(x) {
  return new Promise(function (fullfill) {
    setTimeout(function () {
      var ypromises = [];
      for (var y=0; y<5; y++) {
        ypromises.push(promise_y(x, y));
      }

      Promise.all(ypromises).then(function (res) {
        console.log('X complete', x);
        fullfill();
      });
    }, Math.random()*2000);
  });
}

function main() {
  var xpromises = [];
  for (var x=0; x<3; x++) {
    xpromises.push(promise_x(x));
  }
  
  Promise.all(xpromises).then(values => {
    console.log('All promises fullfilled');
  });
}


main();
