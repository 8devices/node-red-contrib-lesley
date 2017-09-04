

function promise_x() {
  return new Promise(function (fullfill) {
    setTimeout(function () {
		console.log("Promisas");
        fullfill();
    }, 60000);
  });
}



function main() {
	var promisex=[];
	promisex.push(promise_x());
    
  
  
  Promise.all(promisex).then(values => {
    console.log('All promises fullfilled');
  });
}


main();
