// Define TYPE
REQUEST = "request";
RESPONSE = "response";
CONNECT = "connect";
NOTIFY = "notification";
CLOSE_POPUP = "close_popup";

// Define Category
STATUS = "current_status";
CAT_LOGIN = "popup_login";
CAT_JOIN = "popup_join";
SEARCH_USER = "search_user";
REQUEST_FRIEND = "request_friend_list";
ADD_FRIEND = "add_friend";
ANSWER_REQUEST = "answer_request";
NEW_CHATTING = "new_chatting";

var module = angular.module('magpie_front', ['onsen']);
module.controller('AppController', function($scope){ 
	var port = chrome.runtime.connect({name : "magpie_app"});
	$scope.searchResult =  [];
	$scope.reqFriendList =  [];
	$scope.roomInfo = {};
	port.onMessage.addListener(function(data){
		if(data.type == CONNECT){
			console.log("=== connect background ===");
			port.postMessage({type : REQUEST, category : STATUS});
			// window.onclose = function(){
			// 	port.postMessage({type : CLOSE_POPUP});
			// }
		}else if(data.type == RESPONSE){
			console.log("Response : ", data);
			if(data.category == STATUS){

			}else if(data.category == CAT_JOIN){
				joinModal.hide();
				ons.notification.alert(data.msg, {title : "회원가입" , callback : () => {
					if(data.isSuccess){
						pageManager.popPage();
					}
				}});
				
			}else if(data.category == CAT_LOGIN){
				loginModal.hide();
				if(data.isSuccess){
					$scope.userProfile = data['userProfile'];
					$scope.friendList = data['friendList'];
					
					pageManager.pushPage('mainPage.html');
				}else{
					ons.notification.alert("아이디 또는 비밀번호가 틀리셨습니다.", {title : "로그인 실패"});
				}
			}else if(data.category == SEARCH_USER){
				$scope.searchResult =  [];
				if(data.isSuccess)
					$scope.searchResult = data.resultList;
			}else if(data.category == REQUEST_FRIEND){
				$scope.reqFriendList =  [];
				if(data.isSuccess){
					$scope.reqFriendList =  data.resultList;
				}
				pageManager.pushPage("friendCall.html");
			}else if(data.category == ADD_FRIEND){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "친구추가 실패!"});
				else {
					$scope.searchResult.splice(data.listIdx, 1);
				}
				
			}else if(data.category == ANSWER_REQUEST){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "요청응답 실패!"});
				else {
					$scope.reqFriendList.splice(data.listIdx, 1);
				}
			}else if(data.category == NEW_CHATTING){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "대화방 생성실패!"});
				else {
					$scope.roomInfo = {};
					$scope.roomInfo.title = data.roomName;
					pageManager.replacePage("chattingRoom.html");
				}
			}
			// onData(data);
		}
	});

	$scope.selectMenu = function(menuName){
		sideMenu.content.load(menuName);
	}
	$scope.newAccount = function(newName, newEmail, newPwd1, newPwd2){
		var data = {
			type 		: REQUEST, 
			category 	: CAT_JOIN, 
			input_name 	: newName,
			input_email : newEmail,
			input_pwd1 	: newPwd1,
			input_pwd2 	: newPwd2
		};
		port.postMessage(data);
		joinModal.show();
	}
	$scope.requestLogin = function(loginEmail, loginPwd){
		var data = {
			type : REQUEST, 
			category : CAT_LOGIN, 
			'loginEmail' : loginEmail,
			'loginPwd'	 : loginPwd
		};
		loginModal.show();
		port.postMessage(data);
	}

	$scope.searchUser = function($event, userEmail){
		console.log("event : ", $event, userEmail);
		if($event.key == "Enter"){
			var data = {
				'type' : REQUEST,
				'category' : SEARCH_USER,
				'userEmail' : userEmail,
				'memberNum' : $scope.userProfile['userNum']
			};
			port.postMessage(data);
		}
	}

	$scope.requestAddFriend = function(value, idx){
		ons.notification.confirm(value.mem_name + "님을 친구추가 하시겠습니까?", {title : "친구추가"})
		.then(
			(ok) => {
				if(ok){
					var data = {
						'type' : REQUEST,
						'category' : ADD_FRIEND,
						'fromNum' : $scope.userProfile['userNum'],
						'toNum'		: value.mem_num,
						'listIdx'	: idx
					};
					port.postMessage(data);

					// $scope.searchResult.splice(idx, 1);
				}
			},
			(error) => {
				console.log(error);
			}
		);
	}

	$scope.viewRequestFriend = function(){
		var userNum = $scope.userProfile['userNum'];
		var reqData = {
			"type" 			: 		REQUEST,
			"category" 		: 		REQUEST_FRIEND,
			"userNum"		: 		userNum
		};
		port.postMessage(reqData);
	}

	$scope.searchUserView = function(){
		$scope.searchResult = [];
		pageManager.pushPage('friendRequest.html');
	}

	$scope.reqAnswer = function(idx, requester){
		var name = requester.memName;
		var email = requester.memEmail;
		var num = requester.memNum;
		// alert(name + email + num);
		ons.notification.confirm(name + "("+email+")님의 요청에 응답하시겠습니까?", {
			buttonLabels : ["보류", "수락"],
			title : "요청 응답"
		}).then(
			function(value){
				if(value){
					var reqData = {
						'type'		: 	REQUEST,
						'category'	: 	ANSWER_REQUEST,
						'toNum'		: 	num,
						'fromNum'	: 	$scope.userProfile['userNum'],
						'listIdx'	: 	idx
					};
					port.postMessage(reqData);
				}
			}
		)
	}

	$scope.newChatting = function(){
		var friendList = $scope.friendList;
		for(friend in friendList)
			friend['isCheck'] = false;
		pageManager.pushPage('chattingRoom.html');
	}

	$scope.createNewChatting = function() {
		var checkNumList = [];
		var friendList = $scope.friendList;
		checkNumList.push($scope.userProfile['userNum']);
		for(var idx in friendList){
			console.log("roomName : "+friendList[idx].mem_name, friendList[idx]);
			if(friendList[idx].isCheck) checkNumList.push(friendList[idx].memNum);
		}

		if(checkNumList.length > 1 ){
			var reqData = {
				'type'		: 	REQUEST,
				'category'	: 	NEW_CHATTING,
				'numList'	: 	checkNumList
			};
			port.postMessage(reqData);
		}else{
			ons.notification.alert("대화상대를 선택하여 주세요.", {title : "대화상대 선택"});
		}
	}
});
