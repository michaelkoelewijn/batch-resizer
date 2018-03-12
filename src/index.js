const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var express = require("express");
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var sharp = require('sharp');
var archiver = require('archiver');

const PORT = process.env.PORT || 5000;

var mainWindow;
app.on('ready', async function() {
    
    var app = express();
    var upload = multer();

    // Serve static files from the React app
    app.use(express.static(path.join(__dirname)));

    app.get('/', function (req, res) {
        
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.post('/upload', upload.single('image'), async function(req, res) {
        const { archiveName, size, name } = req.body;

        var dir = `${__dirname}/resized/${archiveName}`
        if (!fs.existsSync(dir)){
            await fs.mkdirSync(dir);
        }
        var filepath = `${dir}/${name}`;
        var fileContent = await sharp(req.file.buffer).resize(parseInt(size)).toBuffer();

        fs.writeFile(filepath, fileContent, (err) => {
            if (err) throw err;

            console.log(`The file ${name}  was succesfully saved at ${Date.now()}`);
        }); 

        res.sendStatus(200);
        
    });

    app.get('/download/:id', async function(req, res) {
        var zip = archiver('zip');
        
        // create a file to stream archive data to.
        var output = fs.createWriteStream(__dirname + '/resized.zip');
        var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function() {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            res.download(__dirname + '/resized.zip', function(err){
                rimraf(path.join(__dirname, 'resized',req.params.id))
                fs.unlinkSync(path.join(__dirname,'resized.zip'));
            });
        });

        output.on('end', function() {
            console.log('Data has been drained');
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
            // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function(err) {
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(path.join(__dirname, 'resized',req.params.id), false);
        // archive.append('string cheese!', { name: 'file2.txt' });
        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();        
    })

    const server = app.listen(PORT, (err) => {
        if (err) throw err
        console.log(`> Ready on http://localhost:${PORT}`)
    })


    var url = `http://localhost:${PORT}/`;
    var options = {

        height: 800,
        webPreferences: {
          nodeIntegration: false
        }
    };

    var main = new electron.BrowserWindow(options);
    // main.webContents.openDevTools();
    main.loadURL(url);
    main.on("closed", electron.app.quit);
   
});

function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}