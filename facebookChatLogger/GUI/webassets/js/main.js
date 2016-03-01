var facebookChatLogViewer = angular.module('facebookChatLogViewer', []);

facebookChatLogViewer.filter('conversationIdentifier', function() {
  return function(conversations, query) {
    if (typeof query === 'undefined') query = "";
    var filtered = [];
    angular.forEach(conversations, function(conversation) {
      if (conversation.threadName.toLowerCase().indexOf(query.toLowerCase()) !== -1 || conversation.threadID.indexOf(query) !== -1) {
        filtered.push(conversation);
      }
    });
    return filtered;
  }
});

facebookChatLogViewer.controller('convoListCtrl', function($scope, $http) {

  $scope.loadThread = function(thread) {
    this.clickChangeThreadUsername(thread);
    document.getElementById('applicationName').innerHTML = "Loading...";
    $http({
      method: 'GET',
      url: '/logs/' + thread.threadID + ".log?_" //#dirty cache hacks
    }).then(function(response) {
      contents = response.data;
      contents = contents.replaceAll('<', '\<');
      contents = contents.replaceAll('>', '\>');
      contents = contents.replaceAll('\\\\n', '<br>');
      contents = contents.split('\n');
        
                document.getElementById('convoThread').innerHTML="";  

                
                // TODO: Split only X times in JS
                // Can make better        
        for (i=0;i<contents.length-1;i++) {
            // ^ "-1" ???
            line = contents[i];
            
                            var lnArr = line.split(" | ");
            
                if (lnArr.length < 6) {
                            var elem=document.createElement('div');
                    elem.classList.add('message_error');
                elem.innerHTML=JSON.stringify(lnArr);
                document.getElementById('convoThread').appendChild(elem);

                continue;         
            }
            if (lnArr.length!=6) {
                var metadata = lnArr.slice(0, 5);
                metadata.push(lnArr.slice(6).join(" | "));
            } else {
                var metadata = lnArr;
            }

                /*
                metadata[0] - epoch
                metadata[1] - authorID
                metadata[2] - authorName
                metadata[3] - eventCategory
                metadata[4] - eventType
                metadata[5] - eventData
                */
            var elem=document.createElement('span')            //
            
            //
            elem.classList.add(metadata[1]==myFacebookID ? "message_me" : "message_them");
            //
            try {
            if(metadata[3]=="CHAT") {
              elem.classList.add('message_chat')  
                switch(metadata[4]) {
                    case "MESSAGE":
                        elem.innerHTML=metadata[5];
                        break;
                    case "STICKER":
                        elem.innerHTML=metadata[5];
                        break;
                    case "IMAGE":
                        break;
                    case "FILE":
                        break;
                    default:
                        throw 'huh';
                }
                elem.classList.add('message_'+metadata[4].toLowerCase());
            } else {
                elem.classList.add('message_event');
            }
            } catch (e){alert(e)}
            
            //
            elemWrap = document.createElement('div')
            elemWrap.className=metadata[1]==myFacebookID ? "messageWrap_me" : "messageWrap_them";
            elemWrap.appendChild(elem)
document.getElementById('convoThread').appendChild(elemWrap);
            
                //res="<xdiv>"+metadata[0]+"</div>";

            
            
            //out += parseLine(line);
            
            } 

            //scroll to the bottom
            $("#convoThread").scrollTop($("#convoThread")[0].scrollHeight);
    document.getElementById('applicationName').innerHTML = "Facebook Chat Log Viewer";

    //  document.getElementById('convoThread').innerHTML = contents;
    }, function(response) {
      document.getElementById('convoThread').innerHTML = "error: " + response.status;
      document.getElementById('applicationName').innerHTML = "Facebook Chat Log Viewer";
    });
  }

  $scope.clickChangeThreadUsername = function(thread) {
    document.getElementById('active_chat_username').innerHTML = thread.threadName != thread.threadID ? thread.threadName + " (" + thread.threadID + ")" : thread.threadID;
  }

  $scope.timeFromEpoch = function(epoch) {
    if (typeof epoch === 'object') {
      date = query;
    } else {
      date = new Date(parseInt(epoch));
    }
    var dateNow = new Date();
    if (dateNow.toLocaleDateString() == date.toLocaleDateString()) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ampm;
      return strTime;
    } else {
      return date.getDate() + "/" + ((month = date.getMonth() + 1).toString().length == 1 ? "0" : "") + month;
    }
  }

  $scope.updateThreadList = function(boolFirstTime) {
    $http({
      method: 'GET',
      url: '/webassets/getThreadList.php',
      headers: (boolFirstTime ? {} : {
        'lhash': sessionStorage.hasOwnProperty('lhash') ? sessionStorage.getItem('lhash') : ''
      })
    }).then(function(response) {
      sessionStorage.setItem('lhash', response.headers('lhash'));
      if(boolFirstTime) {
          sessionStorage.setItem('iam', response.headers('iam'));
      }
      contents = [];
      for (i = 0; i < response.data.length; i++) {
        arr = response.data[i];
        contents.push({
          'threadID': arr[0],
          'threadName': arr[1],
          'epoch': arr[2],
          'lastEvent': arr[3]
        })
      }
      $scope.threads = contents;
    }, function(response) {
      if(response.status!=304 && response.status!="-1"){document.getElementById('convoThread').innerHTML = "error: " + JSON.stringify(response);}
    });
  }

  $scope.updateThreadList(true);

  setInterval($scope.updateThreadList, 10 * 1000);
});
