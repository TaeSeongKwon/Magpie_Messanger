var sendFileList = angular.module("sendFileList", []);
sendFileList.controller("UsableController", ["$scope", function($scope){
	var kts = document.createElement("input");
	var port = $scope.$parent.myPort;
	var user = $scope.$parent.userProfile;
	var REQUEST_USABLE_FILE_USER = "request:usable_file_user";
	var RESPONSE_USABLE_FILE_USER = "response:usable_file_user";
	var REQUEST_FILE_SEND = "request:file_send";
	var RESPONSE_FILE_SEND = "response:file_send";

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
		var friend = $scope.usableList[idx];
		var msg = friend['friendName']+"("+friend['friendEmail']+") 님에게 파일전송 신청을 하시겠습니까??";
		ons.notification.confirm(msg, { 
			"title" : "파일전송 요청", 
			"buttonLabels" : ["아니오","예"]
		}).then(
			(value) => {
				if(value){
					var hsData = {
						"fromNum"			: 		user['userNum'],
						"fromEmail"			: 		user['userEmail'],
						"fromName" 			: 		user['userName'],
						"toNum"				: 		friend['friendNum'],
						"toEmail"			: 		friend['friendEmail'],
						"toName"			: 		friend['friendName']
					};
					var packet = new SimplePacket(REQUEST_FILE_SEND);
					packet.setBody(hsData);
					port.postMessage(packet);
				}
			},
			(error) => {

			}
		);

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
		}else if(head == RESPONSE_FILE_SEND){
			console.log(RESPONSE_FILE_SEND, body);
			if(body.isSuccess){
				if(body.isAccept){

				}else{
					var hsData = body['hsData'];
					var msg = hsData['toName'] +"("+hsData['toEmail']+")님께서 요청을 거절하셨습니다."
					ons.notification.alert("사용자 목록을 불러오는데 실패했습니다.", {title : "요청결과!"});	
				}
			}else{
				ons.notification.alert(body.msg, {title : "요청실패!"});	
			}
		}
	}
}]);