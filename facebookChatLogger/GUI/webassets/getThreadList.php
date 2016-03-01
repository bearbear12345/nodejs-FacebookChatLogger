<?php
  function resolveFacebookID($id, $ifError = "") {
    require 'config/threadID_resolver.php';
    $resolverArray = $listUsers + $listGroups;
    return array_key_exists($id, $resolverArray) ? $resolverArray[$id] : $ifError;
  }

  require 'lib/tailCustom.lib.php';
  require 'config/self.php';
  $output = array();
  foreach(glob("../logs/*.log") as $file) {
    $pieces = explode(" | ", tailCustom($file), 6);

    $threadID = basename($file, ".log");
    $epoch = $pieces[0];
    $authorID = $pieces[1];
    $authorName = $pieces[2];
    $eventCategory = $pieces[3];
    $eventType = $pieces[4];
    $eventData = $pieces[5];

    $threadName = resolveFacebookID($threadID, $threadID);

    $author = $myFacebookID == $authorID ? "You" : explode(" ", $authorName)[0];
    switch ($eventType) {
      case "MESSAGE":
        $lastEventString = $author . ": " . str_replace('\\n',' ',$eventData);
        break;
      case "STICKER":
        $lastEventString = $author . " sent a sticker.";
        break;
      case "IMAGE":
        $lastEventString = $author . " sent an image.";
        break;
      case "FILE":
        $lastEventString = $author . " sent a file " . $eventData . '.';
        break;
      case "JOIN":
        $lastEventString = $eventData;
        break;
      case "TITLE":
        $lastEventString = $author . " changed the thread title to " . $eventData . ".";
        break;
      case "LEAVE":
        $lastEventString = $eventData;
        break;
    }
    $output[] = array($threadID,
                      $threadName,
                      $epoch,
                      $lastEventString
                     );
  }
  $final = json_encode($output);
  if (isset($_SERVER['HTTP_LHASH']) && ($_SERVER['HTTP_LHASH'] == md5($final))) {
    header("HTTP/1.1 304 Not Modified");
  } else {
    header('lhash:'.md5($final));
  }
  echo $final;
?>