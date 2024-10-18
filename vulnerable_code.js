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
function complexFunction(a, b, c, d, e, f) {
    let result = 0;
    if (a > b) {
        if (c > d) {
            if (e > f) {
                result = a + c + e;
            } else {
                result = a + c + f;
            }
        } else {
            if (e > f) {
                result = a + d + e;
            } else {
                result = a + d + f;
            }
        }
    } else {
        if (c > d) {
            if (e > f) {
                result = b + c + e;
            } else {
                result = b + c + f;
            }
        } else {
            if (e > f) {
                result = b + d + e;
            } else {
                result = b + d + f;
            }
        }
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
    complexFunction,
    nullPointerDanger
};