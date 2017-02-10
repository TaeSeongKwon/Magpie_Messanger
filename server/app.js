var io 				= require("socket.io")();
//var socketAsPromised = require("socket.io-as-promised");
var passwordHash 	= require("password-hash");
var validator 		= require("validator");
var mysql 			= require("promise-mysql");

var config = {
	host	 		: "localhost",
	user	 		: "root",
	password		: "root",
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
