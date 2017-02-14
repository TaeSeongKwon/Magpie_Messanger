// Define Method and Call for Information Hidding
var k;
(function(){
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
	GO_CH_ROOM	= "go_to_chatting_room";
	SEND_MESSAGE = "send_message";
	RECEIVE_MESSAGE = "receive_message";
	NEW_ROOM = "new_room";

	//ETC...
	USER_ACCOUNT = "account_info";
	LOGIN = "Login";
	NOT_LOGIN = "NotLogin";

	//서버와 통신을 위한 이벤트명 정의
	//로그인 요청, 응답 
	REQUEST_LOGIN = "request:login";
	RESPONSE_LOGIN = "response:login";
	// 회원가입 요청, 응답
	REQUEST_JOIN = "request:join";
	RESPONSE_JOIN = "response:join";
	// 사용자 검색 요청, 응답
	REQUEST_SEARCH_USER = "request:search_user";
	RESPONSE_SEARCH_USER = "response:search_user";
	// 친구 목록 요청, 응답
	W_REQUEST_FRIEND_LIST = "request:friend_list";
	W_RESPONSE_FRIEND_LIST = "request:friend_list";
	// 친구 추가 요청, 응답 
	REQUEST_ADDFRIEND = "request:add_friend";
	RESPONSE_ADDFRIEND = "response:add_friend";

	REQUEST_ANS_REQUEST = "request:answer_request";
	RESPONSE_ANS_REQUEST = "response:answer_request";

	REQUEST_NEWCHATTING = "request:new_chatting";
	RESPONSE_NEWCHATTING = "response:new_chatting";

	REQUEST_GO_CH_ROOM = "request:go_chatting_room";
	RESPONSE_GO_CH_ROOM = "response:go_chatting_room";
	
	REQUEST_SEND_MESSAGE = "request:send_message";
	RESPONSE_SEND_MESSAGE = "response:send_message";

	NEW_MESSAGE = "push:new_message";
	NEW_CHATTING_ROOM = "push:new_chatting_room";
	REQUEST_JOIN_ROOM = "request:join_hash_room";

	// Start Define User Informateion
	var User = function(){
		this.__constructor();
	}
	User.prototype.myStatus;
	User.prototype.accountInfo;
	User.prototype.isOpen;
	User.prototype.infoData;
	User.prototype.__constructor = function(){
		User.prototype.myStatus = NOT_LOGIN;
		User.prototype.accountInfo = null;
		User.prototype.isOpen = false;
	}
	// End Define User Information

	console.log("Start!");
	// Connect to Server on Websocket
	var socket = io.connect("http://www.project-knock.tk:9900");
	var user = new User();
	var myPort;
	// Connect to popup Page
	
	socket.on(CONNECT, function(data){
		console.log("Connect to Websocket");
		// chrome.storage.sync.set({ "account_info" : {id : "kts", pwd : "1234"}}, function(data){});
		chrome.storage.sync.get( USER_ACCOUNT, (data) => {
			console.log("Check "+USER_ACCOUNT+" : ", data);
			// Check User Account
			if(data[USER_ACCOUNT] != null){ 
				console.log("Initialize User Info");
				user.accountInfo = data[USER_ACCOUNT];	
				// socket.emit(REQUEST_LOGIN, user.accountInfo);
			}
			// define server and background communication
			socket.on(RESPONSE_JOIN, (res) => {
				var data = {
					type 		:  RESPONSE,
					category 	: CAT_JOIN,
					isSuccess 	: res.isSuccess,
					msg			: res.msg
				};
				myPort.postMessage(data);
			});

			//RESPONESE LOGIN
			socket.on(RESPONSE_LOGIN, (res) => {
				console.log("=> Response|login : ", data);
				var data = {
					type 		:  RESPONSE,
					category 	: CAT_LOGIN,
					isSuccess 	: res.isSuccess,
				};
				if(res.isSuccess){
					data['userProfile'] = res['userProfile'];
					data['friendList'] = res['friendList'];
					data['chRoomList'] = res['chRoomList'];
					// user.InfoData {
					// 	'userProfile' 		: 	res['userProfile'],
					// 	'friendList' 		: 	res['friendList'],
					// 	'chRoomList' 		: 	res['chRoomList']
					// };
					user.myStatus = LOGIN;
				}else {
					chrome.storage.sync.clear();
					user.accountInfo = null;
				}
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_SEARCH_USER, (res) => {
				console.log(REQUEST_SEARCH_USER, res);
				var data = {
					type	: RESPONSE,
					category : SEARCH_USER,
					isSuccess : res.isSuccess,
					resultList : res.resultList
				}
				myPort.postMessage(data);
			});

			socket.on(W_RESPONSE_FRIEND_LIST, (res) => {
				var data = {
					type	: RESPONSE,
					category : REQUEST_FRIEND,
					isSuccess : res.isSuccess,
					resultList : res.result
				}
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_ADDFRIEND,  (res) => {
				var data = {
					type	: RESPONSE,
					category : ADD_FRIEND,
					isSuccess : res.isSuccess,
					listIdx : res.listIdx
				};
				if(!data.isSuccess) data.msg = res.msg;
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_ANS_REQUEST, (res) => {
				var data = {
					type	: RESPONSE,
					category : ANSWER_REQUEST,
					isSuccess : res.isSuccess,
					listIdx : res.listIdx
				};
				if(!data.isSuccess) data.msg = res.msg;
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_NEWCHATTING, (res) => {
				var data = {
					type	: RESPONSE,
					category : NEW_CHATTING,
					isSuccess : res.isSuccess,
				};
				if(!data.isSuccess) data.msg = res.msg;
				else {
					data.roomName = res.roomName;
					data.roomHash = res.roomHash;
					data.roomNum = res.roomNum;
				}
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_GO_CH_ROOM, (res) => {
				var data = {
					type	: RESPONSE,
					category : GO_CH_ROOM,
					isSuccess : res.isSuccess,
				};
				if(!data.isSuccess) data.msg= res.msg;
				else{
					data.listIdx = res.listIdx;
					data.messageList = res.messageList;
				}
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_SEND_MESSAGE, (res) => {
				var data = {
					type 		 : 		RESPONSE,
					category 	 : 		SEND_MESSAGE,
					isSuccess 	 : 		res.isSuccess
				};
				if(!data.isSuccess) data.msg = res.msg;
				else data.messageInfo = res.messageInfo;

				myPort.postMessage(data);
			});

			socket.on(NEW_MESSAGE, (pushData) => {
				console.log(data);
				// data.user_type = 0;
				var data = {
					type 		 : 		NOTIFY,
					category 	 : 		RECEIVE_MESSAGE,
					messageInfo  : 		pushData
				};
				myPort.postMessage(data);
			});

			socket.on(NEW_CHATTING_ROOM, (pushData) => {
				pushData['type'] 		= NOTIFY;
				pushData['category'] 	= NEW_ROOM;
				socket.emit(REQUEST_JOIN_ROOM, {'roomHash' : pushData['room_hash']});
				myPort.postMessage(pushData);
			});
			// Define PopupPage OnConnect Event
			chrome.runtime.onConnect.addListener(function(port){
				if(port.name == "magpie_app"){
					myPort = port;
				 	init(socket, port);
				}
			});
			// chrome.runtime
		});	
	});

	// Initialize Communication Between Background and Popup Page
	function init(client, port){ 
		/*
			port : communication to background and popup
			client : communication to Server
		*/
		console.log("connect!", user.myStatus);
		user.isOpen = true;

		// define background and popup communication 
		myPort.postMessage({type : CONNECT, isSuccess : true});
		myPort.onMessage.addListener(function(data){
			if(data.type == REQUEST){
				requestFunction(data,client);
			}else if(data.type == CLOSE_POPUP){
				// console.log("close window");
				user.isOpen = false;
			}
		});
		myPort.onDisconnect.addListener(() => {
			console.log("close");
			user.isOpen = false;
		//	eventDelete()
		});
	}

	function requestFunction(data, client){
		var userEmail;
		var userPwd;
		if(data.category == STATUS){
			if(user.myStatus == NOT_LOGIN){
				if(user.accountInfo == null){
					var res = {
						type : RESPONSE,
						category : STATUS,
						status : user.myStatus
					}
					myPort.postMessage(res);
				}else{
					userEmail = user.accountInfo['userEmail'];
					userPwd = user.accountInfo['userPwd'];
					wRequestLogin(userEmail, userPwd, client);
				}	
			}else{
				console.log("user Information : ", user.accountInfo);
				userEmail = user.accountInfo['loginEmail'];
				userPwd = user.accountInfo['loginPwd'];
				wRequestLogin(userEmail, userPwd, client);
			}
		}else if(data.category == CAT_LOGIN)
			wRequestLogin(data['loginEmail'], data['loginPwd'], client);
		else if(data.category == CAT_JOIN)
			wRequestJoin(data['input_name'], data['input_email'], 
				data['input_pwd1'], data['input_pwd2'], client);
		else if(data.category == SEARCH_USER){
			wRequestSearchUser(data['memberNum'],data['userEmail'], client);
		}else if(data.category == REQUEST_FRIEND){
			wRequestFriendList(data['userNum'], client);
		}else if(data.category == ADD_FRIEND){
			wRequestAddFriend(data['fromNum'], data['toNum'], data['listIdx'], client);
		}else if(data.category == ANSWER_REQUEST){
			wRequestAnswerRequest(data['fromNum'], data['toNum'], data['listIdx'],client);
		}else if(data.category == NEW_CHATTING){
			wRequestNewChatting(data.numList, client);
		}else if(data.category == GO_CH_ROOM){
			wRequestGoChattingRoom(data['roomNum'], data['userNum'], data['listIdx'], client);
		}else if(data.category == SEND_MESSAGE) {
			console.log("SEND MESSAGE");
			wRequestSendMessage(data['roomHash'], data['roomNum'], data['userNum'], data['userName'], data['message'], client);
		}
	}

	function wRequestLogin(userID, userPwd, wSocket){
		var userAccount = {
			loginEmail : userID,
			loginPwd : userPwd
		};
		chrome.storage.sync.set({ "account_info" : userAccount}, function(data){
			console.log("data : ", data);
		});
		user.accountInfo = userAccount;
		console.log("data : ",userAccount);
		wSocket.emit(REQUEST_LOGIN, userAccount);
	}
	function wRequestJoin(inputName, inputEmail, inputPwd1, inputPwd2, wSocket){
		var inputData = {
			'inputName' 	: inputName,
			'inputEmail' 	: inputEmail,
			'inputPwd1' 	: inputPwd1,
			'inputPwd2' 	: inputPwd2
		};
		console.log("data : ", inputData);
		wSocket.emit(REQUEST_JOIN, inputData);
	}

	function wRequestSearchUser(memberNum, userEmail, wSocket){
		var requestData = {
			'memNum' : memberNum,
			'userEmail' : userEmail
		};
		console.log(REQUEST_SEARCH_USER, requestData);
		wSocket.emit(REQUEST_SEARCH_USER, requestData);
	}

	function wRequestFriendList(userNum, wSocket){
		var requestData = {
			'userNum'	: userNum
		};
		wSocket.emit(W_REQUEST_FRIEND_LIST, requestData);
	}

	function wRequestAddFriend(fromNum, toNum, listIdx, wSocket){
		var requestData = {
			'fromNum'		: fromNum,
			'toNum'			: toNum,
			'listIdx'		: listIdx
		};
		wSocket.emit(REQUEST_ADDFRIEND, requestData);
	}

	function wRequestAnswerRequest(fromNum, toNum, listIdx, wSocket){
		var requestData = {
			'fromNum'		: fromNum,
			'toNum'			: toNum,
			'listIdx'		: listIdx
		};
		wSocket.emit(REQUEST_ANS_REQUEST, requestData);
	}
	function wRequestNewChatting(numList, wSocket){
		wSocket.emit(REQUEST_NEWCHATTING, {'numList' : numList});
	}
	function wRequestGoChattingRoom(roomNum, userNum, listIdx,wSocket){
		var requestData = {
			'roomNum'		: 		roomNum,
			'userNum'		: 		userNum,
			'listIdx'		: 		listIdx
		};
		wSocket.emit(REQUEST_GO_CH_ROOM, requestData);
	}
	function wRequestSendMessage(roomHash, roomNum, userNum, userName, message, wSocket){
		var requestData = {
			'roomHash' 			: 		roomHash,
			'roomNum'			: 		roomNum,
			'userNum' 			: 		userNum,
			'userName'			: 		userName,
			'message'			: 		message
		};

		wSocket.emit(REQUEST_SEND_MESSAGE, requestData);
	}

})();