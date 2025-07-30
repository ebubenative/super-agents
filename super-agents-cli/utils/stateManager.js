const fs = require('fs');
const path = require('path');

const stateFilePath = path.join(process.cwd(), '.super-agents', 'state.json');

function getState() {
    if (!fs.existsSync(stateFilePath)) {
        console.error('State file not found. Please run "sa parse" first.');
        process.exit(1);
    }
    const content = fs.readFileSync(stateFilePath, 'utf8');
    return JSON.parse(content);
}

function saveState(state) {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

module.exports = {
    getState,
    saveState
};