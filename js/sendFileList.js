var sendFileList = angular.module("sendFileList", []);
sendFileList.controller("UsableController", ["$scope", function($scope){
	var kts = document.createElement("input");
	var port = $scope.$parent.myPort;
	var user = $scope.$parent.userProfile;
	var REQUEST_USABLE_FILE_USER = "request:usable_file_user";
	var RESPONSE_USABLE_FILE_USER = "response:usable_file_user";
	$scope.usableList = [];

	$scope.init = function(){
		console.log("START : UsableController!");
		var reqData = new SimplePacket(REQUEST_USABLE_FILE_USER);
		reqData.setBody({ "userNum" : user['userNum']});
		port.onMessage.addListener($scope.onMessageEvnet);
		port.postMessage(reqData);
	}
	$scope.destroy = function(){
		console.log("DESTROY : UsableController");
		port.onMessage.removeListener($scope.onMessageEvnet);
	}
	$scope.test = function(idx){
		console.log("usableList["+idx+"] : ", $scope.usableList[idx]);
		user['userName'], user['userNum'], user['userEmail'];
	}
	$scope.onMessageEvnet = function(data){
		var head = data.head;
		var body = data.body; 
		if(head == RESPONSE_USABLE_FILE_USER){
			if(body.isSuccess){
				console.log(RESPONSE_USABLE_FILE_USER, body);
				$scope.usableList = body.friendList;
				$scope.$apply();
			}else{
				ons.notification.alert("사용자 목록을 불러오는데 실패했습니다.", {title : "ERROR!"});
			}
		}
	}
}]);