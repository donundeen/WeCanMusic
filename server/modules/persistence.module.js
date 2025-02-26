// Handle storage and retreival of data

const fs = require('node:fs');
const { readFileSync } = require('fs');

class Persistence  {

    constructor(options){   
        this.storageDir = "persistence";
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
    }

    generateFilename(name){
        return this.storageDir + "/"+name+".json";
    }


    getJSON(name){
        let path = this.generateFilename(name);
        try{
            const datastring = readFileSync(path);
            let data = JSON.parse(datastring);        
            return data;
        }catch(e){
            console.log("file load error ", e);
            return false;
        }
    }

    saveJSON(name, json){
        let path = this.generateFilename(name);
        try {
            writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');
            console.log('Data successfully saved to disk');
            return true;
        } catch (error) {
            console.log('An error has occurred ', error);
            return false;
        }
    }
}

module.exports = Persistence;