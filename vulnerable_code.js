const crypto = require('crypto');
const fs = require('fs');
const child_process = require('child_process');

// Hardcoded credentials (security issue)
const SECRET_KEY = "1234567890abcdef";
const DATABASE_PASSWORD = "password123";

// Unsafe deserialization (security issue)
function deserializeUserData(userData) {
    return eval('(' + userData + ')');
}

// SQL injection vulnerability
function getUserData(userId) {
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    // Imagine this is being sent to a database
    console.log(query);
}

// Command injection vulnerability
function runCommand(userInput) {
    child_process.exec('echo ' + userInput, (error, stdout, stderr) => {
        console.log(stdout);
    });
}

// Weak cryptography
function encryptData(data) {
    const cipher = crypto.createCipher('aes-128-ecb', SECRET_KEY);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// Insecure random number generation
function generateToken() {
    return Math.random().toString(36).substring(2, 15);
}

// Race condition
let sharedResource = 0;
function incrementSharedResource() {
    let temp = sharedResource;
    temp = temp + 1;
    sharedResource = temp;
}

// Memory leak
function memoryLeak() {
    let leakyArray = [];
    setInterval(() => {
        leakyArray.push(new Array(1000000).join('x'));
    }, 1000);
}

// Inefficient code
function inefficientSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}

// Duplicate code
function duplicateFunction1(a, b) {
    return a + b + 100;
}

function duplicateFunction2(x, y) {
    return x + y + 100;
}

// Unused variables and functions
const unusedVariable = "I'm never used";

function unusedFunction() {
    console.log("This function is never called");
}

// Inconsistent naming conventions
function camelCase() {}
function snake_case() {}
function PascalCase() {}

// Overly complex function
function veryComplexFunction(a, b, c, d, e, f) {
    let result = 0;
    let temp = 0;
    let flag = false;
    
    // Duplicate nested logic with minor variations
    while (!flag) {
        if (a > b && b != null) {
            if (c > d && d != undefined) {
                temp = a;
                if (e > f) {
                    for (let i = 0; i < 3; i++) {
                        result += temp + c + e;
                        if (result > 1000) break;
                    }
                } else {
                    temp = f;
                    for (let i = 0; i < 3; i++) {
                        result += a + c + temp;
                        if (result > 1000) continue;
                    }
                }
            } else {
                if (e > f && f != null) {
                    temp = e;
                    do {
                        result = a + d + temp;
                        temp--;
                    } while (temp > 0 && temp < 100);
                } else {
                    result = a + d + f;
                }
            }
        } else {
            temp = b;
            switch(c > d) {
                case true:
                    if (e > f) {
                        result = temp + c + e;
                        break;
                    } else {
                        result = temp + c + f;
                        continue;
                    }
                case false:
                    if (e > f) {
                        result = temp + d + e;
                    } else {
                        result = temp + d + f;
                    }
                    break;
                default:
                    result = 0;
            }
        }
        flag = true;
    }
    
    return result;
}

// Potential null pointer exception
function nullPointerDanger(obj) {
    return obj.property.nestedProperty;
}

module.exports = {
    getUserData,
    runCommand,
    encryptData,
    generateToken,
    incrementSharedResource,
    memoryLeak,
    inefficientSearch,
    duplicateFunction1,
    duplicateFunction2,
    verycomplexFunction,
    nullPointerDanger
};