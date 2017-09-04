const Promise = require('promise');

function promise_y(x, y) {
  return new Promise(function (fullfill) {
    setTimeout(function () {
      console.log('Complete', x, y);
      fullfill();
    }, Math.random()*5000);
  });
}

function promise_x(x) {
  var ypromises = [];
  for (var y=0; y<5; y++) {
    ypromises.push(promise_y(x, y));
  }

  return Promise.all(ypromises);
}

function main() {
  var xpromises = [];
  for (var x=0; x<3; x++) {
    xpromises.push(promise_x(x));
  }
  
  Promise.all(xpromises).then(function (res) {
    console.log('X promises fullfilled', xpromises);
  });
}

main();
