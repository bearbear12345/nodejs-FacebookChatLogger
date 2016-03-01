<!DOCTYPE html>
<html ng-app="facebookChatLogViewer">
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="webassets/css/main.css">
    <link rel="stylesheet" href="webassets/css/animations.css">
    <!--<link rel="stylesheet" href="webassets/css/jquery.resizableColumns.css">-->
    <link rel="stylesheet" href="webassets/css/offline-theme-slide.css">
    <link rel="stylesheet" href="webassets/css/offline-language-english.css">
    <script src="webassets/js/angular-1.5.0-rc.0/angular.js"></script>
    <script src="https://cdn.rawgit.com/Luegg/angularjs-scroll-glue/master/src/scrollglue.js"></script>
    <script src="webassets/js/jquery-2.2.0.min.js"></script>
    <!--<script src="webassets/js/jquery.resizableColumns.min.js"></script>-->
    <script src="webassets/js/utils.js"></script>
    <script src="webassets/js/offline.min.js"></script>
    <script src="webassets/js/main.js"></script>
    <script><?php require 'webassets/config/self.php'; echo 'var myFacebookID=' . $myFacebookID;?></script>
    <title>Facebook Chat Log</title>
  </head>
  <body>
    <div id="container" class="expandOpen">
      <div id="header">
        <div id="applicationName">Facebook Chat Log Viewer</div>
        <div id="active_chat_username"></div>
      </div>
      <div id="content">
        <div id="convoList">
          <input id="convoList_searchBar" ng-model="query" placeholder="Search for thread ..." >
          <div id="convoListCtrl" ng-controller="convoListCtrl">
            <div threadID="{{thread.threadID}}" class="convoList_entry" ng-click="loadThread(thread)" ng-repeat="thread in threads | conversationIdentifier:query | orderBy:'-epoch'">
              <div class="convoList_entry_thread">{{thread.threadName||thread.threadID}}</div>
              <div class="convoList_entry_timestamp" epoch="">{{timeFromEpoch(thread.epoch)}}</div>
              <div class="convoList_entry_lastevent">{{thread.lastEvent}}</div>
            </div>
            </div>
        </div>
        <div id="convoThread" scroll-glue></div>
      </div>
    </div>    
  </body>
</html>
