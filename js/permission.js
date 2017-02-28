navigator.getUserMedia({video : true, audio : true},
	function (){
		chrome.extension.getBackgroundPage().location.reload();
		window.close();
	},function() {
		window.location.reload();
	}
);