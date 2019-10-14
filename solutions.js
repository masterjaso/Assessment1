

//********************************
// INPUT:   URL string
// OUTPUT:  JSON key-value object
//******************************** 
urlStringToJson = urlString => {
  //remove leading/trailing quotes - if any
  let cleanString = urlString.replace(/["']/g,'');
  
  //Return empty fast if nothing entered
  if(cleanString.length === 0) return {};
  
  //break url string apart by & segments
  let segments = cleanString.split('&');
  
  //Establish return results variable to capture key-value pairs
  let result = {};

  //Iterate over all segments, decodeURI, set to proper key-value
  for(seg of segments){
    let items = seg.split('=').map(x => decodeURI(x));

    //If we get a key with no value, set to '' 
    //(can handle differently if needed like outright rejecting or setting a default
    //value of null, undefined, etc...)
    if(items.length < 2) items.push('');
    
    //If key exists - handle array conversion and push
    if(result[items[0]]){
      //If it is already and array, push it onto the array
      if(Array.isArray(result[items[0]])) result[items[0]].push(items[1]);
      //If not an array, convert from key-value to key-array containing value, then push new value
      else{
        result[items[0]] = [ result[items[0]] ];
        result[items[0]].push(items[1]);
      }
    }
    //Add new key if it does not exist
    else{
      result[items[0]] = items[1];
    }
  }

  return result;
}


//********************************
// INPUT:   Two Strings to compare
// OUTPUT:  boolean
//******************************** 
isPermutation = (s1, s2) => {
  //Fail fast if different empty or different lengths
  if(s1.length === 0 || s2.length === 0 || s1.length !== s2.length) return false

  //Build full letter list/count from first string for comparison using key-value store
  let letters1 = {};
  for(let char of s1){
    if(letters1[char]) letters1[char] += 1;
    else letters1[char] = 1;
  }

  //Parse second string letters adding fast fails where appropriate to optimize speed
  let letters2 = {};
  for(let char of s2){
    //If letter doesn't exist in first list - return false
    if(!letters1[char]) return false;
    if(letters2[char]) letters2[char] += 1;
    else letters2[char] = 1;

    //If letter appears more often - return false
    if(letters2[char] > letters1[char]) return false;
  }

  //If length the same, no extra characters in 2nd string, 
  //or overcount due to redistribution, return true
  return true;
}


//********************************
// INPUT:   Array of values, async callback function to run on them, 
//          optional concurrency JSON object (default is unlimited)
// OUTPUT:  return array of outputs fromt he callback functions
//******************************** 
q3Func = async (arr, aFunc, conc = {concurrency: 0}) => {
  //Fail fast - needs to be Async function and array must be > 0 long
  if(aFunc.constructor.name !== "AsyncFunction") return Error('q3Func expects an async function!');
  if(arr.length === 0) return [];
  
  //If no concurrency set (or set to 0) do all together
  if(conc.concurrency === 0){
    //Map all array inputs to their async function counterpart
    let fArray = [];
    fArray = arr.map(x => aFunc(x));
    return await Promise.all(fArray)
      .then( (values) => {console.log(values)} );
  }
    
  //If concurrency set, handle running max concurrency and kicking off
  //new async function upon the completion of another
  else{
    //Establish management varialbes, results to hold result set from all aFuncs,
    //index to keep track of which array index, running to count concurrent executing aFuncs,
    //completed to keep track of the completed aFuncs
    let results = [];
    let index = 0;
    let running = 0;
    let completed = 0;

    //Non-blocking await based sleep function
    let sleep = (ms) => { return new Promise(resolve => setTimeout(resolve,ms)); }

    //Loop until all aFuncs return a result
    while(completed < arr.length){
      //If we have concurrency available and not out of range on arr, start new aFunc
      if(running < conc.concurrency && index < arr.length){
        aFunc(arr[index])
          .then( (res) => {
            //When aFunc completes push results to array, increment compelted, decrement running
            results.push(res);
            completed++;
            running--;
          })
          //Handle any errors caught
          .catch( (err) => {
            Error(`Error in q3Func an Async function has caused and Error: ${JSON.stringify(err)}`);
            results.push('ERROR');  //Generic handling, could return nothing or '' or other handling
            completed++;
            running--;
            return;
          });
        //When aFunc starts increase running and index count
        running ++;
        index++;
      }
      //If max concurrency or index out of range (all remaining running) await completion
      else await sleep(0);
    }
    console.log(results);
    return results;
  }
}


//********************************
// Class:       MyAPI
// Constructor: api main host endpoint string, host port, max concurrent requests 
// NOTE:        Uses Singleton pattern to prevent instantiating multiple 
//              instances to override rps limit
//******************************** 
const https = require('https');

class MyAPI{
  constructor(host, port, rpsMax){
    if(!MyAPI.instance){
      this.instance = this;
      this.rpsMax = rpsMax;
      this.rpsActive = 0;
      this.reqQueue = [];

      //Default params, and heavier mods could be made in function calls if necessary
      //for headers, cors, or other options/settings if necessary.
      this.reqParams = {
        hostname: host,
        port: port,
        headers: { 'Content-Type': 'application/json' },
        path: '/'
      }

      this.lastReq = Date.now();
      this.reqDelay = (1000/this.rpsMax).toFixed(3);
      this.reqQueueCount = 0;
    }
    
    return MyAPI.instance;
  }

  //Retrieve data from API endpoint
  async fetch(urlPath, method, data){
    let getParams = Object.assign({}, reqParams);
    getParams.path = urlPath;
    getParams.method = method;

    //determine currentWait if any
    let wait = (this.lastReq + this.reqDelay) - Date.now();
    let canRun = wait <= 0;
    //If time since last run is greater than wait period - run
    if(canRun) {
      this.lastRun = Date.now();
      if(data)
        await this.makeReq(getParams, data) 
      else
        await this.makeReq(getParams);
    }
    //Otherwise, we need to delay the call by the 'wait' difference and fire again
    else {
      setTimeout(async () => {
        if(data)
          await this.fetch(urlPath, method, data);
        else 
          await this.fetch(urlPath, method, data);
      }, wait);
    }
  }

  //Promisified https req function
  makeReq(params, postData) {
    return new Promise(function(resolve, reject) {
      var req = https.request(params, function(res) {
        // reject on bad status
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error('statusCode=' + res.statusCode));
        }
        // cumulate data
        var body = [];
        res.on('data', function(chunk) {
          body.push(chunk);
        });
        // resolve on end
        res.on('end', function() {
          try {
            body = JSON.parse(Buffer.concat(body).toString());
          } catch(e) {
            reject(e);
          }
          resolve(body);
        });
      });
      
      // reject on request error
      req.on('error', function(err) { 
        reject(err); 
      });
      

      if (postData) { req.write(postData); }
      // IMPORTANT
      req.end();
    });
  }
}

module.exports.urlStringToJson = urlStringToJson;
module.exports.isPermutation = isPermutation;
module.exports.q3Func = q3Func;
module.exports.MyAPI = MyAPI;