var p2pCall = angular.module("p2pCall", []);
var con;
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
	var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
	var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

	var mediaConfig = { video : true, audio : true };
	var STUN = {
	    urls: 'stun:stun.l.google.com:19302'
	};
	var TURN = {
	   	urls: 'turn:www.project-knock.tk:3478',
		credential: '1q2w3e4r',
		username: 'test12'
	};
	// var DtlsSrtpKeyAgreement = {
 //   		DtlsSrtpKeyAgreement: true
	// };
	// $scope.optional = {
 //  		 optional: [DtlsSrtpKeyAgreement]
	// };
	$scope.pc_config = { 
		"iceServers" 		: 		[STUN, TURN]
	};	
	function p2pPortEvent(data){
		if(data.type == CREATE_CALL_ROOM){
			console.log("create call room start call!");
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
		$scope.port.onMessage.addListener(p2pPortEvent);
		
		if($scope.callData != null){
			var reqData = {
				"type" 		: 			CREATE_CALL_ROOM,
				"callData"  : 			$scope.callData
			};
			console.log("Answer Mode");
			$scope.port.postMessage(reqData);
		}
		
	}
	$scope.p2pDestroy = function(){
		console.log("p2p Call_Destroy!");
		// $scope.port.onMessage.removeListener(p2pPortEvent);
	}
	$scope.startCall = function(){
		if($scope.callData != null)
			$scope.createOfferSDP();
	}

	$scope.createOfferSDP = function(){
		console.log($scope.pc_config);
		console.log($scope.optional);

		$scope.connection = new RTCPeerConnection($scope.pc_config);
		$scope.initCommonWebRTC($scope.connection);
		con = $scope.connection;
		console.log($scope.connection);
		$scope.connection.createOffer().then(
			function (offerSDP){
				console.log("create Offer SDP", offerSDP);
				return $scope.connection.setLocalDescription(offerSDP);
			}
		).then(
			function(){
				console.log("set local SDP (offer)");
				var offerSDP = $scope.connection.localDescription;
				// answer에게 offerSDP보내기
				var data = {
					"type" 		: 		WEB_RTC_CALL,
					"head" 		: 		"offer",
					"sdp" 		: 		offerSDP
				};
				$scope.port.postMessage(data);
			}
		).catch(function(err){
			console.log(err);
		});
		navigator.getUserMedia(mediaConfig, addMeVideo, errorUserMedia);
		
	};

	$scope.initCommonWebRTC = function(connection){
		connection.onicecandidate = function(evt){
			console.log("candidate", evt);
			if(evt.candidate){
				var data = {
					"type" 		: 		WEB_RTC_CALL,
					"head" 		: 		"candidate",
					"ice" 		: 		evt.candidate
				};
				$scope.port.postMessage(data);
			}
		};
		connection.onaddstream = function(stream){
		  	console.log("on add stream", stream);
			var other = document.getElementById('otherDisplay');
			// other.srcObject = stream;
		};
	};

	$scope.addCandidate = function(ice){
		var candidate = new RTCIceCandidate(ice);
		if($scope.connection){
			$scope.connection.addIceCandidate(candidate);
		}
	};
	$scope.addAnswerSDP = function(sdp){
		var answerSDP = new RTCSessionDescription(sdp);
		if($scope.connection){
			$scope.connection.setRemoteDescription(answerSDP).then(
				() => {
					console.log("set Remote SDP (answer)", answerSDP);
				}
			).catch(function (err){
				console.log(err);
			});
		}
	};
	$scope.addOfferSDP = function(sdp){
		$scope.connection = new RTCPeerConnection($scope.pc_config);
		$scope.initCommonWebRTC($scope.connection);
		console.log($scope.connection);
		con = $scope.connection;
		var offerSDP = new RTCSessionDescription(sdp);
		if($scope.connection){
			$scope.connection.setRemoteDescription(offerSDP).then(
				function(){
					console.log("set Remote SDP (offer)", offerSDP);
					return $scope.connection.createAnswer();
				}
			).then(
				function(answerSDP){
					console.log("create Answer SDP", answerSDP);
					return $scope.connection.setLocalDescription(answerSDP);
				}
			).then(
				function(){
					var sdp = $scope.connection.localDescription;
					console.log("set Local SDP (answer)");
			 		console.log(sdp);
			 		// offer에게 answer sdp 보내기
			 		var data = {
						"type" 		: 		WEB_RTC_CALL,
						"head" 		: 		"answer",
						"sdp" 		: 		sdp
					};
					$scope.port.postMessage(data);
				}
			).catch(function(err){
				console.log(err);
			});
		}
		navigator.getUserMedia(mediaConfig, addMeVideo, errorUserMedia);
	};
	function addMeVideo(stream){
		var me = document.getElementById('meDisplay');
		console.log("CREATE LOCAL STREAM");
		me.srcObject= stream;
		$scope.connection.addStream(stream);
	};
	function errorUserMedia(error){
		console.log(error);
	};
	
}]);