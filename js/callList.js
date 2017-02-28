var module = angular.module("callList", []);
module.controller("CallListController", ["$scope", function($scope){
	var port = $scope.$parent.myPort;
	// 실시간으로 사용자의 정보를 받아와야 함, 그리고 상태변경도 보내야함
	var GET_ENABLE_CALL_USER = "enable_call_user";
	var CHANGE_STATUS = "change_status";
	var CALLER = "send_request_call";

	//user answer type
	var DISABLE = "disable";
	var REFUSE = "refuse";
	var ACCEPT = "accept";

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
			}else if(data.category == CALLER){
				console.log("RESPONSE CALLER");
				var resData = data.resData;
				var callee = resData.callData;
				applyCall.hide();
				if(resData.type == ACCEPT){
					// 응답함 
					$scope.$root.shareData = {
						'myPort' 		: 		port,
						'callData'		: 		callee
					};
					// console.log("shareData : ", $scope.$parent.shareData);
					// console.log("$parent : ", $scope.$parent);

					pageManager.pushPage("p2pCall.html");

				}else{
					var status;
					if(resData.type == DISABLE)
						status = "은 대화가 불가능 합니다. 잠시후 다시 시도해주세요..";
						// 현재 불가능한 상태
					else
						status = "께서 대화를 거절하였습니다.";
						// 거절한 상태						
					var msg = callee['toName']+"(" +callee['toEmail'] +")"+status;
					ons.notification.alert(msg, { title : "대화 불가능!"});
				}
			}
		}
	}
	
	$scope.callToFriend = function(idx){
		var friend = $scope.enableList[idx];
		ons.notification.confirm(friend.friendName+"님에게 대화를 신청하시겠습니까?", {
			title  : "대화신청",
			buttonLabels : ["아니오", "예"]
		}).then(
			(value) => {
				if(value){
					var user = $scope.$parent.userProfile;
					var data = {
						'fromNum' 		: 	user['userNum'],
						'fromName'		: 	user['userName'],
						'fromEmail' 	: 	user['userEmail'],
						'toNum'			: 	friend['friendNum'],
						'toName' 		: 	friend['friendName'],
						'toEmail' 		: 	friend['friendEmail']
					};
					var reqData = {
						'type' 			: 	REQUEST,
						'category' 		: 	CALLER,
						'callData' 			: 	data
					};
					port.postMessage(reqData);
					console.log("예");
					applyCall.show();
				}
			}
		);
	}

	$scope.listHide = function() {
		console.log("end CallListController");
		port.onMessage.removeListener(onMessageEvent);
	}

	$scope.listShow = function () {
		port.onMessage.addListener(onMessageEvent);
		var first = {
			'type' 		: 		REQUEST,
			'category' 	: 		GET_ENABLE_CALL_USER,
			'userNum' 	: 		$scope.$parent.userProfile['userNum']
		};
		console.log("CALL_LIST");
		port.postMessage(first);
	}
	$scope.testClick = function(){
		pageManager.pushPage("p2pCall.html");
	}

	// Destroy Controller
	$scope.$on("destroy:callList", function(){
		$scope.listHide();
	});
}]);