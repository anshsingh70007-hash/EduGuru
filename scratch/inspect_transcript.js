const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
    lineNum++;
    if ([3606, 3610, 3614, 3620, 3626, 3634, 3638, 3642, 3646, 3650].includes(lineNum)) {
        try {
            const obj = JSON.parse(line);
            if (obj.tool_calls) {
                const tc = obj.tool_calls[0];
                const args = tc.args || (tc.function ? tc.function.arguments : {});
                console.log(`\n=== Line ${lineNum} ===`);
                console.log('Tool:', tc.name || (tc.function ? tc.function.name : ''));
                console.log('Args:', JSON.stringify(args, null, 2));
            }
        } catch(e) {}
    }
});
