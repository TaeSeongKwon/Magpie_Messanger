// Define TYPE
REQUEST = "request";
RESPONSE = "response";
CONNECT = "connect";
NOTIFY = "notification";
CLOSE_POPUP = "close_popup";
//
STATE_LOGIN = "Login";
// Define Category
STATUS = "current_status";
CAT_LOGIN = "popup_login";
CAT_JOIN = "popup_join";
SEARCH_USER = "search_user";
REQUEST_FRIEND = "request_friend_list";
ADD_FRIEND = "add_friend";
ANSWER_REQUEST = "answer_request";
NEW_CHATTING = "new_chatting";
GO_CH_ROOM	= "go_to_chatting_room";
SEND_MESSAGE = "send_message";
RECEIVE_MESSAGE = "receive_message";
NEW_ROOM = "new_room";
APPLY_CALL = "apply_call";
ANSWER_CALL = "answer_call";

PUSH_FILE_SEND = "push:file_send";

SimplePacket = function(type){
		this.__constructor(type);
}
SimplePacket.prototype.head = null;
SimplePacket.prototype.body;

SimplePacket.prototype.setBody = function(obj){
	this.body = obj;
}
SimplePacket.prototype.getBody = function(){
	return this.body;
}
SimplePacket.prototype.getHead = function(){
	return this.head;
}
SimplePacket.prototype.__constructor = function(type){
	this.head = type;
}


var module = angular.module('magpie_front', ['onsen', 'callList', "p2pCall", "sendFileList"]);
module.controller('AppController', function($scope, $timeout){ 
	var port = chrome.runtime.connect({name : "magpie_app"});
	$scope.myPort = port;
	$scope.searchResult =  [];
	$scope.reqFriendList =  [];
	$scope.roomInfo = {};
	$scope.messageCollection = new Map();
	// $scope.messageRoom = new Map();

	port.onMessage.addListener(function(data){
		if(data.head == PUSH_FILE_SEND){
			var body = data.body;
			console.log(PUSH_FILE_SEND,body);
			return ;
		}
		if(data.type == CONNECT){
			console.log("=== connect background ===");
			port.postMessage({type : REQUEST, category : STATUS});
			// window.onclose = function(){
			// 	port.postMessage({type : CLOSE_POPUP});
			// }
		}else if(data.type== NOTIFY){
			console.log("NOTIFY : ", data);
			if(data.category == RECEIVE_MESSAGE){
				var info = data.messageInfo;
				var tmp = {
					'cm_num' 		:  			0,
					'cm_text' 		: 			info.message,
					'cm_date' 		: 			info.sendDate,
					'mem_name'		: 			info.userName,
					'mem_num' 		: 			info.userNum,
					'room_num'		: 			info.roomNum,
					'user_type' 	: 			0
				};
				$scope.messageCollection.get(info.roomHash).push(tmp);
				$scope.$apply();
				$timeout(function(){
					$('.page__content').animate({scrollTop: $('.message.list').height()}, 300);
				});
				// $scope.roomInfo.messages.push(tmp);
				// $scope.messageText = "";
				
			}else if(data.category == NEW_ROOM){
				var room = {					
					"mem_num" 			: 		data.mem_num,
					"room_hash" 		: 		data.room_hash,
					"room_name" 		: 		data.room_name,
					"room_num" 			: 		data.room_num
				};
				$scope.chRoomList.unshift(room);
				$scope.$apply();
			}else if(data.category == APPLY_CALL){
				var callData = data.pushData;
				var msg = callData['fromName']+"("+callData['fromEmail']+")님의 대화신청입니다. 응하시겠습니까??";
				ons.notification.confirm(msg, {
					title : "알림 : 대화신청",
					buttonLabels : ["거절", "수락"]
				}).then(
					(value) => {
						var answerData = {
							'type' 		  : 	REQUEST,
							'category' 	  : 	ANSWER_CALL,
							'callData' 	  : 	callData
						};
						if(value){
							// 승낙할 경우
							answerData.answer = true;
							$scope.$root.shareData = {
								'myPort' 		: 		port,
								'callData'		: 		null
							};
							pageManager.pushPage("p2pCall.html");
							port.postMessage(answerData);
						}else{
							// 거절할 경우
							answerData.answer = false;
							port.postMessage(answerData);
						}
						
					}
				)
			}
		}else if(data.type == RESPONSE){
			console.log("Response : ", data);
			if(data.category == STATUS){
				if(data.status != STATE_LOGIN){
					setTimeout(function(){pageManager.pushPage("loginPage.html");}, 700);
				}
			}else if(data.category == CAT_JOIN){
				joinModal.hide();
				ons.notification.alert(data.msg, {title : "회원가입" , callback : () => {
					if(data.isSuccess){
						pageManager.popPage();
					}
				}});
		
			}else if(data.category == CAT_LOGIN){
				if(loginModal != undefined) loginModal.hide();
				if(data.isSuccess){
					$scope.userProfile = data['userProfile'];
					$scope.friendList = data['friendList'];
					$scope.chRoomList = data['chRoomList'];
					setTimeout(function(){pageManager.pushPage('mainPage.html');}, 700);
				}else{
					ons.notification.alert("아이디 또는 비밀번호가 틀리셨습니다.", {title : "로그인 실패"});
				}
			}else if(data.category == SEARCH_USER){
				$scope.searchResult =  [];
				if(data.isSuccess)
					$scope.searchResult = data.resultList;
				$scope.$apply();

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
					$scope.$apply();
				}
				
			}else if(data.category == ANSWER_REQUEST){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "요청응답 실패!"});
				else {
					$scope.reqFriendList.splice(data.listIdx, 1);
					$scope.$apply();
				}
			}else if(data.category == NEW_CHATTING){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "대화방 생성실패!"});
				else {
					$scope.roomInfo = {};
					$scope.roomInfo.title = data.roomName;
					$scope.roomInfo.hash = data.roomHash;
					$scope.roomInfo.roomNum = data.roomNum;
					$scope.roomInfo.messages = [];
					$scope.messageCollection.set(data.roomHash, $scope.roomInfo.messages);
					var room = {
						"room_num"			:  		data.roomNum,
						"room_hash" 		: 		data.roomHash,
						"room_name"	 		: 		data.roomName,
						"mem_num" 			: 		$scope.userProfile['userNum']
					};
					$scope.chRoomList.unshift(room);

					pageManager.replacePage("chattingRoom.html");
				}
			}else if(data.category == GO_CH_ROOM){
				if(!data.isSuccess)
					ons.notification.alert(data.msg, {title : "대화목록 불러오기 실패!"});
				else {
					var info = $scope.chRoomList[data.listIdx];
					$scope.roomInfo = {};
					$scope.roomInfo.title = info['room_name'];
					$scope.roomInfo.hash = info['room_hash'];
					$scope.roomInfo.roomNum = info['room_num'];
					$scope.roomInfo.messages = data['messageList'];
					
					$scope.messageCollection.set(info['room_hash'], data['messageList']);
					pageManager.pushPage("chattingRoom.html").then(
						(success) => {
							$('.page__content').animate({scrollTop: $('.message.list').height()}, 0);
						}
					);
				}
			}else if(data.category == SEND_MESSAGE){
				if(!data.isSuccess){
					ons.notification.alert(data.msg, {title : "메시지 전송 실패!"});
				}else{
					var info = data.messageInfo;
					var tmp = {
						'cm_num' 		:  			0,
						'cm_text' 		: 			info.message,
						'cm_date' 		: 			info.sendDate,
						'mem_name'		: 			info.userName,
						'mem_num' 		: 			info.userNum,
						'room_num'		: 			info.roomNum,
						'user_type' 	: 			1
					};
					console.log("SCOPE", $scope.messageCollection);
					// $scope.roomInfo.messages.push(tmp);
					$scope.messageCollection.get(info.roomHash).push(tmp);
					$scope.$apply();
					$timeout(function(){
						$('.page__content').animate({scrollTop: $('.message.list').height()}, 300);
					});
					// $scope.messageText = "";
				}
			}
			// onData(data);
		}
	});

	$scope.selectMenu = function(menuName){
		var prePage = sideMenu.content.page;
		if(prePage == "callList.html"){
			console.log("dest");
			$scope.$broadcast("destroy:callList", {});
		}
		sideMenu.content.load(menuName);
		
		// console.log(sideMenu.content);
		// sideMenu.content.on("destroy", function(){
		// 	console.log(this);
		// 	console.log("destroy");
		// });
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
		for(var idx in friendList)
			friendList[idx]['isCheck'] = false;
		pageManager.pushPage('newChatting.html');
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

	$scope.goChattingRoom = function(roomNum,listIdx){
		var reqData = {
			'type' 		: REQUEST,
			'category' 	: GO_CH_ROOM,
			'roomNum' 	: roomNum,
			'userNum' 	: $scope.userProfile['userNum'],
			'listIdx'	: listIdx
		};
		port.postMessage(reqData);
	}

	$scope.roomKeyEvent = function($event, hash, roomNum, messageText){

		if($event.key == "Enter"){
			$scope.sendMessage(hash, roomNum, messageText);
			this.messageText = "";
		}
	}
	$scope.sendMessage = function(hash, roomNum, messageText){
		var userNum = $scope.userProfile['userNum'];
		var userName = $scope.userProfile['userName'];
		
		var reqData = {
			'type' 			: 			REQUEST,
			'category' 		: 			SEND_MESSAGE,
			'roomHash' 		: 			hash,
			'roomNum' 		: 			roomNum, 
			'userNum' 		: 			userNum,
			'userName' 		: 			userName,
			'message' 		: 			messageText
		};
		port.postMessage(reqData);
	}


});
