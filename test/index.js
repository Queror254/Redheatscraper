const reddit = require('./reddit');

(async () => {
    await reddit.initialize('hiring');

    let results = await reddit.getResults(10)

})();