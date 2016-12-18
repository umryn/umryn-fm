(function() {
    'use strict';

    var app = angular
        .module('umrynFmApp', ['rzModule'])
        .filter('artworkSmall', artworkSmall)
        .filter('artworkHuge', artworkHuge)
        .controller('umrynFmCtrl', umrynFmCtrl);
    
    umrynFmCtrl.$inject = ['$scope'];

    function umrynFmCtrl($scope) {
        
        var defaultVolume = .5;
        var getTrackInterval = 10000;
        var historyLength = 20;
        var soundCloudClientId = '9ee333b2c2772349b9126ae06c1f3280';
        var soundCloudUserId = '11749564';
        
        var started = false;
        
        $scope.currentTrack;
        $scope.currentPlayer;
        $scope.volume = defaultVolume*100;
        $scope.tracks = [];
        $scope.history = [];
        $scope.nowPlaying = '';
        $scope.loop = false;
        
        $scope.setVolume = function() {
            setVolume();
        };
        
        $scope.nextTrack = function() {
            $scope.currentPlayer.pause();
            playRandomTrack();
        };
        
        $scope.togglePlay = function() {
            if ($scope.currentPlayer._isPlaying) {
                $scope.currentPlayer.pause();
            } else {
                $scope.currentPlayer.play();
            }
        };
        
        $scope.toggleLoop = function() {
            $scope.loop = !$scope.loop;
        }
        
        $scope.isPlaying = function() {
            return $scope.currentPlayer._isPlaying;
        }
        
        $scope.$watch('volume', function() {
            $scope.setVolume();
        });
        
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
        
        function setVolume() {
            var currentVolume = $scope.volume;
            var base = 5;
            var curvedValue = (Math.pow(base, currentVolume / 100) - 1) / (base - 1);
            $scope.currentPlayer.setVolume(curvedValue)
        }
        
        function canPlayTrack(track) {
            return $scope.history.indexOf(track) == -1;
        }
        
        function addTrackToHistory(track) {
            $scope.history.unshift(track);
            
            if ($scope.history.length > historyLength) {
                $scope.history = $scope.history.slice(0, historyLength);
            }
        }
        
        function getRandomTrack() {
            var min = 0;
            var max = $scope.tracks.length;
            var random = Math.floor(Math.random() * (max - min + 1)) + min;
            return $scope.tracks[random];
        }
        
        function playTrack(trackObject) {
            $scope.currentTrack = trackObject;
            $scope.nowPlaying = ': ' + trackObject.user.username + ' - ' + trackObject.title;
            
            addTrackToHistory(trackObject);
            
            SC.stream('/tracks/' + trackObject.id).then(function(player){
                playerSetup(player);
                player.play();
            });
        }
        
        function playRandomTrack() {
            console.log('play random track');
            
            var randomTrack = getRandomTrack();
            
            if (!canPlayTrack(randomTrack)) {
                console.log('track is in history');
                playRandomTrack();
            }
            
            playTrack(randomTrack);
        }
        
        function playerSetup(playerObject) {
            $scope.currentPlayer = playerObject;
            
            setVolume();
            
            playerObject.on('finish', function() {
                if ($scope.loop) {
                    playerObject.pause();
                    playerObject.seek(0);
                    playerObject.play();
                } else {
                    playRandomTrack();
                }
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
    
    function artworkSmall() {
        return function(x) {
            return x.replace('large', 'small');
        };
    }
    
    function artworkHuge() {
        return function(x) {
            return x.replace('large', 't500x500');
        }
    }

})();
