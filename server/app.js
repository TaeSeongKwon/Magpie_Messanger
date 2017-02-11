var io 				= require("socket.io")();
//var socketAsPromised = require("socket.io-as-promised");
var passwordHash 	= require("password-hash");
var validator 		= require("validator");
var mysql 			= require("promise-mysql");
var crypto			= require("crypto");

var config = {
	host	 		: "localhost",
	user	 		: "root",
	password		: "1q2w3e4r",
	database		: "MAGPIE_DB"
};
var port = 9900;

// Define Communication Event Name
REQUEST_LOGIN = "request:login";
RESPONSE_LOGIN = "response:login";
REQUEST_JOIN = "request:join";
RESPONSE_JOIN = "response:join";
REQUEST_SEARCH_USER = "request:search_user";
RESPONSE_SEARCH_USER = "response:search_user";
W_REQUEST_FRIEND_LIST = "request:friend_list";
W_RESPONSE_FRIEND_LIST = "request:friend_list";
REQUEST_ADDFRIEND = "request:add_friend";
RESPONSE_ADDFRIEND = "response:add_friend";
REQUEST_ANS_REQUEST = "request:answer_request";
RESPONSE_ANS_REQUEST = "response:answer_request";

REQUEST_NEWCHATTING = "request:new_chatting";
RESPONSE_NEWCHATTING = "response:new_chatting";
//io.use(socketAsPromised());
io.listen(port);

console.log("============ START MAGPIE_MESSAGER SERVER ============");
console.log("PORT : ", port);
io.on("connection", (socket) => {
	console.log("request Connect Client!!")	;
	socket.on(REQUEST_LOGIN, (data) => {
		var user_id = data['loginEmail'];
		var user_pwd = data['loginPwd'];
		var connection;
		var isError = false;
		var resData = {
			isSuccess : true
		};
		isError = mysql.createConnection(config).then(
			function(conn){
				var selectQuery = "SELECT * FROM MEMBER WHERE mem_email = ?";
				connection = conn;
				return connection.query(selectQuery, [user_id]);
			}
		).then(
			function(result){
				console.log(result);
				if(result.length > 0){
					console.log(user_pwd, result[0]["mem_password"]);
					if(!passwordHash.verify(user_pwd, result[0]["mem_password"])){
						resData.isSuccess = false;
						socket.emit(RESPONSE_LOGIN, resData);
					}else{ 
						var data = {
							'userNum'	: result[0]['mem_num'],
							'userEmail' : result[0]['mem_email'],
							'userName'	: result[0]['mem_name']
						};
						resData['userProfile'] = data;
						loginMember(result[0]['mem_num'],resData);
					}
				}else{
					resData.isSuccess = false;
					socket.emit(RESPONSE_LOGIN, resData);
				}

				connection.end();
			},
			function(error){
				resData.isSuccess = false;
				socket.emit(RESPONSE_LOGIN, resData);
				connection.end();	
			}
		);
	});

	// Event : Receive request add Account 
	socket.on(REQUEST_JOIN, (data)=>{
		var connection;
		var inputEmail 	= data['inputEmail'];
		var inputName 	= data['inputName'];
		var inputPwd1	= data['inputPwd1'];
		var inputPwd2	= data['inputPwd2'];
		var resData 	= {
			isSuccess	: true,
			msg 		: "회원가입에 성공하였습니다."
		}

		// 클라이언트로부터 받은 데이터가 이상이 없는지 체크
		if(validator.isEmpty(inputName)){
			resData.isSuccess = false;
			resData.msg = "이름을 입력하세요.";
		}else if(!validator.isEmail(inputEmail)){
			resData.isSuccess = false;
			resData.msg = "이메일을 입력하세요.";
		}else if(!validator.isLength(inputPwd1, {min : 6, max : 20})){
			resData.isSuccess = false;
			resData.msg = "비밀번호는 최소 6 최대 20자리입니다.";
		}else if(inputPwd1 != inputPwd2){
			resData.isSuccess = false;
			resData.msg = "비밀번호가 일치하지 않습니다. 비밀번호를 확인하세요";
		}

		// 데이터가 이상이 있다면 응답
		if(!resData.isSuccess){
			socket.emit(RESPONSE_JOIN, resData);
		}else{
			// 가입되어 있는 계정인지 확인
			mysql.createConnection(config).then(
				(conn) => {
					var selectQuery = "SELECT if(COUNT(*) > 0, true, false) AS isFind FROM MEMBER WHERE mem_email = ?";
					connection = conn;	
					return connection.query(selectQuery, [inputEmail]);
				}
			).then(
				function(result){
					console.log(result);
					// 이미 가입한 계정이라면
					if(result[0]['isFind']){
						resData.isSuccess = false;
						resData.msg = "이미 가입하신 계정입니다.";
						socket.emit(RESPONSE_JOIN, resData);
						connection.end();
					// 가입되지 않은 계정이면 회원을 추가한다.
					}else addMember(inputName, inputEmail, inputPwd1, resData);
				},
				// 쿼리 오류를 담당하는 메소드
				function(error)	{
					resData.isSuccess = false;
					resData.msg = "회원가입에 실패하였습니다. 관리자에게 문의하세요";
					socket.emit(RESPONSE_JOIN, resData);
				}
			);
		}
	});

	socket.on(REQUEST_SEARCH_USER, (reqData) => {
		var inputEmail = reqData['userEmail'];
		var memberNum = reqData['memNum'];
		console.log(REQUEST_SEARCH_USER, reqData);
		var resData = {
			isSuccess : true,
			resultList : null,
		}
		var connection;
		mysql.createConnection(config).then(
			(conn) => {
				var selectQuery = "SELECT mem_num, mem_name, mem_email FROM MEMBER WHERE mem_num Not in(SELECT friendNum FROM friend_list_view WHERE memberNum = ?) AND mem_num != ? AND mem_email = ? ";
				connection = conn;
				return connection.query(selectQuery, [memberNum, memberNum, inputEmail]);
			}
		).then(
			(result) => {
				resData.resultList = result;
				socket.emit(RESPONSE_SEARCH_USER, resData);
				connection.end();
			},
			(error) => {
				resData.isSuccess = false;
				socket.emit(RESPONSE_SEARCH_USER, resData);
				connection.end();
			}
		)
	});	
	socket.on(W_REQUEST_FRIEND_LIST, (req) => {
		var userNum = req.userNum;
		var connection;
		var resData = {
			isSuccess : true,
			result 		: []
		};
		mysql.createConnection(config).then(
			(conn) => {
				var selectQuery = "SELECT M.mem_num AS memNum, M.mem_name AS memName, M.mem_email AS memEmail FROM FRIEND AS F LEFT OUTER JOIN MEMBER AS M ON F.from_num = M.mem_num  WHERE F.from_num NOT IN (SELECT friend_num FROM friend_list_view WHERE memberNum = ?) AND F.to_num = ? AND F.is_interception = false";
				connection = conn;
				return connection.query(selectQuery, [userNum, userNum]);
			}
		).then(
			(result) => {
				resData.result = result;
				socket.emit(W_RESPONSE_FRIEND_LIST, resData);
				connection.end();
			},
			(error) => {
				resData.isSuccess = false;
				socket.emit(W_RESPONSE_FRIEND_LIST, resData);
				connection.end();
			}
		)
	});

	socket.on(REQUEST_ADDFRIEND, (req) => {
		var connection;
		var resData = {
			'isSuccess' : true,
			'listIdx' : req.listIdx
		};
		mysql.createConnection(config).then(
			(conn) => {
				var insertQuery = "INSERT INTO FRIEND (`from_num`, `to_num`) VALUES (? , ?)";
				connection = conn;
				return connection.query(insertQuery,[req.fromNum, req.toNum]);
			}
		).then(
			(result) => {
				socket.emit(RESPONSE_ADDFRIEND, resData);
				connection.end();
			},
			(error) => {
				resData.isSuccess = false;
				resData.msg = "문제가 발생하여 친구를 추가할 수 없습니다. 관리자에게 문의하세요.";
				socket.emit(RESPONSE_ADDFRIEND, resData);
				connection.end();
			}
		)
	});

	socket.on(REQUEST_ANS_REQUEST, (req) => {
		var connection;
		var resData = {
			isSuccess : true,
			listIdx		: req.listIdx

		};
		mysql.createConnection(config).then(
			(conn)	=> {
				var insertQuery = "INSERT INTO FRIEND (`from_num`, `to_num`) VALUES (? , ?)";
				connection = conn;
				return connection.query(insertQuery, [req.fromNum, req.toNum]);
			}
		).then(
			(result) => {
				socket.emit(RESPONSE_ANS_REQUEST, resData);
			},
			(error)	=> {
				resData.isSuccess = false;
				resData.msg	= "문제가 발생하여 응답할 수 없습니다. 관리자에게 문의하세요";
				socket.emit(RESPONSE_ANS_REQUEST, resData);
				connection.end();
			}
		)
	});

	socket.on(REQUEST_NEWCHATTING, (req) => {
		var numList = req.numList;
		var crrTime = new Date();
		var roomName = "Room_" + crrTime;
		var encoder = crypto.createHash('sha1');
		encoder.update(roomName);
		var hashName = encoder.digest("hex");
		var connection;
		var resData = {
			isSuccess : true
		};

		mysql.createConnection(config).then(
			(conn) => {
				var insertQuery = "INSERT INTO CHATTING_ROOM (`room_name`) VALUES ( ? )";
				connection = conn;
				return connection.query(insertQuery, [hashName]);
			}	
		).then(
			(result) => {
				var insertId = result.insertId;
				console.log("SUCCESS! : ", result);
				console.log("room_num : ", result.insertId);
				setRoomName(insertId, hashName, numList, socket, resData);
				connection.end();
			},
			(error) => {
				resData.isSuccess = false;
				console.log(error);
				resData.msg = "대화방을 생성하지 못했습니다. error -1";
				socket.emit(RESPONSE_NEWCHATTING, resData);
				connection.end();
			}
		)
	});

	function setRoomName(roomId, roomHash, numList, wSocket, resData){
		var connection;
		mysql.createConnection(config).then(
			(conn) => {
				var selectQuery = "SELECT mem_name FROM MEMBER WHERE mem_num IN ( ? )";
				connection = conn;
				return connection.query(selectQuery, [numList]);
			}
		).then(
			(result) => {
				var roomName = "";
				for(var idx = 0; idx < result.length; idx++){
					roomName += result[idx]['mem_name'];
					if(idx+1 < result.length) roomName += ", ";
				}
				connection.end();
				insertRoomMember(roomId, roomHash, roomName, numList, wSocket, resData);
			},
			(error) => {
				resData.isSuccess = false;
				console.log(error);
				resData.msg = "대화방을 생성하지 못했습니다. error -2";
				socket.emit(RESPONSE_NEWCHATTING, resData);
				connection.end();
			}
		);
	}
	function insertRoomMember(roomId, roomHash, roomName, numList, wSocket, resData){
		var connection;
		mysql.createConnection(config).then(
			(conn) => {
				var insertList = [];
				for(var idx in numList) 
					insertList.push([roomName, roomId, numList[idx]]);
				var insertQuery = "INSERT INTO ROOM_MEMBER (`rm_name`,`room_num`,`mem_num`) VALUES ?";
				connection = conn;
				return connection.query(insertQuery, [insertList]);
			}
		).then(
			(result) => {
				resData.roomName = roomName;
				resData.roomHash = roomHash;
				socket.emit(RESPONSE_NEWCHATTING, resData);
				connection.end();
			},
			(error) => {
				resData.isSuccess = false;
				resData.msg = "대화방을 생성하지 못했습니다. error -3";
				console.log(error);console.log(error);
				socket.emit(RESPONSE_NEWCHATTING, resData);
				connection.end();
			}
		);
	}
	// mysql.createConnection(config).then(
	// 	function(conn){
	// 		var selectQuery = "SELECT * FROM MEMBER";
	// 		return conn.query(selectQuery);
	// 	}
	// ).then(
	// 	function(rows){
	// 		console.log("SUCCESS : ", rows);
	// 	},
	// 	function(error){
	// 		console.log("ERROR : ", error);
	// 	}
	// );

	// 새로운 계정을 추가하는 메소드
	function addMember(inputName, inputEmail, inputPwd, resData){
		var connection;
		mysql.createConnection(config).then(
			(conn) => {
				connection = conn;
				console.log(inputName + inputEmail, inputPwd);
				var insertQuery = "INSERT INTO MEMBER(`mem_name`, `mem_email`,`mem_password`) VALUES (?, ?, ?)";
				return connection.query(insertQuery, [inputName, inputEmail, passwordHash.generate(inputPwd)]);
			}
		).then(
			(res) => {
				console.log("INSERT SUCCESS! : ", res);
				socket.emit(RESPONSE_JOIN, resData);
				connection.end();
			},	
			(err) => {
				resData.isSuccess = false;
				resData.msg = "회원가입에 실패하였습니다. 관리자에게 문의하세요.";
				console.log("INSERT QUERY ERROR : ", err);
				socket.emit(RESPONSE_JOIN, resData);
				connection.end();
			}
		)
	}
	// 로그인 성공 시 전달하고자하는 정보를 조회하여 보낸다.
	function loginMember(memberNum,res){
		var connection;

		mysql.createConnection(config).then(
			(conn) => {
				var selectQuery = "SELECT mem_num AS memNum, mem_name AS memName, mem_email AS memEmail FROM FRIEND AS F LEFT OUTER JOIN MEMBER AS M ON F.to_num = M.mem_num WHERE F.from_num = ? AND F.is_interception = false;"
				connection = conn;
				return connection.query(selectQuery, [memberNum]);
			}
		).then(
			(result) => {
				res['friendList'] = result;
				socket.emit(RESPONSE_LOGIN, res);	
			},
			(error) => {
				res['friendList'] = null;
				socket.emit(RESPONSE_LOGIN, res);	
			}
		);
		
		// var connection;
		// mysql.createConnection()
	}
});
