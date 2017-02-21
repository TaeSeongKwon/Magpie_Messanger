var fileTrans = angular.module("fileTrans", []);
fileTrans.controller("TransController", ["$scope", function($scope){
	var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
	var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
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
	var WEB_RTC_FILE_HANDSHAKE = "webRTC:file_handshake";
	var REQUEST_WEB_RTC_FILE_ROOM = "request:webrtc_file_room";
	var RESPONSE_WEB_RTC_FILE_ROOM = "response:webrtc_file_room";

	var PUSH_WEB_RTC_FILE_ROOM = "push:webrtc_file_room";

	$scope.initController = function(){
		console.log("Initialize TransController!");
		$scope.port = $scope.$root.myPort;
		$scope.port.onMessage.addListener($scope.onMessageEvent);
		$scope.connection = null;
		$scope.isSender = $scope.$root.isSender;
		$scope.show = false;
		if($scope.isSender){
			$scope.hsData = $scope.$root.hsData;
			$scope.select = document.getElementById("selectFile");	
			$scope.select.addEventListener("change", function(e){
				// console.log("event : ", e)
				if(e.target.files.length > 0)
					$scope.file = e.target.files[0];
				$scope.show = true;
				$scope.$apply();
			});
		}
	}
	$scope.destroyController = function(){
		console.log("Destroy TransController!");
		$scope.port.onMessage.removeListener($scope.onMessageEvent);
		if($scope.connection != null){
			$scope.channel.close();
			$scope.connection.close();
			$scope.channel =null;
			$scope.connection =null;
		}
	}
	$scope.loadFile = function(){
		$scope.select.click();
	}
	$scope.sendFile = function(){
		var packet = new SimplePacket(REQUEST_WEB_RTC_FILE_ROOM);
		packet.setBody($scope.hsData);
		$scope.port.postMessage(packet);
	}
	$scope.onMessageEvent = function(data){
		var head = data.head;
		var body = data.body;
		if(head == WEB_RTC_FILE_HANDSHAKE){
			if(body.type == "offer"){
				var sdp = new RTCSessionDescription(body.sdp);
				$scope.addOffer(sdp);
			}else if(body.type == "answer"){
				var sdp = new RTCSessionDescription(body.sdp);
				$scope.addAnswer(sdp);
			}else if(body.type == "ice"){
				if($scope.connection != null){
					var ice = new RTCIceCandidate(body.ice);
					$scope.connection.addIceCandidate(ice);
				}
			}
		}else if(head == RESPONSE_WEB_RTC_FILE_ROOM){
			$scope.channelHash = body['channelHash'];
			$scope.startTrans();
		}else if(head == PUSH_WEB_RTC_FILE_ROOM){
			$scope.channelHash = body['channelHash'];
		}
	}
	$scope.startTrans = function(){
		$scope.connection = new RTCPeerConnection($scope.pc_config);
		$scope.initConnection($scope.connection);
		$scope.connection.createOffer().then(
			(sdp) => {
				console.log("Success > create Offer Description : ", sdp);
				return $scope.connection.setLocalDescription(sdp);
			}
		).then(
			() => {
				console.log("Success > set Local Description");
				var tmp = {
					"type" 		: 		"offer",
					"sdp"		: 		$scope.connection.localDescription
				};
				var packet = new SimplePacket(WEB_RTC_FILE_HANDSHAKE);
				packet.setBody(tmp);
				$scope.port.postMessage(packet);
			}
		).catch(
			(error) => {
				console.log("Fail > create Offer Description  || set localDescription : ");
				console.log(error);
			}
		)
	}
	$scope.addOffer = function(sdp){
		$scope.connection = new RTCPeerConnection($scope.pc_config);
		$scope.initConnection($scope.connection);
		$scope.connection.setRemoteDescription(sdp).then(
			() => {
				console.log("Success > Set Offer Description");
				return $scope.connection.createAnswer();
			}
		).then(
			(sdp) => {
				console.log("Success > Create Answer Description : ", sdp);
				return $scope.connection.setLocalDescription(sdp)
			}
		).then(
			() => {
				console.log("Success > Set Local Description(Answer)");
				var tmp = {
					"type" 		: 		"answer",
					"sdp"		: 		$scope.connection.localDescription
				};
				var packet = new SimplePacket(WEB_RTC_FILE_HANDSHAKE);
				packet.setBody(tmp);
				$scope.port.postMessage(packet);
			}
		).catch(function(error){
			console.log("Fail > SET Offer Description : ",error);
		});
	}
	$scope.addAnswer = function(sdp){
		// $scope.connection = 
		$scope.connection.setRemoteDescription(sdp).then(
			() => {
				console.log("Success > set Answer Description");
			}
		).catch(
			(error) => {
				console.log("Fail > set Answer Description : ", error);
			}
		);
	}
	$scope.initConnection = function(connection){
		connection.onicecandidate = function(evt){
			// send ice
			if(evt.candidate){
				var tmp = {
					"type" 	: "ice",
					"ice" 	: evt.candidate
				};
				var packet = new SimplePacket(WEB_RTC_FILE_HANDSHAKE);
				packet.setBody(tmp);
				$scope.port.postMessage(packet);
			}
		}
		$scope.channel = connection.createDataChannel($scope.channelHash, {reliable:false});

		console.log("****** Channel ******", $scope.channel);
		console.log("****** Connection ******", $scope.connection);

		$scope.setHandleDataChannel($scope.channel);
		connection.ondatachannel = function(evt){
	      console.log("onDataChannel : ", evt.channel);
	      $scope.setHandleDataChannel(evt.channel);
	    }
	}
	$scope.setHandleDataChannel = function (channel){
		console.log("set setHandleDataChannel : ", channel);
		channel.onopen = function(evt){
			console.log("channel Open!");
		}
		channel.onmessage = function(evt){
			console.log("Channel Data Recevie : ",evt.data);
			// alert("Received Message : "+evt.data);
		}
	};
}]);