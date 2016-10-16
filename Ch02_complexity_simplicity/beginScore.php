<?php

$dbhost = 'localhost';
$dbuser = 'user';
$dbpass = 'pass';
$dbname = 'name';
$dbtable = 'test';


$con = mysql_connect($dbhost,$dbuser,$dbpass);
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db($dbname, $con);


$query = "SELECT * FROM `$dbtable` ORDER BY score DESC, name ASC";

$result = mysql_query($query);

while($row = mysql_fetch_array($result)){ 
		echo $row['score'].",".$row['name'].":";
}

mysql_close($con)


?>