// Define Method and Call for Information Hidding
var k;
(function(){
	// Define TYPE
	REQUEST = "request";
	RESPONSE = "response";
	CONNECT = "connect";
	CLOSE_POPUP = "close_popup";
	
	// Define Category
	STATUS = "current_status";
	CAT_LOGIN = "popup_login";
	CAT_JOIN = "popup_join";
	SEARCH_USER = "search_user";

	//ETC...
	USER_ACCOUNT = "account_info";
	LOGIN = "Login";
	NOT_LOGIN = "NotLogin";

	//
	REQUEST_LOGIN = "request:login";
	RESPONSE_LOGIN = "response:login";
	REQUEST_JOIN = "request:join";
	RESPONSE_JOIN = "response:join";
	REQUEST_SEARCH_USER = "request:search_user";
	RESPONSE_SEARCH_USER = "response:search_user";

	// Start Define User Informateion
	var User = function(){
		this.__constructor();
	}
	User.prototype.myStatus;
	User.prototype.accountInfo;
	User.prototype.isOpen;
	User.prototype.__constructor = function(){
		User.prototype.myStatus = NOT_LOGIN;
		User.prototype.accountInfo = null;
		User.prototype.isOpen = false;
	}
	// End Define User Information

	console.log("Start!");
	// Connect to Server on Websocket
	var socket = io.connect("http://localhost:9900");
	var user = new User();
	var myPort;
	// Connect to popup Page
	
	socket.on(CONNECT, function(data){
		console.log("Connect to Websocket");
		// chrome.storage.sync.set({ "account_info" : {id : "kts", pwd : "1234"}}, function(data){});
		chrome.storage.sync.get( USER_ACCOUNT, (data) => {
			console.log("Check "+USER_ACCOUNT+" : ", data);
			// Check User Account
			if(data[USER_ACCOUNT]){ 
				user.accountInfo = data[USER_ACCOUNT];	
				socket.emit(REQUEST_LOGIN, user.accountInfo);
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
					user.myStatus = LOGIN;
				}else {
					chrome.storage.sync.clear();
				}
				myPort.postMessage(data);
			});

			socket.on(RESPONSE_SEARCH_USER, (res) => {
				var data = {
					type	: RESPONSE,
					category : SEARCH_USER,
					isSuccess : res.isSuccess,
					resultList : res.resultList
				}
				myPort.postMessage(data);
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
		if(data.category == STATUS){
			var res = {
				type : RESPONSE,
				category : STATUS,
				status : user.myStatus
			}
			myPort.postMessage(res);
		}else if(data.category == CAT_LOGIN)
			wRequestLogin(data['loginEmail'], data['loginPwd'], client);
		else if(data.category == CAT_JOIN)
			wRequestJoin(data['input_name'], data['input_email'], 
				data['input_pwd1'], data['input_pwd2'], client);
		else if(data.category == SEARCH_USER){
			wRequestSearchUser(data['memberNum'],data['userEmail'], client);
		}
	}

	function wRequestLogin(userID, userPwd, wSocket){
		var userAccount = {
			loginEmail : userID,
			loginPwd : userPwd
		};
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
		wSocket.emit(REQUEST_SEARCH_USER, requestData)
	}
})();