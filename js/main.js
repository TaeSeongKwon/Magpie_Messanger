var module = angular.module('magpie_front', ['onsen']);
module.controller('AppController', function($scope){ 
	$scope.selectMenu = function(menuName){
		sideMenu.content.load(menuName);
	}
});