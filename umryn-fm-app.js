(function() {
    'use strict';

    var app = angular
        .module('umrynFmApp', [])
        .controller('umrynFmCtrl', umrynFmCtrl);
    
    umrynFmCtrl.$inject = ['$scope'];

    function umrynFmCtrl($scope) {
        
        var defaultVolume = .5;
        var getTrackInterval = 10000;
        var started = false;
        var soundCloudClientId = '9ee333b2c2772349b9126ae06c1f3280';
        var soundCloudUserId = '11749564';
        
        $scope.currentTrack;
        $scope.currentPlayer;
        $scope.volume = defaultVolume*100;
        $scope.tracks = [];
        $scope.nowPlaying = '';
        
        $scope.setVolume = function() {
            $scope.currentPlayer.setVolume($scope.volume/100)
        };
        
        $scope.nextTrack = function() {
            $scope.currentPlayer.pause();
            playRandomTrack();
        };
        
        function getQueryVariable(subject, variable) {
            var vars = subject.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
            return false;
        }
        
        function getRandomTrack() {
            var min = 0;
            var max = $scope.tracks.length;
            var random = Math.floor(Math.random() * (max - min + 1)) + min;
            return $scope.tracks[random];
        }
        
        function playTrack(trackObject) {
            $scope.currentTrack = trackObject;
            
            SC.stream('/tracks/' + trackObject.id).then(function(player){
                playerSetup(player);
                
                player.setVolume(defaultVolume);
                player.play();
            });
        }
        
        function playRandomTrack() {
            console.log('play random track');
            var randomTrack = getRandomTrack();
            console.log(randomTrack);
            playTrack(randomTrack);
        }
        
        function playerSetup(playerObject) {
            $scope.currentPlayer = playerObject;
            playerObject.setVolume($scope.volume/100);
            playerObject.on('finish', function() {
                playRandomTrack();
            });
        }
        
        function getTracks(cursor) {
            if (!cursor) cursor = '';
            
            SC.get('/users/' + soundCloudUserId + '/favorites', {limit: 100, linked_partitioning: 1, cursor: cursor}).then(function(response) {
                var tracks = response.collection;
                var nextHref = response.next_href;
                
                if  (tracks) {
                    var newTracks = $scope.tracks;
                    
                    for (var i = 0; i < tracks.length; i++) {
                        newTracks.push(tracks[i]);
                    }
                    
                    $scope.$apply(function () {
                        $scope.tracks = newTracks;
                    });
                }
                
                if (nextHref) {
                    var nextCursor = getQueryVariable(nextHref, 'cursor');
                    setTimeout(function() {
                        console.log('get more tracks');
                        getTracks(nextCursor);
                    }, getTrackInterval);
                }
                
                if (!started) {
                    started = true;
                    playRandomTrack();
                }
            });
        }
        
        // Init
        
        SC.initialize({client_id: soundCloudClientId});
        
        getTracks();
    }

})();
