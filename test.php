<?php
if (isset($_GET)) {
  $file = 'db.txt';
  $current = file_get_contents($file);
  $lines = explode("\n", $current);
  $line = $lines[$_GET["index"] - 1];
  $id = explode(",", $line)[0];

  echo $id;
} else echo "File not selected";
