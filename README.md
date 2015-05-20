# guardabosques Web

## What is this repository for? ##
* This is a web client for the guargabosques API (https://github.com/nadimix/guardabosques-api)
* The key element is the **guardabosques.js** plugin. It allows:
  * Download a file from more than one origin at the same time with priority (configurable).
  * Recover a chunk of the file in case of server failure.
  * Uses a manifest from the API in order to download the diferent pieces and then returns a download link in blob format.
