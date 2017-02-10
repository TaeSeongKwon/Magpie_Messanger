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

var module = angular.module('magpie_front', ['onsen']);
module.controller('AppController', function($scope){ 
	var port = chrome.runtime.connect({name : "magpie_app"});

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
});
