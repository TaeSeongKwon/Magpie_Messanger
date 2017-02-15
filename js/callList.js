var module = angular.module("callList", []);
module.controller("CallListController", ["$scope", function($scope){
	var port = $scope.$parent.myPort;
	// 실시간으로 사용자의 정보를 받아와야 함, 그리고 상태변경도 보내야함
	var GET_ENABLE_CALL_USER = "enable_call_user";
	var CHANGE_STATUS = "change_status";

	$scope.callListTitle = "현재 접속된 친구";
	$scope.enableList = [];
	var onMessageEvent = function (data){
		if(data.type == RESPONSE){
			if(data.category == GET_ENABLE_CALL_USER){
				if(data.isSuccess){
					console.log(data['enableList']);
					$scope.enableList = data['enableList'];
					$scope.$apply();
				}else{
					ons.notification.alert(data['msg'], "목록 가져오기 실패!");
				}

			}
		}
	}
	port.onMessage.addListener(onMessageEvent);
	var first = {
		'type' 		: 		REQUEST,
		'category' 	: 		GET_ENABLE_CALL_USER,
		'userNum' 	: 		$scope.$parent.userProfile['userNum']
	};
	console.log("get_user_list");
	port.postMessage(first);

	// Destroy Controller
	$scope.$on("destroy:callList", function(){
		console.log("end CallListController");
		port.onMessage.removeListener(onMessageEvent);
	});
}]);