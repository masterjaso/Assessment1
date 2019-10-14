var expect  = require('chai').expect;
const assert = require('assert');
var {urlStringToJson, isPermutation, q3Func, MyAPI} = require('./solutions');

it('Convert URL String to JSON Object', (done) => {
  let mockURLs = [
    `"a=1&b=2&a=hello&apple=9&apple=digital"`,
    `"a=1&b=2&c=hello&d=9&e=digital"`,
    `"a=1&b=2&c=hello&d=9&e=digital&a=1&b=2&c=hello&d=9&e=digital%20device"`,
    `"a=1&b=2&c=hello&d=9&e=digital&a=3&b=3&c=bye&d=11&e=digital&a=1&b=2&c=so&d=9&e=digital%20device"`
  ]

  let solutions = [
    { "a": ["1","hello"], "b": "2", "apple": ["9","digital"] },
    { "a": "1", "b": "2", "c": "hello", "d": "9", "e": "digital" },
    { "a": ["1","1"], "b": ["2", "2"], "c": ["hello", "hello"], "d": ["9", "9"], "e": ["digital", "digital device"] },
    { 
      "a": ["1","3", "1"], 
      "b": ["2", "3", "2"], 
      "c": ["hello", "bye", "so"], 
      "d": ["9", "11", "9"], 
      "e": ["digital", "digital", "digital device"] 
    }
  ];

  for(let i = 0; i < mockURLs.length; i++){
    assert.deepEqual(urlStringToJson(mockURLs[i]), solutions[i]);
  }
  done();
});

it('Determines if 2 strings are permutations of each other', (done) => {
  let mocksTrue = [
    //True cases
    ['bad credit','debit card'],
    ['bad credit','card debit'],
    ['aaabbbccc','bbaaccabc'],
    ['taco cat','cat taco']
  ];

  let mocksFalse = [
    //False cases
    ['bad credit','debitcard'],
    ['bad credit','card  ebit'],
    ['aaabbbcc','bbaaccabcddee'],
    ['taco cat','cattaco'],
  ]

  for(let mock of mocksTrue){
    expect(isPermutation(mock[0], mock[1])).to.equal(true);
  }
  for(let mock of mocksFalse){
    expect(isPermutation(mock[0], mock[1])).to.equal(false);
  }
  done();
});

it('Takes array, async func, and optional concurrency', () => {
  let arr = [1,2,3];
  let fn = async val => val + 1;
  let c = { concurrency: 2 };
  let solution = [2,3,4];

  q3Func(arr, fn, c)
    .then( (res) => {
      expect(res).to.deep.equal(solution);
    })
    .catch( (e) => {
      console.log('Error: ', e);
    });
});

it('Creates MyAPI and manages concurrency properly', () => {
  let maxRPS = 500;
  let api = new MyAPI('localhost', 8443, maxRPS);

  //Did not actually write a server, but would need a localhost server to test
  let server = createServer => console.log('Server is listening...');
  server();

  let cnt = 0;
  let start = Date.now();

  while(Date.now() < (start + 10000)){
    cnt++;
    api.fetch('/test', 'GET');
  }

  //Setting response threshold to be between 95 and 100% of max RPS
  expect(cnt).to.be.at.least(maxRPS * .95) && expect(cnt).to.be.at.most(maxRPS);
  done();
});