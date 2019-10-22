// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')
var handlebars = require('handlebars')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        var sql = "select * from Consumption where year = ?"
        var params = [2017]
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('An error occurred: ' + err.message);
                return;
            }
            //console.log('MY ROWS:', rows)
            let coal = rows.map(energy => energy.coal)
            // console.log('MY COAL:', coal)
            let coal_count = coal.reduce((previous, current) => previous + current);
            // console.log('MY TOTAL COAL:', coal_count)

            let natural_gas = rows.map(energy => energy.natural_gas)
            let natural_gas_count = natural_gas.reduce((previous, current) => previous + current);

            let nuclear = rows.map(energy => energy.nuclear)
            let nuclear_count = nuclear.reduce((previous, current) => previous + current);

            let petroleum = rows.map(energy => energy.petroleum)
            let petroleum_count = petroleum.reduce((previous, current) => previous + current);

            let renewable = rows.map(energy => energy.renewable)
            let renewable_count = renewable.reduce((previous, current) => previous + current);

            const totalEnergey = {
                coal_count: `${coal_count}`,
                natural_gas_count: `${natural_gas_count}`,
                nuclear_count: `${nuclear_count}`,
                petroleum_count: `${petroleum_count}`,
                renewable_count: `${renewable_count}`,
                rows
            }
            const modifiedResponse = handlebars.compile(response)
            response = modifiedResponse(totalEnergey)
            WriteHtml(res, response);
        });
        return;
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
        var sql = "select * from Consumption where year = ?"
        var { selected_year } = req.params; // DESTRUCTURE

        var params = [selected_year]

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('An error occurred: ' + err.message);
                return;
            }
            if (rows.length === 0) {
                WriteHtml(res, `Error: no data for Year ${selected_year}`);
                return
            }

            let coal = rows.map(energy => energy.coal)
            let coal_count = coal.reduce((previous, current) => previous + current);

            let natural_gas = rows.map(energy => energy.natural_gas)
            let natural_gas_count = natural_gas.reduce((previous, current) => previous + current);

            let nuclear = rows.map(energy => energy.nuclear)
            let nuclear_count = nuclear.reduce((previous, current) => previous + current);

            let petroleum = rows.map(energy => energy.petroleum)
            let petroleum_count = petroleum.reduce((previous, current) => previous + current);

            let renewable = rows.map(energy => energy.renewable)
            let renewable_count = renewable.reduce((previous, current) => previous + current);

            rows.map(eachState =>{
                let sum = eachState.coal + eachState.natural_gas + eachState.nuclear + eachState.petroleum + eachState.renewable;
                eachState.energy_sum = sum;
                return eachState
            })
            // console.log('NEW ROWS:', rows)

            let previous_year = Number(selected_year) === 1960 ? Number(selected_year) : Number(selected_year) - 1 // TENARY OPERATOR
            let next_year = Number(selected_year) === 2017 ? Number(selected_year) : Number(selected_year) + 1

            const totalEnergy = {
                coal_count: `${coal_count}`,
                natural_gas_count: `${natural_gas_count}`,
                nuclear_count: `${nuclear_count}`,
                petroleum_count: `${petroleum_count}`,
                renewable_count: `${renewable_count}`,
                selected_year: `${selected_year}`,
                previous_year: `${previous_year}`,
                next_year: `${next_year}`,
                rows
            }
            const modifiedResponse = handlebars.compile(response)
            response = modifiedResponse(totalEnergy)
            WriteHtml(res, response);
        })
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);
