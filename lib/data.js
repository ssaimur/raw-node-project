// dependencies
const fs = require('fs');
const path = require('path');

const lib = {};

// get the basedir
lib.basedir = path.join(__dirname, '/../.data/');

// write data to the file
lib.create = (dir, file, data, callback) => {
  fs.open(`${lib.basedir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // convert data to string
      const stringData = JSON.stringify(data);

      // write data to the file and then close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback('Error occured closing the file');
            }
          });
        } else {
          callback('Error writing new file');
        }
      });
    } else {
      callback('the file already exists, cannot create the file');
    }
  });
};

// read data from file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.basedir + dir}/${file}.json`, 'utf-8', (err, data) => {
    callback(err, data);
  });
};

// update data from the file
lib.update = (dir, file, data, callback) => {
  // opne the file for writing
  fs.open(`${lib.basedir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    // check if there is no error
    if (!err && fileDescriptor) {
      // convert data to string
      const stringData = JSON.stringify(data);

      // truncate the file
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          // write data in the file
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              // close the file after writing
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing the file');
                }
              });
            } else {
              callback('Error writing the file');
            }
          });
        } else {
          callback('Error truncating');
        }
      });
    } else {
      callback('Error updating, file may not exists');
    }
  });
};

// delete etire file
lib.delete = (dir, file, callback) => {
  // unlink file
  fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting the file');
    }
  });
};

// list all the check files
lib.list = (dir, callback) => {
  fs.readdir(`${lib.basedir + dir}/`, (err, files) => {
    if (!err && files && files.length > 0) {
      const trimmmedFileNames = [];
      files.forEach((file) => {
        trimmmedFileNames.push(file.replace('.json', ''));
      });
      callback(null, trimmmedFileNames);
    } else {
      callback('cannot read directory');
    }
  });
};

module.exports = lib;
