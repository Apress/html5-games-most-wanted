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


$tempNum=$_POST[score];
$tempName =$_POST[name];

$sql = "INSERT INTO $dbtable (score, name)
VALUES ('$tempNum', '$tempName')";
	

if (!mysql_query($sql,$con))
  {
  die('Error: ' . mysql_error());
  }

mysql_close($con)


?>

 