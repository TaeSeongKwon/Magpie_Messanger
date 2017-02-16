var p2pCall = angular.module("p2pCall", []);
p2pCall.controller("CallController", ["$scope", function($scope) {
	console.log("$scope : ", $scope);
	$scope.port = $scope.$root.shareData['myPort'];
	$scope.callData = $scope.$root.shareData['callData'];
	$scope.connection;
	var WEB_RTC_CALL = "webRTC_Call";
	var CREATE_CALL_ROOM = "create_call_room";
	var OFFER = "offer";
	var ANSWER = "answer";
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
	var mediaConfig = { video : true, audio : true };
	var STUN = {
	    urls: 'stun:stun.l.google.com:19302'
	};

	var TURN = {
	    urls: 'turn:www.project-knock.tk:3478',
	    credential: '1q2w3e4r',
	    username: 'test12'
	};

	$scope.pc_config = { 
		"iceServers" 		: 		[STUN, TURN]
	};	
	function p2pPortEvent(data){
		if(data.type == CREATE_CALL_ROOM){
			$scope.startCall();
		}else{
			if(data.head == "candidate"){
				$scope.addCandidate(data.ice);
			}else if(data.head == "offer"){
				$scope.addOfferSDP(data.sdp);
			}else if(data.head == "answer"){
				$scope.addAnswerSDP(data.sdp);
			}
		}
	}

	$scope.p2pInit = function(){
		console.log("p2p Call_Initialize");
		// $scope.port.onMessage.addListener(p2pPortEvent);
		
		navigator.getUserMedia(mediaConfig, addMeVideo, errorUserMedia);
		if($scope.callData != null){
			var reqData = {
				"type" 		: 			CREATE_CALL_ROOM,
				"callData"  : 			$scope.callData
			};
			$scope.port.postMessage(reqData);
		}
		
	}
	$scope.p2pDestroy = function(){
		console.log("p2p Call_Destroy!");
		// $scope.port.onMessage.removeListener(p2pPortEvent);
	}
	$scope.startCall = function(){
		$scope.connection = new RTCPeerConnection($scope.pc_config);
		console.log(connection);

		if($scope.callData != null)
			$scope.myType = OFFER;
		else 
			$scope.myType = ANSWER;

		$scope.initWebRTC($scope);
	}
	$scope.initWebRTC = function(connection){
		connection.onicecandidate = function(evt){
			if(evt.candidate){
				var data = {
					"type" 		: 		WEB_RTC_CALL,
					"head" 		: 		"candidate",
					"ice" 		: 		evt.candidate
				};
				$scope.port.postMessage(data);
			}
		}
		connection.onaddstream = function(stream){
			var other = document.getElementById('otherDisplay');
			other.srcObject = stream;
		}
		if($scope.myType == OFFER){
			connection.createOffer().then(
				(offerSDP) => {
					console.log("create Offer SDP");
					return connection.setLocalDescription(offerSDP);
				}
			).then(
				() => {
					console.log("set local SDP (offer)");
					var offerSDP = connection.localDescription;
					// answer에게 offerSDP보내기
					var data = {
						"type" 		: 		WEB_RTC_CALL,
						"head" 		: 		"offer",
						"sdp" 		: 		$scope.connection.localDescription
					};
					$scope.port.postMessage(data);

				}
			).catch(function(err){
				console.log(err);
			});
		}
	}
	
	$scope.addCandidate = function(ice){
		var candidate = new RTCIceCandidate(ice);
		if($scope.connection){
			$scope.connection.addIceCandidate(candidate);
		}
	}
	$scope.addAnswerSDP = function(sdp){
		var answerSDP = new RTCSessionDescription(sdp);
		if($scope.connection){
			$scope.connection.setRemoteDescription(answerSDP).then(
				() => {
					console.log("set Remote SDP (answer)");
				}
			).catch(function (err){
				console.log(err);
			});
		}
	}
	$scope.addOfferSDP = function(sdp){
		var answerSDP = new RTCSessionDescription(sdp);
		if($scope.connection){
			$scope.connection.setRemoteDescription(answerSDP).then(
				() => {
					console.log("set Remote SDP (offer)");
					return $scope.connection.createAnswer();
				}
			).then(
				(answerSDP) => {
					console.log("create Answer SDP");
					return $scope.connection.setLocalDescription(answerSDP);
				}
			).then(
				() => {
					console.log("set Local SDP (answer)");
			 		console.log($scope.connection.localDescription);
			 		// offer에게 answer sdp 보내기
			 		var data = {
						"type" 		: 		WEB_RTC_CALL,
						"head" 		: 		"answer",
						"sdp" 		: 		$scope.connection.localDescription
					};
					$scope.port.postMessage(data);
				}
			).catch(function(err){
				console.log(err);
			});
		}
	}
	function addMeVideo(stream){
		var me = document.getElementById('meDisplay');
		me.srcObject= stream;
	}
	function errorUserMedia(error){
		console.log(error);
	}
	
}]);