//jQuery(document).ready(function($){
	var cartWrapper = $('.cd-cart-container');
	//product id - you don't need a counter in your real project but you can use your real product id
	var productId = 0;

	if( cartWrapper.length > 0 ) {
		//store jQuery objects
		var cartBody = cartWrapper.find('.body')
		var cartList = cartBody.find('ul').eq(0);
		var cartTotal = cartWrapper.find('.checkout').find('span');
		var cartTrigger = cartWrapper.children('.cd-cart-trigger');
		var cartCount = cartTrigger.children('.count')
		var addToCartBtn = $('.cd-add-to-cart');
		var undo = cartWrapper.find('.undo');
		var undoTimeoutId;

		// Everything but IE
		window.addEventListener("load", function() {
		    // loaded
			if (typeof(Storage) !== "undefined") {
				var storage = JSON.parse(localStorage.getItem('Products'));
				var counter = localStorage.getItem('cartCount');
				var counterNext = Number(counter) + 1;

				if(storage) {
					cartWrapper.removeClass('empty');
					cartCount.find('li').eq(0).text(counter);
					cartCount.find('li').eq(1).text(counterNext);
					//updateCartCount(true, counter);
					retrieveProducts();
				}
				if(localStorage.cartCount == "0") {
					cartWrapper.addClass('empty');
				}
			} else {
				// Sorry! No Web Storage support..
				alert("Sorry! No Web Storage support..");
			}
		}, false); 

		// Check if Browser is IE or not
		if (navigator.appName == 'Microsoft Internet Explorer' ||  !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1)) {
			// IE
			window.attachEvent("onload", function() {
			    // loaded
			    checkStorage();
			});
		}

		//add product to cart
		addToCartBtn.on('click', function(event){
			event.preventDefault();
			addToCart($(this));
		});

		//open/close cart
		cartTrigger.on('click', function(event){
			event.preventDefault();
			toggleCart();
		});

		//close cart when clicking on the .cd-cart-container::before (bg layer)
		cartWrapper.on('click', function(event){
			if( $(event.target).is($(this)) ) toggleCart(true);
		});

		//delete an item from the cart
		cartList.on('click', '.delete-item', function(event){
			event.preventDefault();
			removeProduct($(event.target).parents('.product'));
		});

		//update item quantity
		cartList.on('change', 'select', function(event){
			quickUpdateCart();

		});

		//reinsert item deleted from the cart
		undo.on('click', 'a', function(event){
			clearInterval(undoTimeoutId);
			event.preventDefault();
			cartList.find('.deleted').addClass('undo-deleted').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(){
				$(this).off('webkitAnimationEnd oanimationend msAnimationEnd animationend').removeClass('deleted undo-deleted').removeAttr('style');
				quickUpdateCart();
			});
			undo.removeClass('visible');
		});
	}

	function toggleCart(bool) {
		var cartIsOpen = ( typeof bool === 'undefined' ) ? cartWrapper.hasClass('cart-open') : bool;
		
		if( cartIsOpen ) {
			cartWrapper.removeClass('cart-open');
			//reset undo
			clearInterval(undoTimeoutId);
			undo.removeClass('visible');
			cartList.find('.deleted').remove();

			setTimeout(function(){
				cartBody.scrollTop(0);
				//check if cart empty to hide it
				if( Number(cartCount.find('li').eq(0).text()) == 0) cartWrapper.addClass('empty');
			}, 500);
		} else {
			cartWrapper.addClass('cart-open');
		}
	}

	function addToCart(trigger) {
		var cartIsEmpty = cartWrapper.hasClass('empty');
		//update cart product list
		addProduct(trigger);
		//update number of items 
		updateCartCount(cartIsEmpty);
		//update total price
		updateCartTotal(trigger.data('price'), true);
		//show cart
		cartWrapper.removeClass('empty');
	}

	function addProduct(product) {
		//this is just a product placeholder
		//you should insert an item with the selected product info
		//replace productId, productName, price and url with your real product info
		productId = productId + 1;
		var productAdded = $('<li class="product"><div class="product-image"><a href="#0"><img src="'+ product.data("href") +'" alt="placeholder"></a></div><div class="product-details"><h3><a href="#0">'+ product.data("name") +'</a></h3><span class="price">$'+ product.data("price") +'</span><div class="actions"><a href="#0" class="delete-item">Delete</a><div class="quantity"><label for="cd-product-'+ productId +'">Qty</label><span class="select"><select id="cd-product-'+ productId +'" name="quantity"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option></select></span></div></div></div></li>');

		if(!ifExist(product)) {
		    cartList.prepend(productAdded);
		} else {
            quickAdd(product);
		}

		var productName = product.data('name');
		var productPrice = product.data('price');
		var productHref = product.data('href');

		storeItem(productName, productPrice, productHref);
	}

	function ifExist(product) {
	    var exists = false; 
	    cartList.find("li").each(function(){
	        if($(this).find("h3").text() == product.data('name')) {
	            exists = true;
	        }
	    });

	    return exists;
	}

	function quickAdd(product) {
		var quantity = 0;
		var price = 0;

		cartList.find("li").each(function(){
	        if($(this).find("h3").text() == product.data('name')) {
    			var singleQuantity = Number($(this).find('select').val());
    			quantity = 1 + singleQuantity;
    			price = price + quantity*Number($(this).find('.price').text().replace('$', ''));
    			$(this).find('select').val(quantity);
	        }
	    });
	}

	function removeProduct(product) {
		clearInterval(undoTimeoutId);
		cartList.find('.deleted').remove();

		var productName = $(product.html()).find('h3').text();
		var cart = JSON.parse(localStorage["Products"]);

		for (var item in cart) {
			if (item == productName) {
				delete cart[productName];
				if(localStorage.cartCount == "0") {
					localStorage.clear();
				}
			}
		}

		localStorage["Products"] = JSON.stringify(cart);
		
		var topPosition = product.offset().top - cartBody.children('ul').offset().top ,
			productQuantity = Number(product.find('.quantity').find('select').val()),
			productTotPrice = Number(product.find('.price').text().replace('$', '')) * productQuantity;
		
		product.css('top', topPosition+'px').addClass('deleted');

		//update items count + total price
		updateCartTotal(productTotPrice, false);
		updateCartCount(true, -productQuantity);
		undo.addClass('visible');

		//wait 8sec before completely remove the item
		undoTimeoutId = setTimeout(function(){
			undo.removeClass('visible');
			cartList.find('.deleted').remove();
		}, 8000);
	}

	function quickUpdateCart() {
		var quantity = 0;
		var price = 0;
		var data = {};
		var counter = 0;
		//[var counter = Number(localStorage.getItem('cartCount'));

		cartList.children('li:not(.deleted)').each(function(){
			var singleQuantity = Number($(this).find('select').val());
			quantity = quantity + singleQuantity;
			price = price + singleQuantity*Number($(this).find('.price').text().replace('$', ''));

			var retrieverObject = localStorage.getItem('Products');
			var retrieveObject = JSON.parse(retrieverObject);

			data.productId = $($(this).html()).find('h3').text();
			data.price = Number($(this).find('.price').text().replace('$', ''));
			data.count = Number($(this).find('select').val());

			if(retrieveObject[data.productId]){
				retrieveObject[data.productId] = {
					productPrice: data.price,
					count: data.count
				};
			}

			counter = counter + data.count;

			localStorage.setItem('Products', JSON.stringify(retrieveObject));
			localStorage.setItem('cartCount', counter.toString());

		});

		



		cartTotal.text(price.toFixed(2));
		cartCount.find('li').eq(0).text(quantity);
		cartCount.find('li').eq(1).text(quantity+1);
	}

	function updateCartCount(emptyCart, quantity) {
		if( typeof quantity === 'undefined' ) {
			var actual = Number(cartCount.find('li').eq(0).text()) + 1;
			var next = actual + 1;
			
			if( emptyCart ) {
				cartCount.find('li').eq(0).text(actual);
				cartCount.find('li').eq(1).text(next);
			} else {
				cartCount.addClass('update-count');

				setTimeout(function() {
					cartCount.find('li').eq(0).text(actual);
				}, 150);

				setTimeout(function() {
					cartCount.removeClass('update-count');
				}, 200);

				setTimeout(function() {
					cartCount.find('li').eq(1).text(next);
				}, 230);
			}
		} else {
			var actual = Number(cartCount.find('li').eq(0).text()) + quantity;
			var next = actual + 1;
			
			cartCount.find('li').eq(0).text(actual);
			cartCount.find('li').eq(1).text(next);
		}

		localStorage.setItem('cartCount', actual);
	}

	function updateCartTotal(price, bool) {
		bool ? cartTotal.text( (Number(cartTotal.text()) + Number(price)).toFixed(2) )  : cartTotal.text( (Number(cartTotal.text()) - Number(price)).toFixed(2) );
	}

	function storeItem(product, price, href) {
		// Save item to localStorage
		// NOTE: You can remove this function and combine the conditional codes to addProduct()
		var data = {};
		data.productPrice = price;
		data.productId = product;
		data.productHref = href;

		if (localStorage.getItem("Products") === null || localStorage.getItem("Products") === undefined){
			var obj = [];
			var retrieveObject = {};

			retrieveObject = {
				productPrice: data.productPrice,
				productHref: data.productHref,
				count: 1
			};

			obj = {
				[data.productId] : retrieveObject
			};

			localStorage.setItem('Products', JSON.stringify(obj));
		} else {
			var retrieverObject = localStorage.getItem('Products');
			var retrieveObject = JSON.parse(retrieverObject);

			if(retrieveObject[data.productId]){
				retrieveObject[data.productId].count++;
			}else{
				retrieveObject[data.productId] = {
					productPrice: data.productPrice,
					productHref: data.productHref,
					count: 1
				};
			}

			localStorage.setItem('Products', JSON.stringify(retrieveObject));
		}
	}

	function retrieveProducts() {
		var arr = JSON.parse(localStorage.getItem('Products'));
		var count = 1;
		var total = 0;
		var item;

		Object.keys(arr).forEach(function(elem) {
			var productAdded = $('<li class="product"><div class="product-image"><a href="#0"><img src="'+ arr[elem]['productHref'] +'" alt="placeholder"></a></div><div class="product-details"><h3><a href="#0">'+ elem +'</a></h3><span class="price">$'+ arr[elem]['productPrice'] +'</span><div class="actions"><a href="#0" class="delete-item">Delete</a><div class="quantity"><label for="cd-product-'+ count +'">Qty</label><span class="select"><select id="cd-product-'+ count +'" name="quantity"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option></select></span></div></div></div></li>');
			productAdded.find('select').val(arr[elem]['count']);
			cartList.prepend(productAdded);
			count++;

			item = arr[elem]['productPrice'] * arr[elem]['count'];
			total = total + item;
		});
		

	
		cartTotal.text(total.toFixed(2));
	}

	function checkout() {

		var arr = JSON.parse(localStorage.getItem('Products'));
		var count = 1;
		var total = 0;
		var item;
		var totalcounter = 0;

		Object.keys(arr).forEach(function(elem) {

			item = arr[elem]['productPrice'] * arr[elem]['count'];

			var productAdded = $('<div class="product-details"><strong>' + elem + '</strong>&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; <span style="color: red"> Price: ₱' + arr[elem]['productPrice'] + '</span> &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; <strong>Qty: ' + arr[elem]['count'] + '</strong> &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; <span style="color: red">Total: ₱' + item + '</span><br></div>').html();
            
            totalcounter = totalcounter + item;

			$("div#items").prepend('\n' + productAdded + '<br />');
			

			//$("fieldset#inputmessage").prepend($('<input id="message" name="message" value="'+ productAdded.text() +'" type="hidden">'));
			count++;
		});

		$("div#items").append('<span style="color: red; font-size: x-large;"><strong><br>\nTotal Price: $' + totalcounter + '</strong></span>');
		$("fieldset#inputmessage").append('<input id="items" name="items" value="'+ $("div#items").text() + '" type="hidden">');
	}

	$('#clearbutton').on('click', function(event){
		$('ul.count li').replaceWith('<li>0</li>');
		localStorage.clear();
		$('#ullink li').remove();
		$('.cd-cart-container').attr('class','cd-cart-container empty');
		total = 0;
		cartTotal.text(total.toFixed(2));
	});

	function searchItem() {
		// Declare variables
		var input = document.getElementById('search');
		var filter = input.value.toUpperCase();
		var ul = document.getElementById("itemList");
		var li = ul.getElementsByClassName('cartwrap');

		slider.disable();

		for (i = 0; i < li.length; i++) {

			a = li[i].getElementsByTagName("h1")[0];

			if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
				li[i].style.display = "";
			} else {
				li[i].style.display = "none";
			}
		}
	}

// Load the script after the window loads
$(window).load(function(){

	var rates = '<div class="rates"><span class="fa fa-star checked"></span><span class="fa fa-star checked"></span><span class="fa fa-star checked"></span><span class="fa fa-star"></span><span class="fa fa-star"></span></div>';

	$('main #itemList').each(function(){  

		$(rates).insertAfter('.item-description', this);

		var highestBox = 0;

		$('.cartwrap', this).each(function(){

			if($(this).height() > highestBox) {
				highestBox = $(this).height(); 
			}

		});  
		
		$('.cartwrap', this).height(highestBox);
		$('.cd-add-to-cart').css('position','absolute');
	}); 

});

/* Price Range Slider */
var slider = new Slider('#ex2', {tooltip: 'hide'});

slider.on("slide", function(sliderValue) {
	document.getElementById('ex2').textContext = sliderValue;

	var ul = document.getElementById("itemList");
	var li = ul.getElementsByClassName('cartwrap');
	var count = 0;

	for (i = 0; i < li.length; i++) {

		a = li[i].getElementsByClassName("cd-add-to-cart")[0];

		document.getElementsByClassName('min-range')[0].innerText = "$ " + sliderValue[0];
		document.getElementsByClassName('max-range')[0].innerText = "$ " + sliderValue[1];

		if (a.dataset.price > sliderValue[0] && a.dataset.price < sliderValue[1]) {
			count++;
			li[i].style.display = "";
			
		} else {
			li[i].style.display = "none";
			//document.getElementById('noresult').style.display = "block";
			count--;
		}

		if(count === -li.length) {
			document.getElementById('noresult').style.display = "block";
		} else {
			document.getElementById('noresult').style.display = "none";
		}
		
	}
});

/* Sort by Name */
function sortList() {

  var list, i, switching, b, shouldSwitch, dir, switchcount = 0;
  list = document.getElementById("itemList");

  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc"; 
  //Make a loop that will continue until no switching has been done:
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    b = list.getElementsByClassName("cartwrap");

    console.log(b);
    //Loop through all list-items:
    for (i = 0; i < (b.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      //check if the next item should switch place with the current item, based on the sorting direction (asc or desc):
      if (dir == "asc") {
        if (b[i].getElementsByTagName("h1")[0].innerText.toLowerCase() > b[i + 1].getElementsByTagName("h1")[0].innerText.toLowerCase()) {
          //if the next item is alphabetically lower than this item, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (b[i].getElementsByTagName("h1")[0].innerText.toLowerCase() < b[i + 1].getElementsByTagName("h1")[0].innerText.toLowerCase()) {
          //if the next item is alphabetically higher than this item, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      //If a switch has been marked, make the switch and mark that a switch has been done:
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      //If no switched has been done AND the direction is "asc", set the direction to "desc" and run the while loop again.
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}

	
/*	// Create a "close" button and append it to each list item
	var myNodelist = document.getElementsByTagName("LI");
	var i;
	for (i = 0; i < myNodelist.length; i++) {
	  var span = document.createElement("SPAN");
	  var txt = document.createTextNode("\u00D7");
	  span.className = "close";
	  span.appendChild(txt);
	  myNodelist[i].appendChild(span);
	}

	// Click on a close button to hide the current list item
	var close = document.getElementsByClassName("close");
	var i;
	for (i = 0; i < close.length; i++) {
	  close[i].onclick = function() {
	    var div = this.parentElement;
	    div.style.display = "none";
	  }
	}

	// Add a "checked" symbol when clicking on a list item
	var list = document.querySelector('ul');
	list.addEventListener('click', function(ev) {
	  if (ev.target.tagName === 'LI') {
	    ev.target.classList.toggle('checked');
	  }
	}, false);*/

/*	// Create a new list item when clicking on the "Add" button
	function newElement() {
	  var li = document.createElement("li");
	  var inputValue = document.getElementById("myInput").value;
	  var t = document.createTextNode(inputValue);
	  li.appendChild(t);
	  if (inputValue === '') {
	    alert("You must write something!");
	  } else {
	    document.getElementById("myUL").appendChild(li);
	  }
	  document.getElementById("myInput").value = "";

	  var span = document.createElement("SPAN");
	  var txt = document.createTextNode("\u00D7");
	  span.className = "close";
	  span.appendChild(txt);
	  li.appendChild(span);

	  for (i = 0; i < close.length; i++) {
	    close[i].onclick = function() {
	      var div = this.parentElement;
	      div.style.display = "none";
	    }
	  }
	}*/



//});
